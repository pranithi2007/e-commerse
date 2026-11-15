/**
 * Database Seeder Entrypoint (Delegates to backend/seed.js)
 */
module.exports = require('./backend/seed');
if (require.main === module) {
  require('./backend/seed')();
}
