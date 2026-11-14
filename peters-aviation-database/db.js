const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = process.env.NODE_ENV === 'production' ? '/data/aviation.db' : 'aviation.db';
const db = new Database(dbPath);

const schema = fs.readFileSync('schema.sql', 'utf8');
db.exec(schema);

module.exports = db;