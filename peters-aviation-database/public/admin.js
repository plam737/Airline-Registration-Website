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
        document.getElementById('edit-section').classList.remove('hidden');
        sessionStorage.setItem('adminPassword', password);
        loadAll();
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
          is_quick_sighting: document.getElementById('new-session-quick').checked,
          start_time: document.getElementById('new-session-start').value || null,
          end_time: document.getElementById('new-session-end').value || null,
          airport: selectedSessionAirportId
            ? { id: selectedSessionAirportId }
            : {
                code: document.getElementById('new-airport-code').value.trim(),
                name: document.getElementById('new-airport-name').value.trim() || null,
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
    headers: authHeaders(),
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

// =====================================================================
// EDIT EXISTING RECORDS (airlines + registrations)
// =====================================================================

let editAirlines = [];
let editRegistrations = [];
let editingAirlineId = null;
let editingRegId = null;

const editStatusEl = document.getElementById('edit-status');
const AIRLINE_ROW_LIMIT = 5;
const REG_ROW_LIMIT = 10;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': sessionStorage.getItem('adminPassword') || ''
  };
}

function showEditStatus(message, ok) {
  editStatusEl.textContent = message;
  editStatusEl.style.color = ok ? 'green' : '#C0392B';
}

function fillDatalist(id, values) {
  document.getElementById(id).innerHTML =
    values.map(v => `<option value="${esc(v)}"></option>`).join('');
}

function loadAll() {
  return Promise.all([
    fetch('/api/edit-options').then(r => r.json()),
    fetch('/api/registrations').then(r => r.json())
  ]).then(([options, regs]) => {
    editAirlines = options.airlines;
    editRegistrations = regs;
    fillDatalist('country-list', options.countries);
    fillDatalist('alliance-list', options.alliances);
    fillDatalist('airline-list', options.airlines.map(a => a.name));
    fillDatalist('aircraft-list', options.aircraft.map(a => a.code));
    renderAirlines();
    renderRegistrations();
    populateSightingRegSelect();
    populateSessionSelect();
  });
}

// ---------- Airlines ----------

function renderAirlines() {
  const filter = document.getElementById('airline-filter').value.trim().toLowerCase();
  const tbody = document.getElementById('airlines-body');

  const matches = editAirlines.filter(a =>
    !filter ||
    a.name.toLowerCase().includes(filter) ||
    a.country_name.toLowerCase().includes(filter)
  );
  const rows = matches.slice(0, AIRLINE_ROW_LIMIT);

  document.getElementById('airline-limit-note').textContent = matches.length > AIRLINE_ROW_LIMIT
    ? `Showing ${AIRLINE_ROW_LIMIT} of ${matches.length}. Use the filter to find the rest.`
    : '';

  tbody.innerHTML = rows.map(a => {
    if (a.id === editingAirlineId) {
      return `
        <tr data-id="${a.id}">
          <td><input class="f-name" value="${esc(a.name)}"></td>
          <td><input class="f-country" list="country-list" value="${esc(a.country_name)}"></td>
          <td><input class="f-alliance" list="alliance-list" value="${esc(a.alliance_name || '')}" placeholder="None"></td>
          <td class="row-actions">
            <button data-action="save-airline">Save changes</button>
            <button data-action="cancel-airline" class="secondary">Cancel</button>
          </td>
        </tr>`;
    }
    return `
      <tr data-id="${a.id}">
        <td>${esc(a.name)}</td>
        <td>${esc(a.country_name)}</td>
        <td>${esc(a.alliance_name || '')}</td>
        <td class="row-actions"><button data-action="edit-airline">Edit</button></td>
      </tr>`;
  }).join('');
}

document.getElementById('airline-filter').addEventListener('input', renderAirlines);

document.getElementById('airlines-body').addEventListener('click', e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const row = button.closest('tr');
  const id = Number(row.dataset.id);

  if (button.dataset.action === 'edit-airline') {
    editingAirlineId = id;
    renderAirlines();
  } else if (button.dataset.action === 'cancel-airline') {
    editingAirlineId = null;
    renderAirlines();
  } else if (button.dataset.action === 'save-airline') {
    sendEditRequest(`/api/airlines/${id}`, 'PUT', {
      name: row.querySelector('.f-name').value,
      country_name: row.querySelector('.f-country').value,
      alliance_name: row.querySelector('.f-alliance').value
    }, () => { editingAirlineId = null; });
  }
});

// ---------- Registrations ----------

