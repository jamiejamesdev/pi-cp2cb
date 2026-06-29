import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { copyToClipboard } from "@earendil-works/pi-coding-agent";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const CONFIG_PATH = join(homedir(), ".pi", "agent", "cp2cb-config.json");
const CODE_BLOCK_RE = /```(?:[\w.-]+)?\n([\s\S]*?)```/g;
const CLIPBOARD_IMAGE_PATH_RE = /^\/var\/folders\/.+\/pi-clipboard-[\w-]+\.(png|jpe?g|gif|webp)$/i;

type Config = { enabled: boolean };
type Match = { value: string; source: "clipboard-image-path" | "single-line-code-block" };

let config = loadConfig();
let lastMatch: Match | null = null;

function loadConfig(): Config {
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as Partial<Config>;
    return { enabled: parsed.enabled !== false };
  } catch {
    return { enabled: true };
  }
}

function saveConfig() {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function setStatus(ctx: { ui: { setStatus: (id: string, text?: string) => void } }) {
  ctx.ui.setStatus("cp2cb", `cp2cb ${config.enabled ? "on" : "off"}`);
}

function extractMatch(text: string): Match | null {
  const blocks = [...text.matchAll(CODE_BLOCK_RE)]
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);

  for (const block of blocks) {
    if (CLIPBOARD_IMAGE_PATH_RE.test(block)) {
      return { value: block, source: "clipboard-image-path" };
    }
  }

  if (blocks.length === 1 && !blocks[0]!.includes("\n")) {
    return { value: blocks[0]!, source: "single-line-code-block" };
  }

  return null;
}

async function copyMatch(match: Match, ctx: { ui: { notify: (text: string, level?: "info" | "warning" | "error" | "success") => void } }) {
  await copyToClipboard(match.value);
  lastMatch = match;
  ctx.ui.notify("copied", "success");
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    setStatus(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus("cp2cb", undefined);
  });

  pi.registerCommand("cp2cb-toggle", {
    description: "Enable or disable assistant code block auto-copy",
    handler: async (_args, ctx) => {
      config = { enabled: !config.enabled };
      saveConfig();
      setStatus(ctx);
      ctx.ui.notify(`cp2cb ${config.enabled ? "enabled" : "disabled"}`, "info");
    },
  });

  pi.registerCommand("cp2cb-last", {
    description: "Copy the last code block captured by cp2cb",
    handler: async (_args, ctx) => {
      if (!lastMatch) {
        ctx.ui.notify("No captured code block yet", "warning");
        return;
      }
      await copyMatch(lastMatch, ctx);
    },
  });

  pi.registerCommand("cp2cb-status", {
    description: "Show cp2cb status",
    handler: async (_args, ctx) => {
      setStatus(ctx);
      ctx.ui.notify(`cp2cb ${config.enabled ? "on" : "off"}${lastMatch ? `; last=${lastMatch.value}` : ""}`, "info");
    },
  });

  pi.on("message_end", async (event, ctx) => {
    setStatus(ctx);
    if (!config.enabled) return;
    if (event.message.role !== "assistant") return;
    if (!Array.isArray(event.message.content)) return;

    for (const part of event.message.content) {
      if (!part || part.type !== "text" || typeof part.text !== "string") continue;
      const match = extractMatch(part.text);
      if (!match) continue;
      try {
        await copyMatch(match, ctx);
      } catch (error) {
        ctx.ui.notify(`cp2cb failed: ${String(error)}`, "error");
      }
      return;
    }
  });
}
