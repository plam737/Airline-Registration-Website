document.getElementById('login-button').addEventListener('click', () => {
  const password = document.getElementById('password-input').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('add-form-section').classList.remove('hidden');
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    });
});

let checkedRegMatches = [];

document.getElementById('check-reg-button').addEventListener('click', () => {
  const reg = document.getElementById('reg-input').value.trim().toUpperCase();

  if (!reg) return;

  fetch(`/api/check-registration/${reg}`)
    .then(response => response.json())
    .then(result => {
      const statusEl = document.getElementById('duplicate-status');

      if (result.status === 'new') {
        checkedRegMatches = [];
        statusEl.textContent = 'New registration — no existing match found.';
        document.getElementById('new-registration-fields').classList.remove('hidden');
        document.getElementById('session-fields').classList.remove('hidden');
        document.getElementById('submit-fields').classList.remove('hidden');
      } else {
        checkedRegMatches = result.matches;
        const airlineNames = result.matches.map(m => m.airline_name).join(', ');
        statusEl.textContent = `Found existing registration under: ${airlineNames}. Select or search for the airline below to confirm if this is a duplicate.`;
        document.getElementById('new-registration-fields').classList.remove('hidden');
        document.getElementById('session-fields').classList.remove('hidden');
        document.getElementById('submit-fields').classList.remove('hidden');
      }
    });
});

let selectedAirlineId = null;

const airlineSearchInput = document.getElementById('airline-search');
const airlineResultsDiv = document.getElementById('airline-results');
const airlineCreateDiv = document.getElementById('airline-create');

