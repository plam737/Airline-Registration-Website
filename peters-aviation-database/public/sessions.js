fetch('/api/sessions')
  .then(response => response.json())
  .then(sessions => {
    const list = document.getElementById('sessions-list');

    const realSessions = sessions.filter(s => !s.is_quick_sighting);

    realSessions.forEach(session => {
      const card = document.createElement('div');
      card.className = 'session-card';

      const locationsText = session.locations.join(', ');

      const registrationsList = session.registrations_caught
        .map(r => `<li>${r.reg} (${r.airline_name})</li>`)
        .join('');

      card.innerHTML = `
        <div class="session-header">
          <span>Session ${session.session_number} — ${session.date} — ${session.city} (${session.iata_code})</span>
          <span>${locationsText}</span>
        </div>
        <div class="session-details">
          <ul>${registrationsList}</ul>
        </div>
      `;

      const header = card.querySelector('.session-header');
      const details = card.querySelector('.session-details');

      header.addEventListener('click', () => {
        details.classList.toggle('expanded');
      });

      list.appendChild(card);
    });
  });