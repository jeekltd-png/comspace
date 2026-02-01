// Temporary local fallback patch for next-intl :
// When next-intl throws because it couldn't find a config file, this module
// attempts to read a repo-level next-intl.config.js/.mjs and provide a
// minimal fallback object containing `locale` and `messages` to avoid hard
// prerender failures during builds.

const fs = require('fs');
const path = require('path');

function readNextIntlConfig() {
  const candidates = [
    path.join(process.cwd(), 'next-intl.config.mjs'),
    path.join(process.cwd(), 'next-intl.config.js'),
    path.join(process.cwd(), 'frontend', 'next-intl.config.mjs'),
    path.join(process.cwd(), 'frontend', 'next-intl.config.js'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        // use require for .js, dynamic import for .mjs
        if (c.endsWith('.js')) return require(c);
        // naive dynamic evaluation of .mjs - not perfect, but works as a fallback in Node environment
        const content = fs.readFileSync(c, 'utf8');
        const match = content.match(/default\s*=\s*(\{[\s\S]*\})/m);
        if (match) {
          // eslint-disable-next-line no-eval
          const obj = eval('(' + match[1] + ')');
          return obj;
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return null;
}

module.exports = function applyNextIntlFallback() {
  try {
    const serverPath = require.resolve('next-intl/dist/production/server.react-server');
    const server = require(serverPath);
    if (!server || !server.getRequestConfig) return false;
  } catch (e) {
    return false;
  }

  // Monkey patch getRequestConfig behavior at runtime (temporary)
  try {
    const getRequestConfigPath = require.resolve('next-intl/dist/production/server/react-server/getRequestConfig.js');
    let code = fs.readFileSync(getRequestConfigPath, 'utf8');
    if (!code.includes('FALLBACK_NEXT_INTL')) {
      const insert = `\n// FALLBACK_NEXT_INTL: injected by Comspace to provide a temporary safe fallback when config missing\n` +
        "function tryReadConfigFallback(){try{return (require('../../../../../../next-intl.config.js'));}catch(e){}return null;}\n" +
        "const _orig = exports.default;\nexports.default = function(getRequestConfig){return async function(){try{return await _orig(getRequestConfig).apply(this,arguments);}catch(e){const fallback = tryReadConfigFallback();if(fallback && fallback.defaultLocale){console.warn('[next-intl] Using fallback defaultLocale', fallback.defaultLocale); return { locale: fallback.defaultLocale, messages: {} };}throw e;}}}(_orig);\n";
      fs.appendFileSync(getRequestConfigPath, insert, 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};
