const db = require('./db');

const id = Number(process.argv[2]);

// No id given: list sessions so you can find the one you want
if (!id) {
  const sessions = db.prepare(`
    SELECT sessions.id, sessions.date, sessions.session_number, airports.iata_code,
           (SELECT COUNT(*) FROM sightings WHERE sightings.session_id = sessions.id) AS sightings
    FROM sessions
    JOIN airports ON sessions.airport_id = airports.id
    ORDER BY sessions.date DESC
  `).all();
  console.table(sessions);
  console.log('Run again with a session id, e.g. node remove-session.js 12');
  process.exit(0);
}

const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
if (!session) {
  console.log('No session with id', id);
  process.exit(1);
}

const sightingCount = db.prepare('SELECT COUNT(*) AS count FROM sightings WHERE session_id = ?').get(id).count;
if (sightingCount > 0) {
  console.log(`Session ${id} has ${sightingCount} sighting(s). Not deleting.`);
  process.exit(1);
}

db.transaction(() => {
  db.prepare('DELETE FROM session_locations WHERE session_id = ?').run(id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
})();

console.log('Deleted session', id, `(${session.date})`);