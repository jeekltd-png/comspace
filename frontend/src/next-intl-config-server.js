// Lightweight server-side adapter for next-intl to return the project's
// next-intl config without requiring next-intl to search the filesystem.
// This prevents "Couldn't find next-intl config file" errors during prerender.
const config = require('../next-intl.config.js');

async function getConfig() {
  return config;
}

module.exports = getConfig;
module.exports.Z = getConfig;
module.exports.default = getConfig;
