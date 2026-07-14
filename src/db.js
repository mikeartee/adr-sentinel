// Data-access layer for the ADR Sentinel sample app.
//
// Per ADR-0001, PostgreSQL is the primary relational datastore, so this module
// uses the `pg` client. Swapping this to a competing datastore driver named in
// ADR-0001's Confirmation section (e.g. mongodb, mysql2) is what the ADR
// Sentinel guard is meant to catch.
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "adr_sentinel",
});

async function ping() {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0].ok === 1;
}

module.exports = { pool, ping };
