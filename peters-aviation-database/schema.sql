CREATE TABLE IF NOT EXISTS countries
(
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS alliances
(
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS airlines
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE,
    country_id INTEGER NOT NULL,
    alliance_id INTEGER,
    airline_number INTEGER,
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (alliance_id) REFERENCES alliances(id)
);

CREATE TABLE IF NOT EXISTS aircraft_types
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(100),
    code VARCHAR(10) NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('Narrow-body', 'Wide-body', 'Regional', 'Cargo'))
);

CREATE TABLE IF NOT EXISTS airports
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    country_id INTEGER NOT NULL,
    iata_code CHAR(3) NOT NULL UNIQUE,
    icao_code CHAR(4) UNIQUE,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE IF NOT EXISTS locations
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE,
    airport_id INTEGER NOT NULL,
    FOREIGN KEY (airport_id) REFERENCES airports(id),
    UNIQUE (name, airport_id)
);

CREATE TABLE IF NOT EXISTS sessions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    airport_id INTEGER NOT NULL,
    session_number INTEGER,
    start_time TEXT,
    end_time TEXT,
    total_time TEXT,
    is_quick_sighting INTEGER NOT NULL DEFAULT 0 CHECK (is_quick_sighting IN (0, 1)),
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

CREATE TABLE IF NOT EXISTS session_locations
(
    session_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    PRIMARY KEY (session_id, location_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS registrations
(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    reg TEXT NOT NULL,
    airline_id INTEGER NOT NULL,
    aircraft_type_id INTEGER NOT NULL,
    registration_number INTEGER,
    notes TEXT,
    FOREIGN KEY (airline_id) REFERENCES airlines(id),
    FOREIGN KEY (aircraft_type_id) REFERENCES aircraft_types(id),
    UNIQUE (reg, airline_id)
);

CREATE TABLE IF NOT EXISTS sightings
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    FOREIGN KEY (registration_id) REFERENCES registrations(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

