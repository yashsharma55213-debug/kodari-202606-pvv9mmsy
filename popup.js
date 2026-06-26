// State Management
let currentCategory = 'texture';
let downloads = [];
let announcements = [];
let userStats = {
  downloads: 0,
  favorites: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTabs();
  initDownloads();
  initAdmin();
  initSearch();
  updateStats();
});

// Load data from storage
async function loadData() {
  const data = await chrome.storage.local.get(['downloads', 'announcements', 'userStats', 'adminPassword']);
  
  downloads = data.downloads || [];
  announcements = data.announcements || [];
  userStats = data.userStats || { downloads: 0, favorites: [] };
  
  if (!data.adminPassword) {
    await chrome.storage.local.set({ adminPassword: 'betteryash123' });
  }
  
  renderDownloads();
  renderAnnouncements();
  updateStats();
}

// Save data to storage
async function saveData() {
  await chrome.storage.local.set({
    downloads: downloads,
    announcements: announcements,
    userStats: userStats
  });
}

// Tab Navigation
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
  
  // Quick navigation buttons
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      document.querySelector(`[data-tab="${target}"]`).click();
    });
  });
}

// Downloads Management
function initDownloads() {
  const categoryBtns = document.querySelectorAll('.category-btn');
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      renderDownloads();
    });
  });
}

