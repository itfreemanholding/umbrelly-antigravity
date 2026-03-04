const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

// Check if tables exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS saved_jobs (
    id TEXT PRIMARY KEY,
    json_data TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS scanner_ideas (
    id TEXT PRIMARY KEY,
    query TEXT,
    matchesIncluded INTEGER,
    matchesTotal INTEGER,
    rejectionsExcluded INTEGER,
    rejectionsTotal INTEGER,
    dateSaved TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS outreach_ideas (
    id TEXT PRIMARY KEY,
    strategy TEXT,
    customPrompt TEXT,
    generatedText TEXT,
    dateSaved TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`).run();

module.exports = db;