function renderRegistrations() {
  const filter = document.getElementById('reg-filter').value.trim().toLowerCase();
  const tbody = document.getElementById('registrations-body');

  const matches = editRegistrations.filter(r =>
    !filter ||
    r.reg.toLowerCase().includes(filter) ||
    r.airline_name.toLowerCase().includes(filter) ||
    r.aircraft_code.toLowerCase().includes(filter)
  );
  const rows = matches.slice(0, REG_ROW_LIMIT);

  document.getElementById('reg-limit-note').textContent = matches.length > REG_ROW_LIMIT
    ? `Showing ${REG_ROW_LIMIT} of ${matches.length}. Use the filter to narrow it down.`
    : '';

  tbody.innerHTML = rows.map(r => {
    if (r.id === editingRegId) {
      return `
        <tr data-id="${r.id}">
          <td><input class="f-reg" value="${esc(r.reg)}"></td>
          <td><input class="f-airline" list="airline-list" value="${esc(r.airline_name)}"></td>
          <td><input class="f-aircraft" list="aircraft-list" value="${esc(r.aircraft_code)}"></td>
          <td><input class="f-notes" value="${esc(r.notes || '')}"></td>
          <td class="row-actions">
            <button data-action="save-reg">Save changes</button>
            <button data-action="cancel-reg" class="secondary">Cancel</button>
            <button data-action="delete-reg" class="danger">Delete</button>
          </td>
        </tr>`;
    }
    return `
      <tr data-id="${r.id}">
        <td>${esc(r.reg)}</td>
        <td>${esc(r.airline_name)}</td>
        <td>${esc(r.aircraft_code)}</td>
        <td>${esc(r.notes || '')}</td>
        <td class="row-actions"><button data-action="edit-reg">Edit</button></td>
      </tr>`;
  }).join('');
}

document.getElementById('reg-filter').addEventListener('input', renderRegistrations);

document.getElementById('registrations-body').addEventListener('click', e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const row = button.closest('tr');
  const id = Number(row.dataset.id);

  if (button.dataset.action === 'edit-reg') {
    editingRegId = id;
    renderRegistrations();
  } else if (button.dataset.action === 'cancel-reg') {
    editingRegId = null;
    renderRegistrations();
  } else if (button.dataset.action === 'save-reg') {
    sendEditRequest(`/api/registrations/${id}`, 'PUT', {
      reg: row.querySelector('.f-reg').value,
      airline_name: row.querySelector('.f-airline').value,
      aircraft_code: row.querySelector('.f-aircraft').value,
      notes: row.querySelector('.f-notes').value
    }, () => { editingRegId = null; });
  } else if (button.dataset.action === 'delete-reg') {
    const reg = editRegistrations.find(r => r.id === id);
    const ok = confirm(`Delete ${reg.reg} (${reg.airline_name}) and all ${reg.times_spotted} of its sightings? This can't be undone.`);
    if (!ok) return;
    sendEditRequest(`/api/registrations/${id}`, 'DELETE', null, () => { editingRegId = null; });
  }
});

// ---------- Shared request helper ----------

function sendEditRequest(url, method, body, onDone) {
  fetch(url, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showEditStatus(method === 'DELETE' ? 'Deleted.' : 'Changes saved.', true);
        onDone();
        return loadAll();
      }
      showEditStatus(`Not saved: ${result.error}`, false);
    })
    .catch(() => showEditStatus('Not saved: could not reach the server.', false));
}

// ---------- Sightings ----------

let allSessionsForSightings = [];

function populateSightingRegSelect() {
  const select = document.getElementById('sighting-reg-select');
  select.innerHTML = '<option value="">Select a registration...</option>' +
    editRegistrations.map(r => `<option value="${r.id}">${esc(r.reg)} (${esc(r.airline_name)})</option>`).join('');
}

function populateSessionSelect() {
  fetch('/api/all-sessions')
    .then(r => r.json())
    .then(sessions => {
      allSessionsForSightings = sessions;
      const select = document.getElementById('add-sighting-session-select');
      select.innerHTML = '<option value="">Select a session...</option>' +
        sessions.map(s => `<option value="${s.id}">${esc(s.date)} — ${esc(s.city)} (${esc(s.iata_code)})</option>`).join('');
    });
}

document.getElementById('sighting-reg-select').addEventListener('change', (e) => {
  const regId = e.target.value;
  const manager = document.getElementById('sighting-manager');

  if (!regId) {
    manager.classList.add('hidden');
    return;
  }

  manager.classList.remove('hidden');
  loadSightingsFor(regId);
});

function loadSightingsFor(regId) {
  fetch(`/api/registrations/${regId}/sightings`)
    .then(r => r.json())
    .then(sightings => {
      const tbody = document.getElementById('sightings-body');
      tbody.innerHTML = sightings.map(s => `
        <tr data-sighting-id="${s.sighting_id}">
          <td>${esc(s.date)}</td>
          <td>${esc(s.city)} (${esc(s.iata_code)})</td>
          <td class="row-actions"><button data-action="delete-sighting" class="danger">Remove</button></td>
        </tr>
      `).join('');
    });
}

document.getElementById('sightings-body').addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action="delete-sighting"]');
  if (!button) return;
  const sightingId = button.closest('tr').dataset.sightingId;

  if (!confirm('Remove this sighting?')) return;

  fetch(`/api/sightings/${sightingId}`, { method: 'DELETE', headers: authHeaders() })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        loadSightingsFor(document.getElementById('sighting-reg-select').value);
      } else {
        showEditStatus(`Not removed: ${result.error}`, false);
      }
    });
});

document.getElementById('add-sighting-button').addEventListener('click', () => {
  const regId = document.getElementById('sighting-reg-select').value;
  const sessionId = document.getElementById('add-sighting-session-select').value;

  if (!regId || !sessionId) return;

  fetch(`/api/registrations/${regId}/sightings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ session_id: sessionId })
  })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        showEditStatus('Sighting added.', true);
        loadSightingsFor(regId);
      } else {
        showEditStatus(`Not added: ${result.error}`, false);
      }
    });
});