function renderDownloads() {
  const container = document.getElementById('downloadsList');
  const filtered = downloads.filter(d => d.type === currentCategory);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No ${getCategoryName(currentCategory)} available yet.</p>
        <p class="empty-hint">Check back soon for new releases! 🚀</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(download => `
    <div class="download-item" data-id="${download.id}">
      <div class="download-header">
        <div>
          <div class="download-title">${download.name}</div>
        </div>
        <span class="download-badge">${download.type}</span>
      </div>
      <div class="download-meta">
        <span>📦 ${download.version}</span>
        <span>💾 ${download.size}</span>
      </div>
      <div class="download-desc">${download.description}</div>
      <div class="download-actions">
        <button class="download-btn" data-link="${download.link}">Download</button>
        <button class="favorite-btn ${userStats.favorites.includes(download.id) ? 'favorited' : ''}" data-id="${download.id}">
          ${userStats.favorites.includes(download.id) ? '★' : '☆'}
        </button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const link = btn.dataset.link;
      chrome.tabs.create({ url: link });
      
      userStats.downloads++;
      saveData();
      updateStats();
      
      btn.textContent = 'Downloaded ✓';
      setTimeout(() => btn.textContent = 'Download', 2000);
    });
  });
  
  container.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const index = userStats.favorites.indexOf(id);
      
      if (index > -1) {
        userStats.favorites.splice(index, 1);
        btn.classList.remove('favorited');
        btn.textContent = '☆';
      } else {
        userStats.favorites.push(id);
        btn.classList.add('favorited');
        btn.textContent = '★';
      }
      
      saveData();
      updateStats();
    });
  });
}

function getCategoryName(type) {
  const names = {
    texture: 'Texture Packs',
    mods: 'Mod Packs',
    controls: 'Controls'
  };
  return names[type] || type;
}

// Search Functionality
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.download-item');
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? 'block' : 'none';
    });
  });
}

// Announcements
function renderAnnouncements() {
  const container = document.getElementById('announcementsList');
  
  if (announcements.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No announcements yet.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = announcements.map(announcement => `
    <div class="announcement-item">
      <div class="announcement-header">
        <div class="announcement-title">${announcement.title}</div>
        <div class="announcement-date">${announcement.date}</div>
      </div>
      <div class="announcement-text">${announcement.message}</div>
    </div>
  `).join('');
}

// Stats Update
function updateStats() {
  document.getElementById('totalDownloads').textContent = downloads.length;
  document.getElementById('userDownloads').textContent = userStats.downloads;
  document.getElementById('userFavorites').textContent = userStats.favorites.length;
  
  chrome.action.setBadgeText({ text: announcements.length > 0 ? String(announcements.length) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#ff6b00' });
}

// Admin Panel
function initAdmin() {
  const adminToggle = document.getElementById('adminToggle');
  const adminModal = document.getElementById('adminModal');
  const closeAdmin = document.getElementById('closeAdmin');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminPassword = document.getElementById('adminPassword');
  
  adminToggle.addEventListener('click', () => {
    adminModal.classList.add('active');
  });
  
  closeAdmin.addEventListener('click', () => {
    adminModal.classList.remove('active');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    adminPassword.value = '';
  });
  
  adminLoginBtn.addEventListener('click', async () => {
    const password = adminPassword.value;
    const data = await chrome.storage.local.get('adminPassword');
    
    if (password === data.adminPassword) {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
    } else {
      adminPassword.value = '';
      adminPassword.placeholder = '❌ Wrong password!';
      setTimeout(() => adminPassword.placeholder = 'Enter admin password', 2000);
    }
  });
  
  // Allow Enter key to login
  adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      adminLoginBtn.click();
    }
  });
  
  // Admin tabs
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
  
  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.adminTab;
      
      adminTabBtns.forEach(b => b.classList.remove('active'));
      adminTabPanes.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
  
  // Upload content
  document.getElementById('uploadBtn').addEventListener('click', () => {
    const type = document.getElementById('uploadType').value;
    const name = document.getElementById('uploadName').value;
    const version = document.getElementById('uploadVersion').value;
    const size = document.getElementById('uploadSize').value;
    const description = document.getElementById('uploadDesc').value;
    const link = document.getElementById('uploadLink').value;
    
    if (!name || !version || !link) {
      alert('Please fill in all required fields!');
      return;
    }
    
    const download = {
      id: Date.now().toString(),
      type: type,
      name: name,
      version: version,
      size: size || 'N/A',
      description: description || 'No description provided.',
      link: link,
      date: new Date().toLocaleDateString()
    };
    
    downloads.push(download);
    saveData();
    renderDownloads();
    
    document.getElementById('uploadName').value = '';
    document.getElementById('uploadVersion').value = '';
    document.getElementById('uploadSize').value = '';
    document.getElementById('uploadDesc').value = '';
    document.getElementById('uploadLink').value = '';
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'BETTERYASH Hub',
      message: `New ${getCategoryName(type)} added: ${name}`
    });
    
    alert('Download added successfully! ✓');
  });
  
  // Create announcement
  document.getElementById('announceBtn').addEventListener('click', () => {
    const title = document.getElementById('announceTitle').value;
    const message = document.getElementById('announceText').value;
    
    if (!title || !message) {
      alert('Please fill in all fields!');
      return;
    }
    
    const announcement = {
      id: Date.now().toString(),
      title: title,
      message: message,
      date: new Date().toLocaleDateString()
    };
    
    announcements.unshift(announcement);
    saveData();
    renderAnnouncements();
    updateStats();
    
    document.getElementById('announceTitle').value = '';
    document.getElementById('announceText').value = '';
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      title: 'BETTERYASH Hub',
      message: `New announcement: ${title}`
    });
    
    alert('Announcement posted! ✓');
  });
  
  // Change password
  document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const newPassword = document.getElementById('newPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }
    
    await chrome.storage.local.set({ adminPassword: newPassword });
    document.getElementById('newPassword').value = '';
    alert('Password changed successfully! ✓');
  });
  
  // Clear data
  document.getElementById('clearDataBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      downloads = [];
      announcements = [];
      userStats = { downloads: 0, favorites: [] };
      await chrome.storage.local.set({ downloads: [], announcements: [], userStats: { downloads: 0, favorites: [] } });
      
      renderDownloads();
      renderAnnouncements();
      updateStats();
      
      alert('All data cleared! ✓');
    }
  });
}