airlineSearchInput.addEventListener('input', () => {
  const query = airlineSearchInput.value.trim();
  airlineResultsDiv.innerHTML = '';
  airlineCreateDiv.classList.add('hidden');
  selectedAirlineId = null;

  if (!query) return;

  fetch(`/api/search-airlines?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(airlines => {
      airlines.forEach(airline => {
        const option = document.createElement('div');
        option.textContent = airline.name;
        option.addEventListener('click', () => {
          selectedAirlineId = airline.id;
          airlineSearchInput.value = airline.name;
          airlineResultsDiv.innerHTML = '';
          checkIfDuplicateAirline();
        });
        airlineResultsDiv.appendChild(option);
      });

      // Always show "add new" option at the bottom
      const addNewOption = document.createElement('div');
      addNewOption.textContent = `+ Add new airline "${query}"`;
      addNewOption.style.fontStyle = 'italic';
      addNewOption.addEventListener('click', () => {
        airlineResultsDiv.innerHTML = '';
        airlineCreateDiv.classList.remove('hidden');
        document.getElementById('new-airline-name').value = query;
      });
      airlineResultsDiv.appendChild(addNewOption);
    });
});

function checkIfDuplicateAirline() {
  const statusEl = document.getElementById('duplicate-status');
  const match = checkedRegMatches.find(m => m.airline_id === selectedAirlineId);

  if (match) {
    statusEl.textContent = 'This is a duplicate sighting (same reg, same airline) — only a session is needed.';
    document.getElementById('aircraft-field').classList.add('hidden');
  } else if (checkedRegMatches.length > 0) {
    statusEl.textContent = 'This registration exists under a different airline — treating as a new, separate entry.';
    document.getElementById('aircraft-field').classList.remove('hidden');
  } else {
    document.getElementById('aircraft-field').classList.remove('hidden');
  }
}

let selectedAircraftId = null;

const aircraftSearchInput = document.getElementById('aircraft-search');
const aircraftResultsDiv = document.getElementById('aircraft-results');
const aircraftCreateDiv = document.getElementById('aircraft-create');

aircraftSearchInput.addEventListener('input', () => {
  const query = aircraftSearchInput.value.trim();
  aircraftResultsDiv.innerHTML = '';
  aircraftCreateDiv.classList.add('hidden');
  selectedAircraftId = null;

  if (!query) return;

  fetch(`/api/search-aircraft?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(aircraft => {
      aircraft.forEach(type => {
        const option = document.createElement('div');
        option.textContent = type.name ? `${type.code} — ${type.name}` : type.code;
        option.addEventListener('click', () => {
          selectedAircraftId = type.id;
          aircraftSearchInput.value = type.code;
          aircraftResultsDiv.innerHTML = '';
        });
        aircraftResultsDiv.appendChild(option);
      });

      const addNewOption = document.createElement('div');
      addNewOption.textContent = `+ Add new aircraft type "${query}"`;
      addNewOption.style.fontStyle = 'italic';
      addNewOption.addEventListener('click', () => {
        aircraftResultsDiv.innerHTML = '';
        aircraftCreateDiv.classList.remove('hidden');
        document.getElementById('new-aircraft-code').value = query;
      });
      aircraftResultsDiv.appendChild(addNewOption);
    });
});

function setupAutocomplete(searchInputId, resultsDivId, createDivId, apiUrl, onSelect, newNameFieldId) {
  const searchInput = document.getElementById(searchInputId);
  const resultsDiv = document.getElementById(resultsDivId);
  const createDiv = document.getElementById(createDivId);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    resultsDiv.innerHTML = '';
    createDiv.classList.add('hidden');

    if (!query) return;

    fetch(`${apiUrl}?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(items => {
        items.forEach(item => {
          const option = document.createElement('div');
          option.textContent = item.name;
          option.addEventListener('click', () => {
            searchInput.value = item.name;
            resultsDiv.innerHTML = '';
            onSelect(item.id);
          });
          resultsDiv.appendChild(option);
        });

        const addNewOption = document.createElement('div');
        addNewOption.textContent = `+ Add new "${query}"`;
        addNewOption.style.fontStyle = 'italic';
        addNewOption.addEventListener('click', () => {
          resultsDiv.innerHTML = '';
          createDiv.classList.remove('hidden');
          document.getElementById(newNameFieldId).value = query;
        });
        resultsDiv.appendChild(addNewOption);
      });
  });
}

let selectedCountryId = null;
let selectedAllianceId = null;

setupAutocomplete(
  'country-search', 'country-results', 'country-create',
  '/api/search-countries',
  (id) => { selectedCountryId = id; },
  'new-country-name'
);

setupAutocomplete(
  'alliance-search', 'alliance-results', 'alliance-create',
  '/api/search-alliances',
  (id) => { selectedAllianceId = id; },
  'new-alliance-name'
);

let selectedSessionId = null;
let selectedSessionAirportId = null;
let selectedAirportCountryId = null;
let selectedLocationIds = [];

// Session autocomplete
setupAutocomplete(
  'session-search', 'session-results', 'session-create',
  '/api/search-sessions',
  (id) => { selectedSessionId = id; },
  null // sessions don't use the simple name-based create flow
);

// Override: session results need custom display (date + airport, not just "name")
const sessionSearchInput = document.getElementById('session-search');
const sessionResultsDiv = document.getElementById('session-results');
const sessionCreateDiv = document.getElementById('session-create');

sessionSearchInput.addEventListener('input', () => {
  const query = sessionSearchInput.value.trim();
  sessionResultsDiv.innerHTML = '';
  sessionCreateDiv.classList.add('hidden');
  selectedSessionId = null;

  if (!query) return;

  fetch(`/api/search-sessions?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(sessions => {
      sessions.forEach(session => {
        const option = document.createElement('div');
        option.textContent = `${session.date} — ${session.city} (${session.iata_code})`;
        option.addEventListener('click', () => {
          selectedSessionId = session.id;
          sessionSearchInput.value = `${session.date} — ${session.iata_code}`;
          sessionResultsDiv.innerHTML = '';
        });
        sessionResultsDiv.appendChild(option);
      });

      const addNewOption = document.createElement('div');
      addNewOption.textContent = `+ Add new session`;
      addNewOption.style.fontStyle = 'italic';
      addNewOption.addEventListener('click', () => {
        sessionResultsDiv.innerHTML = '';
        sessionCreateDiv.classList.remove('hidden');
      });
      sessionResultsDiv.appendChild(addNewOption);
    });
});

// Airport autocomplete (inside New Session)
const sessionAirportSearchInput = document.getElementById('session-airport-search');
const sessionAirportResultsDiv = document.getElementById('session-airport-results');
const sessionAirportCreateDiv = document.getElementById('session-airport-create');

sessionAirportSearchInput.addEventListener('input', () => {
  const query = sessionAirportSearchInput.value.trim();
  sessionAirportResultsDiv.innerHTML = '';
  sessionAirportCreateDiv.classList.add('hidden');
  selectedSessionAirportId = null;

  if (!query) return;

  fetch(`/api/search-airports?q=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(airports => {
      airports.forEach(airport => {
        const option = document.createElement('div');
        option.textContent = `${airport.iata_code} — ${airport.name}`;
        option.addEventListener('click', () => {
          selectedSessionAirportId = airport.id;
          sessionAirportSearchInput.value = airport.iata_code;
          sessionAirportResultsDiv.innerHTML = '';
          refreshLocationSearchScope();
        });
        sessionAirportResultsDiv.appendChild(option);
      });

      const addNewOption = document.createElement('div');
      addNewOption.textContent = `+ Add new airport "${query}"`;
      addNewOption.style.fontStyle = 'italic';
      addNewOption.addEventListener('click', () => {
        sessionAirportResultsDiv.innerHTML = '';
        sessionAirportCreateDiv.classList.remove('hidden');
        document.getElementById('new-airport-code').value = query;
      });
      sessionAirportResultsDiv.appendChild(addNewOption);
    });
});

// Country autocomplete (inside New Airport)
setupAutocomplete(
  'airport-country-search', 'airport-country-results', 'airport-country-create',
  '/api/search-countries',
  (id) => { selectedAirportCountryId = id; },
  'new-airport-country-name'
);

// Location autocomplete (scoped to selected airport)
const locationSearchInput = document.getElementById('location-search');
const locationResultsDiv = document.getElementById('location-results');
const locationCreateDiv = document.getElementById('location-create');

function refreshLocationSearchScope() {
  locationSearchInput.value = '';
  locationResultsDiv.innerHTML = '';
  locationSearchInput.disabled = !selectedSessionAirportId;
  locationSearchInput.placeholder = selectedSessionAirportId
    ? 'Search locations...'
    : 'Select an airport first';
}

locationSearchInput.addEventListener('input', () => {
  const query = locationSearchInput.value.trim();
  locationResultsDiv.innerHTML = '';
  locationCreateDiv.classList.add('hidden');

  if (!query || !selectedSessionAirportId) return;

  fetch(`/api/search-locations?q=${encodeURIComponent(query)}&airport_id=${selectedSessionAirportId}`)
    .then(response => response.json())
    .then(locations => {
      locations.forEach(location => {
        const option = document.createElement('div');
        option.textContent = location.name;
        option.addEventListener('click', () => {
          addSelectedLocation(location.id, location.name);
          locationSearchInput.value = '';
          locationResultsDiv.innerHTML = '';
        });
        locationResultsDiv.appendChild(option);
      });

      const addNewOption = document.createElement('div');
      addNewOption.textContent = `+ Add new location "${query}"`;
      addNewOption.style.fontStyle = 'italic';
      addNewOption.addEventListener('click', () => {
        locationResultsDiv.innerHTML = '';
        locationCreateDiv.classList.remove('hidden');
        document.getElementById('new-location-name').value = query;
      });
      locationResultsDiv.appendChild(addNewOption);
    });
});

function addSelectedLocation(id, name) {
  if (selectedLocationIds.includes(id)) return;
  selectedLocationIds.push(id);

  const list = document.getElementById('selected-locations-list');
  const li = document.createElement('li');
  li.textContent = name;
  list.appendChild(li);
}

refreshLocationSearchScope();

document.getElementById('submit-registration-button').addEventListener('click', () => {
  const submitButton = document.getElementById('submit-registration-button');
  submitButton.disabled = true;

  const reg = document.getElementById('reg-input').value.trim().toUpperCase();
  const isKnownReg = checkedRegMatches.length > 0;
  const isSameAirlineDuplicate = checkedRegMatches.some(m => m.airline_id === selectedAirlineId);

  const payload = {
    reg: reg,
    is_known_reg: isKnownReg,
    is_same_airline_duplicate: isSameAirlineDuplicate,
    notes: document.getElementById('new-notes').value.trim(),

    airline: selectedAirlineId
      ? { id: selectedAirlineId }
      : {
          name: document.getElementById('new-airline-name').value.trim(),
          country: selectedCountryId
            ? { id: selectedCountryId }
            : { name: document.getElementById('new-country-name').value.trim() },
          alliance: selectedAllianceId
            ? { id: selectedAllianceId }
            : (document.getElementById('new-alliance-name').value.trim()
                ? { name: document.getElementById('new-alliance-name').value.trim() }
                : null)
        },

    aircraft: selectedAircraftId
      ? { id: selectedAircraftId }
      : {
          code: document.getElementById('new-aircraft-code').value.trim(),
          name: document.getElementById('new-aircraft-name').value.trim() || null,
          manufacturer: document.getElementById('new-aircraft-manufacturer').value.trim() || null,
          body_type: document.getElementById('new-aircraft-bodytype').value || null
        },

    session: selectedSessionId
      ? { id: selectedSessionId }
      : {
          date: document.getElementById('new-session-date').value,
          start_time: document.getElementById('new-session-start').value || null,
          end_time: document.getElementById('new-session-end').value || null,
          airport: selectedSessionAirportId
            ? { id: selectedSessionAirportId }
            : {
                code: document.getElementById('new-airport-code').value.trim(),
                city: document.getElementById('new-airport-city').value.trim(),
                state_province: document.getElementById('new-airport-state').value.trim() || null,
                country: selectedAirportCountryId
                  ? { id: selectedAirportCountryId }
                  : { name: document.getElementById('new-airport-country-name').value.trim() }
              },
          location_ids: selectedLocationIds,
          new_location_names: []
        }
  };

  fetch('/api/add-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => response.json())
    .then(result => {
      const statusEl = document.getElementById('submit-status');
      if (result.success) {
        statusEl.textContent = 'Registration added successfully!';
        statusEl.style.color = 'green';
      } else {
        statusEl.textContent = `Error: ${result.error}`;
        statusEl.style.color = 'red';
      }
      submitButton.disabled = false;
    });
});