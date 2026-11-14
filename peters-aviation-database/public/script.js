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

const chartColors = ['#3E8EDE', '#1B4965', '#8DAFC4', '#5A8CB5', '#0D1B2A'];

Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#2E1F12';

fetch('/api/top-airlines')
  .then(response => response.json())
  .then(data => {
    new Chart(document.getElementById('top-airlines-chart'), {
      type: 'bar',
      data: {
        labels: data.map(row => row.name),
        datasets: [{
          label: 'Sightings',
          data: data.map(row => row.count),
          backgroundColor: chartColors,
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Top 5 Airlines', font: { family: 'Roboto Slab', size: 15 } },
          legend: { display: false }
        },
        scales: {
            x: { grid: { color: '#D7E7F2' } },
            y: { grid: { color: '#D7E7F2' } }
        }
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
          label: 'Sightings',
          data: data.map(row => row.count),
          backgroundColor: chartColors,
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Top 5 Countries', font: { family: 'Roboto Slab', size: 15 } },
          legend: { display: false }
        },
        scales: {
            x: { grid: { color: '#D7E7F2' } },
            y: { grid: { color: '#D7E7F2' } }
        }
      }
    });
  });