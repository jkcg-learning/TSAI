let chartLoaded = false;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function updatePopup(data) {
  updateDailyTab(data.dailyData);
  updateCategoryTab(data.categoryData);
  updateCustomCategoriesTab(data.customCategories);
}

function updateDailyTab(dailyData) {
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyData?.[today] || {};
  
  const dailyList = document.getElementById('dailyList');
  dailyList.innerHTML = '';
  
  const sortedData = Object.entries(todayData)
    .sort(([, a], [, b]) => b - a);

  sortedData.forEach(([url, seconds]) => {
    const listItem = document.createElement('div');
    listItem.className = 'time-item';
    listItem.textContent = `${url}: ${formatTime(seconds)}`;
    dailyList.appendChild(listItem);
  });

  if (chartLoaded) {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    if (window.dailyChart instanceof Chart) {
      window.dailyChart.destroy();
    }
    window.dailyChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: sortedData.map(([url]) => url),
        datasets: [{
          data: sortedData.map(([, seconds]) => seconds),
          backgroundColor: sortedData.map(() => getRandomColor())
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Daily Website Usage'
          }
        }
      }
    });
  } else {
    console.error('Chart.js is not loaded, cannot create daily chart');
  }
}

function updateCategoryTab(categoryData) {
  console.log('Category Data:', categoryData);

  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  if (Object.keys(categoryData).length === 0) {
    ctx.font = '20px Arial';
    ctx.fillText('No category data available yet', 10, 50);
    return;
  }

  if (chartLoaded) {
    if (window.categoryChart instanceof Chart) {
      window.categoryChart.destroy();
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    window.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Time Spent (seconds)',
          data: data,
          backgroundColor: labels.map(() => getRandomColor())
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatTime(value);
              }
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Category Breakdown'
          },
          legend: {
            display: false
          }
        }
      }
    });
  } else {
    console.error('Chart.js is not loaded, cannot create category chart');
  }
}

function updateCustomCategoriesTab(customCategories) {
  const categoryList = document.getElementById('categoryList');
  categoryList.innerHTML = '';

  for (const [category, domains] of Object.entries(customCategories || {})) {
    const listItem = document.createElement('div');
    listItem.className = 'category-item';
    listItem.textContent = `${category}: ${domains.join(', ')}`;
    categoryList.appendChild(listItem);
  }
}

function getRandomColor() {
  return `hsl(${Math.random() * 360}, 70%, 70%)`;
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });
}

function setupCustomCategoryForm() {
  const form = document.getElementById('addCategoryForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const categoryName = document.getElementById('categoryName').value;
    const domains = document.getElementById('domainList').value.split(',').map(d => d.trim());

    chrome.runtime.sendMessage({
      action: 'updateCategories',
      categoryName: categoryName,
      domains: domains
    }, (response) => {
      if (response && response.status === 'Categories updated') {
        chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
          if (response) {
            updatePopup(response);
          } else {
            console.error('Failed to get updated data after adding category');
          }
        });
        form.reset();
      } else {
        console.error('Failed to update categories');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart !== 'undefined') {
    chartLoaded = true;
  } else {
    console.error('Chart.js is not loaded');
  }

  setupTabNavigation();
  setupCustomCategoryForm();

  chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
    if (response) {
      updatePopup(response);
    } else {
      console.error('Failed to get initial data');
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'dataUpdated') {
      chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
        if (response) {
          updatePopup(response);
        } else {
          console.error('Failed to get updated data');
        }
      });
    }
  });
});