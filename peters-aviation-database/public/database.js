let allRegistrations = [];

fetch('/api/registrations')
  .then(response => response.json())
  .then(registrations => {
    allRegistrations = registrations;
    populateFilters(registrations);
    renderTable(registrations);
  });

function populateFilters(registrations) {
  const countries = [...new Set(registrations.map(r => r.country_name))].sort();
  const airlines = [...new Set(registrations.map(r => r.airline_name))].sort();

  const countrySelect = document.getElementById('country-filter');
  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });

  const airlineSelect = document.getElementById('airline-filter');
  airlines.forEach(airline => {
    const option = document.createElement('option');
    option.value = airline;
    option.textContent = airline;
    airlineSelect.appendChild(option);
  });

  countrySelect.addEventListener('change', applyFilters);
  airlineSelect.addEventListener('change', applyFilters);
}

function applyFilters() {
  const country = document.getElementById('country-filter').value;
  const airline = document.getElementById('airline-filter').value;

  let filtered = allRegistrations;
  if (country) {
    filtered = filtered.filter(r => r.country_name === country);
  }
  if (airline) {
    filtered = filtered.filter(r => r.airline_name === airline);
  }

  renderTable(filtered);
}

function renderTable(registrations) {
  const tbody = document.getElementById('registrations-body');
  tbody.innerHTML = '';

  registrations.forEach(reg => {
    const row = document.createElement('tr');

    const sightingsText = reg.sightings
      .map(s => `(${s.iata_code}, ${s.date})`)
      .join(', ');

    row.innerHTML = `
      <td>${reg.reg}</td>
      <td>${reg.airline_name}</td>
      <td>${reg.country_name}</td>
      <td>${reg.aircraft_code}</td>
      <td class="times-spotted">
        ${reg.times_spotted}
        <span class="tooltip">${sightingsText}</span>
      </td>
      <td>${reg.notes || ''}</td>
    `;

    tbody.appendChild(row);
  });
}