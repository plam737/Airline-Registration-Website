function drawBarChart(canvasId, apiUrl, title, labelKey) {
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
          labels: data.map(row => row[labelKey]),
          datasets: [{
            label: 'Registrations Caught',
            data: data.map(row => row.count)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { title: { display: true, text: title } }
        }
      });
    });
}

drawBarChart('countries-chart', '/api/all-countries', 'All Countries', 'name');
drawBarChart('airlines-chart', '/api/all-airlines', 'All Airlines', 'name');
drawBarChart('aircraft-chart', '/api/all-aircraft', 'All Aircraft Types', 'code');