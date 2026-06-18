# BLOODRUN ARCADE — DEMO (evaluation slice)

Standalone demo build derived from `~/Desktop/bloodrun-arcade` (the JSX source repo).
Same Electron shell + esbuild pipeline; only the progression is capped.

## Flow
0. **EULA splash** (`DemoEula`, `screens-boot.jsx`) — real-world legal gate, shown FIRST.
   Tightened from the main project's `public/eula.html` (acceptance, evaluation license,
   restrictions, fictional/simulated, content advisory, no-data, AS-IS warranty disclaimer,
   liability cap, IP, termination, governing law, © line). Shown on EVERY launch (not flag-gated) —
   it is the unconditional initial screen. ACCEPT proceeds; DECLINE quits.
1. **Installer wizard** (welcome → license → dest → progress → finish) — fires after EULA on a fresh install.
   Finish → lands on the **desktop**. DEMO: no auto-launch and no phantom "hint" cursor — the
   "Run BLOODRUN.exe now" checkbox was removed; the player launches the arcade from the desktop icon
   themselves (`autoLaunch=false`, `hint=false` in `app.jsx`).
2. **Boot → License → Title → Game.**
   - **Title EXIT** and **in-game ESC** → cabinet **power-down** (`.crt-off` CRT collapse) → back to the
     Win95 **desktop** (does NOT quit). The desktop does NOT replay the BIOS boot on return
     (`bootedDesktop` → `skipStartup` prop). BIOS only plays on the genuine first boot / app launch.
   - **Desktop Start menu → Shut Down…** → closes the app (`onShutdown` in `app.jsx`).
   - The "uninstall not permitted" fiction is kept only for the file-manager uninstall attempt.
3. **Game (demo cap):**
   - **First run:** CHAPEL → a taste of SLUICE. Clearing SLUICE trips the **WARRANTY VOID** wall.
   - **After the wall:** only CHAPEL is playable. Reaching its end re-trips WARRANTY VOID.
   - Vault / Sanctum / the boss / the completion ending are never reachable in the demo.

## How the cap works (no game-logic forks)
The game still computes the next sector from the full `ZONE_ORDER`
(`screens-game.jsx`). The cap lives entirely in `app.jsx`:

- `DEMO` config block — `zonesBeforeVoid: ['chapel','sluice']`, `zonesAfterVoid: ['chapel']`.
- `onZoneChange` intercepts any advance outside the current cap → sets the
  `wr_holmn_arcade_demo_voided_v1` flag and routes to the `warranty` screen
  instead of advancing. Bosses (vault/sanctum only) are therefore never spawned.
- `DemoWarrantyVoid` (`screens-title.jsx`) — the wall. Acknowledging resets the
  active sector to CHAPEL and returns to TITLE.

To disable the cap (full build): set `DEMO.enabled = false` in `app.jsx`.

Dev tweaks panel: `WARR` screen jump + `DemoVoid` persistence readout + Reset clears the flag.

## Bonus content (wired — desktop icons)
All three live on the Win95 desktop (`screens-desktop-int.jsx`) as icons + windows,
sharing a self-contained `useAudioDeck` hook (audio torn down on unmount, so nothing
plays under the game runtime):
- **JUKEBOX.EXE** — `NoteIcon` → `JukeboxWindow`. 6 tracks from `audio/jukebox/*.mp3`
  with playlist, transport, seek, volume, and a Winamp-style **spectrum visualizer**
  (`SpectrumViz` + Web Audio AnalyserNode via `useAudioDeck({withAnalyser:true})`).
- **LITTLE_RUNNER.TXT** — `BookIcon` → `LittleRunnerWindow`. The short story (embedded
  `LITTLE_RUNNER_TEXT`) + audio reading (`assets/little_runner/*.mp3`). Cabinet-voice
  lines rendered in red mono.
- **BONUS** — `PictureIcon` → `GalleryWindow`. 5 images from `assets/bonus/` (2 mock ads,
  BR-000 plate, 2 sprite sheets) with thumbnail rail.

### Audio format
MP3 only. The 904 MB of FLAC dupes (`audio/flac/`, `audio/jukebox/flac/`, the reading
FLAC) were removed — too heavy to distribute and Chromium plays MP3 natively. Lossless
masters are kept locally by the owner.

### Packaging (electron-builder)
- `npm run dist:mac` → `release/`: the `.app` (`release/mac/`), a `.dmg`, and a `.zip`.
- `npm run dist:mac-dir` → just the `.app` (fast, no dmg/zip).
- Config in `package.json` `"build"`: **`asar:false`** (the `app://` handler streams MP3s from real
  files — asar would break that), `npmRebuild:false`, explicit `files` allowlist. React/react-dom are
  devDependencies (esbuild inlines them) so no `node_modules` ship in the app.
- `npm run dist:mac-universal` → universal (x86_64 + arm64) build.
- **Signed + notarized + stapled.** Signed with the project's Developer ID Application certificate
  (referenced by its SHA-1 hash in `package.json` → `mac.identity`) under hardened runtime
  (entitlements in `build/entitlements.mac.plist`). Notarized via the
  `bloodrun-notary` Keychain profile — set `APPLE_KEYCHAIN_PROFILE=bloodrun-notary` before the build
  and electron-builder notarizes + staples the app automatically. The dmg itself was additionally
  notarized+stapled via `xcrun notarytool submit … --keychain-profile bloodrun-notary` + `stapler staple`.
- Verified: `spctl -a -t exec` → **accepted / Notarized Developer ID**; `stapler validate` passes on
  both the .app and the .dmg. Opens with zero Gatekeeper friction anywhere, online or offline.
  (`spctl -t install` on a dmg reports "no usable signature" — that's the wrong probe for a dmg, not a defect.)
- To re-notarize after changes: `APPLE_KEYCHAIN_PROFILE=bloodrun-notary npm run dist:mac-universal`.

**Windows:** `npm run dist:win` → `release/`: a **portable** `BLOODRUN DEMO 1.0.0-demo.exe`
(no install — double-click to run) and an **NSIS installer** `BLOODRUN DEMO Setup 1.0.0-demo.exe`.
x64, icon from `build/icon.ico` (generated from `assets/demo-icon.png` via ImageMagick).
Cross-built from macOS — electron-builder v26 embeds the PE icon natively (no Wine needed).
**Unsigned** (no Windows code-signing cert) → SmartScreen "Windows protected your PC" on first
run → More info → Run anyway. Not launch-tested on macOS; smoke-test on real Windows before wide release.

### App icon
Built from `assets/demo-icon.png` (500×500). `build/icon.icns` (mac iconset) + `build/icon-256.png`.
Wired as `BrowserWindow.icon` and `app.dock.setIcon` (`main.js`) and as the page favicon
(`BLOODRUN.exe.html`). For a Windows build, generate `build/icon.ico` from the same source.

### Notes
- The "pdf" the owner expected in `assets/bonus/` was actually `BR-000.png` — already in the gallery.
