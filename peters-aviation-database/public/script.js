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

const chartColors = ['#B5651D', '#7B3F00', '#C9A66B', '#9C6B30', '#5E3A1C'];

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
          label: 'Registrations Caught',
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
          x: { grid: { color: '#E0D2AE' } },
          y: { grid: { color: '#E0D2AE' } }
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
          label: 'Registrations Caught',
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
          x: { grid: { color: '#E0D2AE' } },
          y: { grid: { color: '#E0D2AE' } }
        }
      }
    });
  });