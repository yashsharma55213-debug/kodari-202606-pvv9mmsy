// Background service worker for BETTERYASH Hub

// Installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('BETTERYASH Hub installed successfully!');
  
  // Set initial badge
  chrome.action.setBadgeBackgroundColor({ color: '#ff6b00' });
  
  // Welcome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    title: 'BETTERYASH Official Hub',
    message: 'Welcome! Click the extension icon to get started.'
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    chrome.action.setBadgeText({ text: request.text });
  }
  
  if (request.action === 'notify') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: request.title || 'BETTERYASH Hub',
      message: request.message
    });
  }
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('Service worker active');
  }
});