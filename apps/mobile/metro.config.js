const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports resolution to avoid Hermes "runtime not read" errors
// (e.g. Babel helpers resolving as ESM when they should be CommonJS).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
