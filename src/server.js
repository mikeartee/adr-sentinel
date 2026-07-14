// Entry point for the ADR Sentinel sample app.
//
// A minimal HTTP server that exposes a health check backed by the PostgreSQL
// data-access layer in ./db.js. Nothing here needs to actually run for the ADR
// Sentinel sample — the files exist so architecturally-significant edits have a
// realistic place to land.
const express = require("express");
const { ping } = require("./db");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/health", async (_req, res) => {
  try {
    const ok = await ping();
    res.json({ status: ok ? "ok" : "degraded" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(port, () => {
  console.log(`adr-sentinel app listening on port ${port}`);
});

module.exports = app;
