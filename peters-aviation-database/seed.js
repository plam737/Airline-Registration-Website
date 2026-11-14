const db = require('./db');
const fs = require('fs');

const seed = fs.readFileSync('seed-data.sql', 'utf8');
db.exec(seed);

console.log('Seed data inserted successfully!');