"use strict";

// electron-builder 26 resolves the selected fingerprint, then its default
// signer passes only the ambiguous certificate name. Preserve the fingerprint.
exports.default = async function signMac(options) {
  if (!/^[A-Fa-f0-9]{40}$/.test(options.identity || "")) {
    throw new Error("macOS signing requires the configured certificate fingerprint");
  }
  await require("@electron/osx-sign").signAsync({ ...options, identityValidation: false });
};
