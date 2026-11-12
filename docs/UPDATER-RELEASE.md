# Updater delivery checklist — 1.0.2-demo

Verified November 11, 2026. This is the separate arcade evaluation demo; the main BLOODRUN archive and its 0.9.8 development version are separate.

## Release checks

- [x] Updater, privacy disclosure, public update statement and draft-build workflow implemented.
- [x] Four updater unit tests passed. Node 20.20.0 renderer build, syntax, workflow YAML and whitespace checks passed.
- [x] Full Playwright acceptance suite: **80 passed**, no exclusions. Old tests were corrected to the current runtime: deliberate post-install launch, CSG completion heading, normal desktop shutdown, starting mercy pickup and the demo warranty wall. Runtime behavior was preserved.
- [x] Universal Mac release signed with the configured Developer ID fingerprint. Apple accepted submission `b916ea88-0eec-4e66-8f00-6e10fea43b8f`; app signature, staple and Gatekeeper assessment passed.
- [x] DMG installed into `/Applications/BLOODRUN DEMO.app`. The installed copy completed EULA/setup and remained responsive after the first updater interval using an isolated test profile.
- [x] Real Mac updater replacement passed against the exact release ZIP: unavailable feed, download, Later, normal quit without installation, explicit restart/install, updated version, preserved local state and startup with updater networking disconnected. Signature and staple also passed after replacement.
- [x] Exact uploaded Windows Setup installer passed SHA-512/size verification, silent NSIS installation, unavailable feed, download, Later, normal quit without installation, explicit restart/update, updated launch and state preservation on `windows-latest`.
- [x] Hosted Apple signing configured with `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`. Hosted Mac build, notarization, staple and Gatekeeper checks passed on `macos-15`.
- [x] Nine release assets plus `SHA256SUMS.txt` uploaded; asset names match the feeds. GitHub SHA-256 digests matched local files before publication.
- [x] Temporary certificate export/password and download-only verification secrets removed; installed app retained. Windows verification keeps `contents: read` permissions.
- [x] Published the reviewed prerelease and update statement on November 11, 2026. Both public feeds/assets are accessible without authentication. The unmodified Applications copy reports current/feed version `1.0.2-demo`, channel `demo`, with no unnecessary download.

Hosted evidence:

- Mac signing/notarization: https://github.com/Walter-Red-Books-LLC/bloodrun-arcade-demo/actions/runs/43143789436/job/130936755645
- Windows exact-installer verification: https://github.com/Walter-Red-Books-LLC/bloodrun-arcade-demo/actions/runs/43144354060/job/130938566536
- Published-version preservation check: https://github.com/Walter-Red-Books-LLC/bloodrun-arcade-demo/actions/runs/43145140990

## Evidence boundaries

The lower-version update fixtures contain the current updater with version `1.0.1-demo`; they are explicitly test fixtures, not the historical updater-free download. Mac uses the actual native Squirrel replacement and Windows uses the actual NSIS replacement. Automated tests inject the operator's Later/restart decision into the dialog API; they do not replace the downloader or installer. Test feeds, fixtures and profiles remain separate from the shipped app and normal user data.

Windows remains unsigned by the operator's decision. Automated Windows install/update validation passed; physical Windows hardware and SmartScreen interaction were not manually tested. The portable executable does not auto-update. Existing historical 1.0.1-demo users still require a one-time manual installation of 1.0.2-demo.

## Runtime and future releases

Packaged Mac and installed Windows copies check after 15 seconds, then every six hours. Downloads are automatic. Installation requires explicit restart confirmation; Later offers again after 30 minutes. Normal quit never installs. Development, Linux and Windows portable copies skip updating. No client GitHub token, no downgrade permission.

The public GitHub provider is `Walter-Red-Books-LLC/bloodrun-arcade-demo`, channel `demo`, with prereleases allowed. Preserve the app ID, certificate identity and state namespace across updates. Keep Mac ZIP/DMG/blockmaps/`demo-mac.yml` and Windows Setup/blockmap/`demo.yml`; DMG alone is insufficient for Mac delivery.

Tag-triggered and manual release builds upload drafts only. Published versions are preserved by a release-status gate: bump the version before building again. Publishing remains a reviewed step. `verify-demo-release.yml` can verify both platforms or retry one; before publication, temporary expiring asset URLs allow read-only Windows access to draft binaries, and are deleted after verification. Once published, normal read-only release downloads work.

For local Mac packaging use `APPLE_KEYCHAIN_PROFILE=bloodrun-notary` and `--publish never`. Hosted builds use GitHub secrets. `build/sign-mac.cjs` retains the selected fingerprint because the builder's default signing path otherwise passes an ambiguous duplicate certificate name.

## Files

Public release: https://github.com/Walter-Red-Books-LLC/bloodrun-arcade-demo/releases/tag/v1.0.2-demo

Local Mac files: `release/BLOODRUN DEMO-1.0.2-demo-universal.dmg` and `release/BLOODRUN DEMO-1.0.2-demo-universal-mac.zip`.

Local Windows files: `release/windows-1.0.2-demo/BLOODRUN DEMO Setup 1.0.2-demo.exe` and the portable `BLOODRUN DEMO 1.0.2-demo.exe`.
