-- Countries
INSERT INTO countries (name) VALUES ('Australia'), ('United States'), ('Cambodia');

-- Alliances
INSERT INTO alliances (name) VALUES ('oneworld'), ('Star Alliance');

-- Airlines
INSERT INTO airlines (name, country_id, alliance_id, airline_number) VALUES
  ('Qantas', 1, 1, 1),
  ('United Airlines', 2, 2, 2),
  ('Cambodia Angkor Airways', 3, NULL, 3);

-- Aircraft types (only 'code' is required, rest left blank intentionally)
INSERT INTO aircraft_types (code) VALUES ('789'), ('A332'), ('AT7');

-- Airports
INSERT INTO airports (name, city, country_id, iata_code) VALUES
  ('Los Angeles International Airport', 'Los Angeles', 2, 'LAX'),
  ('Phnom Penh International Airport', 'Phnom Penh', 3, 'PNH');

-- Locations (scoped to an airport)
INSERT INTO locations (name, airport_id) VALUES
  ('Imperial Hill', 1),
  ('In-N-Out Hill', 1),
  ('Terminal 1', 2);

-- Sessions (one normal, one with two locations, one quick-sighting)
INSERT INTO sessions (date, airport_id, session_number, is_quick_sighting) VALUES
  ('2024-07-14', 1, 37, 0),
  ('2024-07-19', 1, 46, 0),
  ('2024-08-02', 2, NULL, 1);

-- Session-Locations (session 1 uses two spots, sessions 2 and 3 use one each)
INSERT INTO session_locations (session_id, location_id) VALUES
  (1, 1), (1, 2),
  (2, 1),
  (3, 3);

-- Registrations
INSERT INTO registrations (reg, airline_id, aircraft_type_id, registration_number, notes) VALUES
  ('VH-ZNE', 1, 1, 1156, NULL),
  ('N12345', 2, 2, 1157, '60 Years Livery'),
  ('XU-787', 3, 3, 1158, NULL);

-- Sightings (VH-ZNE caught twice, across sessions 1 and 2; the others caught once)
INSERT INTO sightings (registration_id, session_id) VALUES
  (1, 1),
  (1, 2),
  (2, 1),
  (3, 3);