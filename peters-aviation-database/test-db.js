const db = require('./db');
console.log('Database created successfully!');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());