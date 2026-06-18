<div align="center">

# ▲ BLOODRUN.exe — Arcade Cabinet

**Diagnostic Distribution · CSG-DSC-04A**
_Published by Quiet Mark Systems, Ltd. · Distributed by Catalyst Systems Group_

`EVALUATION DEMO · v1.0.0-demo`

</div>

---

> No representation is made as to the origin or fitness of the enclosed artifact.

A small, recovered arcade cabinet that wakes up red. **BLOODRUN.exe** is a side-scrolling
runner wrapped inside a diegetic Windows 95 desktop — boot it, accept the terms, watch it
install, and carry the signal as far as the cabinet will let you.

This repository is the **evaluation demo**: a deliberately bounded slice of the full cabinet,
sealed at the edges by an old warranty clause.

## What's in the demo

- **A full opening sequence** — EULA → InstallShield-style installer → BIOS boot → title.
- **Two playable sectors** — clear **CHAPEL**, then take a taste of **SLUICE**…
- **…then the wall.** Push past the licensed sectors and the cabinet trips its **WARRANTY VOID**
  notice. After that, only the first sector stays unsealed. The deeper rooms, the boss, and the
  ending are not part of this distribution.
- **Bonus material on the desktop:**
  - 🎵 **JUKEBOX.EXE** — a small media player with a spectrum visualizer, six tracks.
  - 📖 **The Little Runner** — a short story, read aloud, in its own reader.
  - 🖼️ **BONUS gallery** — recovered distribution inserts and source art.

Exiting a run powers the cabinet down and drops you back to the desktop; **Shut Down** closes
the machine.

## Play it

A signed & notarized **macOS** build (universal — Apple Silicon + Intel) is distributed
separately. When a public build is posted it will appear under
[Releases](../../releases). Because it's an evaluation remnant, expect things to be
discoverable rather than obvious.

## Run from source

Requires **Node 20.20.0** / **npm 11.10.1** (Volta-pinned).

```bash
npm install      # dev dependencies (React, esbuild, Electron, Playwright)
npm run dev      # build the bundle + launch the cabinet
```

Other scripts:

| Command | Does |
| --- | --- |
| `npm run build` | Bundle the renderer (`esbuild` → `dist/arcade.bundle.js`) |
| `npm run watch` | Rebuild on change |
| `npm run dev:gpu-off` | Launch with GPU acceleration disabled |
| `npm test` | Playwright acceptance suite |

## Build a distributable

```bash
npm run dist:mac-universal     # universal .app + .dmg + .zip → release/
```

The macOS target signs under a Developer ID and notarizes via the Apple notary service
(supply credentials through the standard `APPLE_*` environment variables or a Keychain
profile). Output lands in `release/` (git-ignored).

## How it's built

- **Electron** shell (`main.js`) serving all assets over a private `app://` protocol with a
  strict CSP — no `file://`, web security on.
- **React 18** renderer bundled by **esbuild** into a single file (no runtime `node_modules`).
- Packaged with **electron-builder** (`asar` disabled so the cabinet can stream its own audio).

## A note on the fiction

BLOODRUN.exe is a **fictional, simulated interactive artwork**. Catalyst Systems Group,
Quiet Mark Systems, CSG-DSC-04A, and all related designations are part of that fiction. It is
not a diagnostic, medical, or evaluative tool. It contains flashing imagery and simulated
horror themes — see the in-app EULA before operating.

<div align="center">

`▲-04-A-0117 · NO SCORE RECORDED`

</div>
