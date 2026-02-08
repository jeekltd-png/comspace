// Debug wrapper to catch startup errors
process.on('unhandledRejection', (err) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error(err);
  process.exit(1);
});

require('ts-node').register({ transpileOnly: true });
require('./src/server.ts');
