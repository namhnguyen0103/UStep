function loadStepData() {
  fetch('stepsData.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayDashboardData(data);
    })
    .catch(error => {
      console.error('There was a problem fetching the step data:', error);
      getDashboardContent().innerHTML = '<p>Error loading data.</p>';
    });
}

function getDashboardContent() {
  let contentDiv = document.getElementById('dashboard-content');
  if (!contentDiv) {
    contentDiv = document.createElement('div');
    contentDiv.id = 'dashboard-content';
    document.querySelector('.container').appendChild(contentDiv);
  }
  return contentDiv;
}

function displayDashboardData(data) {
  const contentDiv = getDashboardContent();
  contentDiv.innerHTML = '';
  const table = document.createElement('table');
  table.style.width = '100%';
  table.setAttribute('border', '1');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Date', 'Steps'].forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.forEach(item => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = item.date;
    const stepsCell = document.createElement('td');
    stepsCell.textContent = item.steps;
    row.append(dateCell, stepsCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  contentDiv.appendChild(table);
}

document.addEventListener('DOMContentLoaded', () => {
  loadStepData();
});

