// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',   // e.g. postgres
  host: 'localhost',          // or your server host
  database: 'boundlessmoments',
  password: 'Appu@#9841',
  port: 5432,
});

module.exports = pool;