const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('aviation.db')

const schema = fs.readFileSync('schema.sql', 'utf-8');
db.exec(schema);

module.exports = db;