const db = require('./db');
const columns = db.prepare("PRAGMA table_info(airports)").all();
console.log(columns);