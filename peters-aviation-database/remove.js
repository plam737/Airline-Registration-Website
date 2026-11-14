const db = require('./db');
const sightings = db.prepare(`
  SELECT id FROM sightings
  WHERE registration_id = (SELECT id FROM registrations WHERE reg = 'VH-ZNE' AND airline_id = (SELECT id FROM airlines WHERE name = 'Qantas'))
  AND session_id = (SELECT id FROM sessions WHERE session_number = 46)
`).all();

console.log('Found', sightings.length, 'sightings - deleting all but one');
sightings.slice(1).forEach(s => {
  db.prepare('DELETE FROM sightings WHERE id = ?').run(s.id);
});
console.log('Done');