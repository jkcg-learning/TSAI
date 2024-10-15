let currentTabId = null;
let currentUrl = null;
let startTime = null;
let categories = {
  'social': ['facebook.com', 'twitter.com', 'instagram.com'],
  'productivity': ['github.com', 'stackoverflow.com', 'docs.google.com'],
  'entertainment': ['youtube.com', 'netflix.com', 'hulu.com']
};

function updateTimeSpent() {
  if (currentTabId && currentUrl && startTime) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const date = new Date().toISOString().split('T')[0];

    chrome.storage.local.get(['dailyData', 'categoryData', 'customCategories'], (result) => {
      let dailyData = result.dailyData || {};
      let categoryData = result.categoryData || {};
      let customCategories = result.customCategories || {};

      categories = { ...categories, ...customCategories };

      if (!dailyData[date]) dailyData[date] = {};
      dailyData[date][currentUrl] = (dailyData[date][currentUrl] || 0) + timeSpent;

      let category = getCategoryForUrl(currentUrl);
      categoryData[category] = (categoryData[category] || 0) + timeSpent;

      console.log('Updating category data:', category, categoryData[category]);

      chrome.storage.local.set({ dailyData, categoryData, customCategories }, () => {
        startTime = Date.now();
        chrome.runtime.sendMessage({ action: 'dataUpdated' });
      });
    });
  }
}

function getCategoryForUrl(url) {
  for (let category in categories) {
    if (categories[category].some(domain => url.includes(domain))) {
      return category;
    }
  }
  return 'other';
}

function resetTimer(tabId, url) {
  updateTimeSpent();
  currentTabId = tabId;
  currentUrl = new URL(url).hostname;
  startTime = Date.now();
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      resetTimer(activeInfo.tabId, tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    resetTimer(tabId, tab.url);
  }
});

chrome.alarms.create('updateTime', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateTime') {
    updateTimeSpent();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateCategories') {
    chrome.storage.local.get('customCategories', (result) => {
      let customCategories = result.customCategories || {};
      customCategories[request.categoryName] = request.domains;
      chrome.storage.local.set({ customCategories }, () => {
        categories = { ...categories, ...customCategories };
        sendResponse({status: 'Categories updated'});
      });
    });
    return true;
  } else if (request.action === 'getInitialData') {
    chrome.storage.local.get(['dailyData', 'categoryData', 'customCategories'], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

chrome.storage.local.get('customCategories', (result) => {
  if (result.customCategories) {
    categories = { ...categories, ...result.customCategories };
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getInitialData') {
      chrome.storage.local.get(['dailyData', 'categoryData', 'customCategories'], (result) => {
        sendResponse(result);
      });
      return true; // Indicates that the response is asynchronous
    }
  });
});