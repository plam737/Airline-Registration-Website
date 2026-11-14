fetch('/api/stats')
  .then(response => response.json())
  .then(data => {
    document.getElementById('last-session').textContent =
      `Last Session Added: ${data.last_session_date || 'N/A'}`;
    document.getElementById('stat-registrations').textContent = data.total_registrations;
    document.getElementById('stat-airlines').textContent = data.total_airlines;
    document.getElementById('stat-sessions').textContent = data.total_sessions;
    document.getElementById('stat-airports').textContent = data.total_airports;
  });

fetch('/api/top-airlines')
  .then(response => response.json())
  .then(data => {
    new Chart(document.getElementById('top-airlines-chart'), {
      type: 'bar',
      data: {
        labels: data.map(row => row.name),
        datasets: [{
          label: 'Registrations Caught',
          data: data.map(row => row.count)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Top 5 Airlines' } }
      }
    });
  });

fetch('/api/top-countries')
  .then(response => response.json())
  .then(data => {
    new Chart(document.getElementById('top-countries-chart'), {
      type: 'bar',
      data: {
        labels: data.map(row => row.name),
        datasets: [{
          label: 'Registrations Caught',
          data: data.map(row => row.count)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { title: { display: true, text: 'Top 5 Countries' } }
      }
    });
  });