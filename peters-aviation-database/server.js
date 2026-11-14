require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
app.use(express.static('public'));
app.use(express.json());
const PORT = process.env.PORT || 1114;

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

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
    SELECT airlines.name, COUNT(sightings.id) AS count
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN airlines ON registrations.airline_id = airlines.id
    GROUP BY airlines.id
    ORDER BY count DESC
    LIMIT 5
  `).all();
  res.json(topAirlines);
});

app.get('/api/top-countries', (req, res) => {
  const topCountries = db.prepare(`
    SELECT countries.name, COUNT(sightings.id) AS count
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN airlines ON registrations.airline_id = airlines.id
    JOIN countries ON airlines.country_id = countries.id
    GROUP BY countries.id
    ORDER BY count DESC
    LIMIT 5
  `).all();
  res.json(topCountries);
});

app.get('/api/all-airlines', (req, res) => {
  const airlines = db.prepare(`
    SELECT airlines.name, COUNT(sightings.id) AS count
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN airlines ON registrations.airline_id = airlines.id
    GROUP BY airlines.id
    ORDER BY count DESC
  `).all();
  res.json(airlines);
});

app.get('/api/all-countries', (req, res) => {
  const countries = db.prepare(`
    SELECT countries.name, COUNT(sightings.id) AS count
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN airlines ON registrations.airline_id = airlines.id
    JOIN countries ON airlines.country_id = countries.id
    GROUP BY countries.id
    ORDER BY count DESC
  `).all();
  res.json(countries);
});

app.get('/api/all-aircraft', (req, res) => {
  const aircraft = db.prepare(`
    SELECT aircraft_types.code, COUNT(sightings.id) AS count
    FROM sightings
    JOIN registrations ON sightings.registration_id = registrations.id
    JOIN aircraft_types ON registrations.aircraft_type_id = aircraft_types.id
    GROUP BY aircraft_types.id
    ORDER BY count DESC
  `).all();
  res.json(aircraft);
});

app.get('/api/check-registration/:reg', (req, res) => {
  const reg = req.params.reg.toUpperCase();

  const matches = db.prepare(`
    SELECT registrations.id, registrations.airline_id, airlines.name AS airline_name
    FROM registrations
    JOIN airlines ON registrations.airline_id = airlines.id
    WHERE registrations.reg = ?
  `).all(reg);

  if (matches.length === 0) {
    res.json({ status: 'new' });
  } else {
    res.json({ status: 'found', matches: matches });
  }
});

app.get('/api/search-airlines', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const airlines = db.prepare(`
    SELECT id, name FROM airlines WHERE name LIKE ? ORDER BY name LIMIT 10
  `).all(query);
  res.json(airlines);
});

app.get('/api/search-aircraft', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const aircraft = db.prepare(`
    SELECT id, code, name FROM aircraft_types WHERE code LIKE ? OR name LIKE ? ORDER BY code LIMIT 10
  `).all(query, query);
  res.json(aircraft);
});

app.get('/api/search-countries', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const countries = db.prepare(`
    SELECT id, name FROM countries WHERE name LIKE ? ORDER BY name LIMIT 10
  `).all(query);
  res.json(countries);
});

app.get('/api/search-alliances', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const alliances = db.prepare(`
    SELECT id, name FROM alliances WHERE name LIKE ? ORDER BY name LIMIT 10
  `).all(query);
  res.json(alliances);
});

app.get('/api/search-airports', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const airports = db.prepare(`
    SELECT id, name, iata_code, city FROM airports
    WHERE name LIKE ? OR iata_code LIKE ? OR city LIKE ?
    ORDER BY iata_code LIMIT 10
  `).all(query, query, query);
  res.json(airports);
});

app.get('/api/search-sessions', (req, res) => {
  const query = `%${req.query.q || ''}%`;
  const sessions = db.prepare(`
    SELECT sessions.id, sessions.date, airports.iata_code, airports.city
    FROM sessions
    JOIN airports ON sessions.airport_id = airports.id
    WHERE sessions.date LIKE ? OR airports.iata_code LIKE ? OR airports.city LIKE ?
    ORDER BY sessions.date DESC LIMIT 10
  `).all(query, query, query);
  res.json(sessions);
});

app.get('/api/search-locations', (req, res) => {
  const airportId = req.query.airport_id;
  const query = `%${req.query.q || ''}%`;

  if (!airportId) {
    return res.json([]);
  }

  const locations = db.prepare(`
    SELECT id, name FROM locations WHERE airport_id = ? AND name LIKE ? ORDER BY name LIMIT 10
  `).all(airportId, query);
  res.json(locations);
});

app.post('/api/add-registration', (req, res) => {
  const data = req.body;

  try {
    const result = db.transaction(() => {

      function resolveCountry(countryInput) {
        if (countryInput.id) return countryInput.id;
        const existing = db.prepare('SELECT id FROM countries WHERE name = ? COLLATE NOCASE').get(countryInput.name);
        if (existing) return existing.id;
        const insert = db.prepare('INSERT INTO countries (name) VALUES (?)').run(countryInput.name);
        return insert.lastInsertRowid;
      }

      function resolveAlliance(allianceInput) {
        if (!allianceInput) return null;
        if (allianceInput.id) return allianceInput.id;
        const existing = db.prepare('SELECT id FROM alliances WHERE name = ? COLLATE NOCASE').get(allianceInput.name);
        if (existing) return existing.id;
        const insert = db.prepare('INSERT INTO alliances (name) VALUES (?)').run(allianceInput.name);
        return insert.lastInsertRowid;
      }

      // --- Resolve or create airline ---
      function resolveAirline(airlineInput) {
        if (airlineInput.id) return airlineInput.id;
        const countryId = resolveCountry(airlineInput.country);
        const allianceId = resolveAlliance(airlineInput.alliance);
        const nextAirlineNumber = db.prepare('SELECT COUNT(*) AS count FROM airlines').get().count + 1;
        const insert = db.prepare(`
          INSERT INTO airlines (name, country_id, alliance_id, airline_number)
          VALUES (?, ?, ?, ?)
        `).run(airlineInput.name, countryId, allianceId, nextAirlineNumber);
        return insert.lastInsertRowid;
      }

      // --- Resolve or create aircraft type ---
      function resolveAircraft(aircraftInput) {
        if (aircraftInput.id) return aircraftInput.id;
        const insert = db.prepare(`
          INSERT INTO aircraft_types (code, name, manufacturer, type)
          VALUES (?, ?, ?, ?)
        `).run(aircraftInput.code, aircraftInput.name, aircraftInput.manufacturer, aircraftInput.body_type);
        return insert.lastInsertRowid;
      }

      // --- Resolve or create airport ---
      function resolveAirport(airportInput) {
        if (airportInput.id) return airportInput.id;
        const countryId = resolveCountry(airportInput.country);
        const airportName = airportInput.name || `${airportInput.city} Airport (${airportInput.code})`;
        const insert = db.prepare(`
          INSERT INTO airports (name, city, state_province, country_id, iata_code)
          VALUES (?, ?, ?, ?, ?)
        `).run(airportName, airportInput.city, airportInput.state_province, countryId, airportInput.code);
        return insert.lastInsertRowid;
      }

      // --- Resolve or create session ---
      function resolveSession(sessionInput) {
        if (sessionInput.id) return sessionInput.id;
        const airportId = resolveAirport(sessionInput.airport);
                const isQuick = sessionInput.is_quick_sighting ? 1 : 0;
        // Quick sightings don't get a session number, so full sessions stay numbered 1, 2, 3...
        const sessionNumber = isQuick
          ? null
          : db.prepare('SELECT COUNT(*) AS count FROM sessions WHERE is_quick_sighting = 0').get().count + 1;
        const insert = db.prepare(`
          INSERT INTO sessions (date, airport_id, session_number, start_time, end_time, is_quick_sighting)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(sessionInput.date, airportId, sessionNumber, sessionInput.start_time, sessionInput.end_time, isQuick);
        const sessionId = insert.lastInsertRowid;

        // Link existing selected locations
        const linkLocation = db.prepare('INSERT INTO session_locations (session_id, location_id) VALUES (?, ?)');
        sessionInput.location_ids.forEach(locId => linkLocation.run(sessionId, locId));

        return sessionId;
      }

      // --- Resolve airline, aircraft, session ---
      const airlineId = resolveAirline(data.airline);
      const sessionId = resolveSession(data.session);

      let registrationId;
      let aircraftTypeId;

      if (data.is_same_airline_duplicate) {
        // True duplicate: reuse the existing registration row, don't touch aircraft type
        const existing = checkedRegMatchForAirline(data.reg, airlineId);
        registrationId = existing.id;
      } else {
        // New registration row (either brand new reg, or same reg/different airline)
        aircraftTypeId = resolveAircraft(data.aircraft);
        const isBrandNewReg = !data.is_known_reg;
        const registrationNumber = isBrandNewReg
          ? db.prepare('SELECT COUNT(DISTINCT reg) AS count FROM registrations').get().count + 1
          : null;

        const insert = db.prepare(`
          INSERT INTO registrations (reg, airline_id, aircraft_type_id, registration_number, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(data.reg, airlineId, aircraftTypeId, registrationNumber, data.notes || null);
        registrationId = insert.lastInsertRowid;
      }

      // --- Record the sighting ---
      db.prepare('INSERT INTO sightings (registration_id, session_id) VALUES (?, ?)').run(registrationId, sessionId);

      function checkedRegMatchForAirline(reg, airlineId) {
        return db.prepare('SELECT id FROM registrations WHERE reg = ? AND airline_id = ?').get(reg, airlineId);
      }

    })();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: error.message });
  }
});

// Lists used to fill the edit page
app.get('/api/edit-options', (req, res) => {
  res.json({
    airlines: db.prepare(`
      SELECT airlines.id, airlines.name,
             countries.name AS country_name,
             alliances.name AS alliance_name
      FROM airlines
      JOIN countries ON airlines.country_id = countries.id
      LEFT JOIN alliances ON airlines.alliance_id = alliances.id
      ORDER BY airlines.name
    `).all(),
    aircraft: db.prepare('SELECT id, code, name FROM aircraft_types ORDER BY code').all(),
    countries: db.prepare('SELECT name FROM countries ORDER BY name').all().map(c => c.name),
    alliances: db.prepare('SELECT name FROM alliances ORDER BY name').all().map(a => a.name)
  });
});

// Edit an airline (name, country, alliance).
// Country/alliance are matched by name; a new one is created if it doesn't exist yet.
app.put('/api/airlines/:id', (req, res) => {
  const name = (req.body.name || '').trim();
  const countryName = (req.body.country_name || '').trim();
  const allianceName = (req.body.alliance_name || '').trim();

  try {
    if (!name) throw new Error('Airline name is required');
    if (!countryName) throw new Error('Country is required');

    db.transaction(() => {
      let country = db.prepare('SELECT id FROM countries WHERE name = ? COLLATE NOCASE').get(countryName);
      const countryId = country
        ? country.id
        : db.prepare('INSERT INTO countries (name) VALUES (?)').run(countryName).lastInsertRowid;

      let allianceId = null;
      if (allianceName) {
        const alliance = db.prepare('SELECT id FROM alliances WHERE name = ? COLLATE NOCASE').get(allianceName);
        allianceId = alliance
          ? alliance.id
          : db.prepare('INSERT INTO alliances (name) VALUES (?)').run(allianceName).lastInsertRowid;
      }

      const result = db.prepare(`
        UPDATE airlines SET name = ?, country_id = ?, alliance_id = ? WHERE id = ?
      `).run(name, countryId, allianceId, req.params.id);
      if (result.changes === 0) throw new Error('Airline not found');
    })();

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Edit a registration (reg, airline, aircraft type, notes).
// Sightings stay attached because they point at the registration's id.
app.put('/api/registrations/:id', (req, res) => {
  const reg = (req.body.reg || '').trim().toUpperCase();
  const airlineName = (req.body.airline_name || '').trim();
  const aircraftCode = (req.body.aircraft_code || '').trim();
  const notes = (req.body.notes || '').trim() || null;

  try {
    if (!reg) throw new Error('Registration is required');

    const airline = db.prepare('SELECT id FROM airlines WHERE name = ? COLLATE NOCASE').get(airlineName);
    if (!airline) throw new Error(`Airline "${airlineName}" not found. Pick one from the list.`);

    const aircraft = db.prepare('SELECT id FROM aircraft_types WHERE code = ? COLLATE NOCASE').get(aircraftCode);
    if (!aircraft) throw new Error(`Aircraft type "${aircraftCode}" not found. Pick one from the list.`);

    const result = db.prepare(`
      UPDATE registrations
      SET reg = ?, airline_id = ?, aircraft_type_id = ?, notes = ?
      WHERE id = ?
    `).run(reg, airline.id, aircraft.id, notes, req.params.id);
    if (result.changes === 0) throw new Error('Registration not found');

    res.json({ success: true });
  } catch (error) {
    // A UNIQUE (reg, airline_id) clash lands here too
    res.json({ success: false, error: error.message });
  }
});

// Delete a registration and its sightings
app.delete('/api/registrations/:id', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM sightings WHERE registration_id = ?').run(req.params.id);
      db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/registrations/:id/sightings', (req, res) => {
  const sightings = db.prepare(`
    SELECT
      sightings.id AS sighting_id,
      sessions.id AS session_id,
      sessions.date,
      airports.iata_code,
      airports.city
    FROM sightings
    JOIN sessions ON sightings.session_id = sessions.id
    JOIN airports ON sessions.airport_id = airports.id
    WHERE sightings.registration_id = ?
    ORDER BY sessions.date
  `).all(req.params.id);
  res.json(sightings);
});

app.post('/api/registrations/:id/sightings', (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.json({ success: false, error: 'Unauthorized' });
  }
  try {
    const insert = db.prepare('INSERT INTO sightings (registration_id, session_id) VALUES (?, ?)')
      .run(req.params.id, req.body.session_id);
    res.json({ success: true, sighting_id: insert.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/sightings/:id', (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.json({ success: false, error: 'Unauthorized' });
  }
  try {
    const result = db.prepare('DELETE FROM sightings WHERE id = ?').run(req.params.id);
    if (result.changes === 0) throw new Error('Sighting not found');
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/all-sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT sessions.id, sessions.date, airports.iata_code, airports.city
    FROM sessions
    JOIN airports ON sessions.airport_id = airports.id
    ORDER BY sessions.date DESC
  `).all();
  res.json(sessions);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});