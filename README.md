# pi-cp2cb

Pi extension for assistant responses that include fenced code blocks.

## What it does

Pi's extension API does not expose a clean click-handler for assistant markdown/code blocks in the TUI.
So this package ships the lazy version that actually works:

- when an assistant `message_end` contains a fenced code block like
  ```text
  /var/folders/0g/.../pi-clipboard-....png
  ```
  it copies that block to your clipboard automatically
- `/cp2cb-last` copies the last captured block again
- `/cp2cb-toggle` turns auto-copy on or off
- `/cp2cb-status` shows status

## Install

```bash
pi install /absolute/path/to/cp2cb
```

Or for quick testing:

```bash
pi -e ./cp2cb/cp2cb.ts
```

## Notes

- exact click-to-copy on assistant code blocks is not currently exposed by pi extension hooks
- this extension matches clipboard temp image paths first
- if there is exactly one single-line fenced code block, it copies that too
# pi-cp2cb
