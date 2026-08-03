const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  // Enables CSS variable support (used by NativeWind v4)
  inlineRem: 16,
});
