const chartColors = ['#B5651D', '#7B3F00', '#C9A66B', '#9C6B30', '#5E3A1C'];

Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#2E1F12';

function drawBarChart(canvasId, apiUrl, title, labelKey) {
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
          labels: data.map(row => row[labelKey]),
          datasets: [{
            label: 'Sightings',
            data: data.map(row => row.count),
            backgroundColor: '#3E8EDE',
            borderRadius: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            title: { display: true, text: title, font: { family: 'Roboto Slab', size: 15 } },
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: '#D7E7F2' } },
            y: { grid: { color: '#D7E7F2' } }
          }
        }
      });
    });
}

drawBarChart('countries-chart', '/api/all-countries', 'All Countries', 'name');
drawBarChart('airlines-chart', '/api/all-airlines', 'All Airlines', 'name');
drawBarChart('aircraft-chart', '/api/all-aircraft', 'All Aircraft Types', 'code');