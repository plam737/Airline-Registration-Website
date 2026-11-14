const express = require('express');
const db = require('./db');
const app = express();
app.use(express.static('public'));
const PORT = 1114;

app.get('/api/registrations', (req, res) => {
  const registrations = db.prepare(`
    SELECT
      registrations.id,
      registrations.reg,
      registrations.registration_number,
      registrations.notes,
      airlines.name AS airline_name,
      countries.name AS country_name,
      aircraft_types.code AS aircraft_code,
      aircraft_types.name AS aircraft_name
    FROM registrations
    JOIN airlines ON registrations.airline_id = airlines.id
    JOIN countries ON airlines.country_id = countries.id
    JOIN aircraft_types ON registrations.aircraft_type_id = aircraft_types.id
    ORDER BY countries.name, airlines.name, aircraft_types.code
  `).all();

  const sightingsStmt = db.prepare(`
    SELECT
      sessions.date,
      airports.iata_code
    FROM sightings
    JOIN sessions ON sightings.session_id = sessions.id
    JOIN airports ON sessions.airport_id = airports.id
    WHERE sightings.registration_id = ?
    ORDER BY sessions.date
  `);

  const registrationsWithSightings = registrations.map(reg => {
    const sightings = sightingsStmt.all(reg.id);
    return {
      ...reg,
      times_spotted: sightings.length,
      sightings: sightings
    };
  });

  res.json(registrationsWithSightings);
});

app.get('/api/stats', (req, res) => {
  const totalRegistrations = db.prepare('SELECT COUNT(*) AS count FROM registrations').get().count;
  const totalAirlines = db.prepare('SELECT COUNT(*) AS count FROM airlines').get().count;
  const totalSessions = db.prepare('SELECT COUNT(*) AS count FROM sessions WHERE is_quick_sighting = 0').get().count;
  const totalAirports = db.prepare('SELECT COUNT(DISTINCT airport_id) AS count FROM sessions').get().count;

  const lastSession = db.prepare(`
    SELECT date FROM sessions
    WHERE is_quick_sighting = 0
    ORDER BY date DESC
    LIMIT 1
  `).get();

  res.json({
    total_registrations: totalRegistrations,
    total_airlines: totalAirlines,
    total_sessions: totalSessions,
    total_airports: totalAirports,
    last_session_date: lastSession ? lastSession.date : null
  });
});

app.get('/api/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT
      sessions.id,
      sessions.date,
      sessions.session_number,
      sessions.is_quick_sighting,
      airports.iata_code,
      airports.city
    FROM sessions
    JOIN airports ON sessions.airport_id = airports.id
    ORDER BY sessions.date
  `).all();

  const locationsStmt = db.prepare(`
    SELECT locations.name
    FROM session_locations
    JOIN locations ON session_locations.location_id = locations.id
    WHERE session_locations.session_id = ?
  `);

  const sightingsStmt = db.prepare(`
    SELECT
      registrations.reg,
      airlines.name AS airline_name
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN airlines ON registrations.airline_id = airlines.id
    WHERE sightings.session_id = ?
  `);

  const sessionsWithDetails = sessions.map(session => {
    const locations = locationsStmt.all(session.id).map(l => l.name);
    const registrationsCaught = sightingsStmt.all(session.id);
    return {
      ...session,
      locations: locations,
      registrations_caught: registrationsCaught
    };
  });

  res.json(sessionsWithDetails);
});

app.get('/api/top-airlines', (req, res) => {
  const topAirlines = db.prepare(`
    SELECT airlines.name, COUNT(*) AS count
    FROM registrations
    JOIN airlines ON registrations.airline_id = airlines.id
    GROUP BY airlines.id
    ORDER BY count DESC
    LIMIT 5
  `).all();
  res.json(topAirlines);
});

app.get('/api/top-countries', (req, res) => {
  const topCountries = db.prepare(`
    SELECT countries.name, COUNT(*) AS count
    FROM registrations
    JOIN airlines ON registrations.airline_id = airlines.id
    JOIN countries ON airlines.country_id = countries.id
    GROUP BY countries.id
    ORDER BY count DESC
    LIMIT 5
  `).all();
  res.json(topCountries);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});