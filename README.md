# pi-cp2cb

Pi extension that auto-copies matching assistant code blocks to your clipboard.

## What it does

`cp2cb` watches assistant messages at `message_end` and copies the first matching fenced code block.

It prefers:

1. a fenced block containing a Pi clipboard temp image path like
   ```text
   /var/folders/.../pi-clipboard-123.png
   ```
2. otherwise, exactly one single-line fenced code block

It also adds a small status indicator and a few commands.

## Install

From this repo:

```bash
pi install /absolute/path/to/cp2cb
```

Or run it directly while testing:

```bash
pi -e ./cp2cb.ts
```

## Commands

- `/cp2cb-toggle` — turn auto-copy on or off
- `/cp2cb-last` — copy the last captured block again
- `/cp2cb-status` — show current status

## Config

State is stored at:

```text
~/.pi/agent/cp2cb-config.json
```

Default:

```json
{
  "enabled": true
}
```

## Limits

- Pi does not currently expose a direct click-to-copy hook for assistant markdown/code blocks in the TUI
- this extension only copies the first matching block from an assistant message
- multi-line non-image code blocks are ignored unless you change the matcher
