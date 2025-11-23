// Main application module
import router from './router.js';
import auth from './auth.js';
import cache from './cache.js';
import driveSync from './driveSync.js';
import { initAdmin } from './admin.js';
import { SAMPLE_PATRONS, LEVEL_COLORS, LEVEL_LABELS, CATEGORIES } from './data.js';

// Initialize the application
async function initApp() {
  console.log('Initializing CrochetPatterns...');

  // Register service worker
  registerServiceWorker();

  // Initialize modules
  await auth.init();
  await driveSync.init();

  // Initialize cache and load sample data on first visit
  await cache.init();
  await initializeSampleData();

  // Render auth UI
  renderAuthUI();

  // Subscribe to auth changes
  auth.subscribe((event) => {
    if (event === 'userChanged' || event === 'driveConnected') {
      renderAuthUI();
    }
  });

  // Setup routes
  setupRoutes();

  // Handle navigation
  router.handlePopState();

  // Determine current page and navigate
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/' || path === '/index.html') {
    await router.navigate('index');
  } else if (path === '/patrons.html' || path === '/patrons') {
    await router.navigate('patrons');
  } else if (path === '/details.html' || path === '/details') {
    const params = new URLSearchParams(window.location.search);
    await router.navigate('details', { id: params.get('id') });
  } else if (path === '/admin.html' || path === '/admin') {
    await router.navigate('admin');
  } else {
    await router.navigate('index');
  }

  // Update connection status
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
}

// Register Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('service-worker.js', {
          scope: '/'
        });
        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

// Initialize sample data on first visit
async function initializeSampleData() {
  const hasData = localStorage.getItem('sampleDataLoaded');

  if (!hasData) {
    try {
      for (const patron of SAMPLE_PATRONS) {
        await cache.savePatron(patron);
      }
      localStorage.setItem('sampleDataLoaded', 'true');
      console.log('Sample data loaded');
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  }
}

// Render authentication UI
function renderAuthUI() {
  const containers = document.querySelectorAll('#googleAuth');

  containers.forEach((container) => {
    if (auth.isConnected()) {
      auth.renderSignOutButton(container.id);
    } else {
      auth.renderSignInButton(container.id);
    }
  });
}

// Setup routes
function setupRoutes() {
  router.register('index', renderIndexPage);
  router.register('patrons', renderPatronsPage);
  router.register('details', renderDetailsPage);
  router.register('admin', renderAdminPage);
}

// Route handlers
async function renderIndexPage() {
  document.body.innerHTML = await fetchPage('index.html');
  attachIndexHandlers();
  await updateStats();
}

async function renderPatronsPage() {
  document.body.innerHTML = await fetchPage('patrons.html');
  attachPatronsHandlers();
  await loadAndDisplayPatrons();
}

async function renderDetailsPage(params) {
  document.body.innerHTML = await fetchPage('details.html');
  attachDetailsHandlers();
  await loadPatronDetails(params.id);
}

async function renderAdminPage() {
  document.body.innerHTML = await fetchPage('admin.html');
  attachAdminHandlers();
  await initAdmin();
}

// Fetch page content
async function fetchPage(filename) {
  try {
    const response = await fetch(filename);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.error(`Error fetching ${filename}:`, error);
  }
  return '';
}

// Index page handlers
function attachIndexHandlers() {
  renderAuthUI();
  updateConnectionStatus();

  document.getElementById('exploreBtn')?.addEventListener('click', () => {
    router.navigate('patrons');
  });

  document.getElementById('adminBtn')?.addEventListener('click', () => {
    router.navigate('admin');
  });
}

// Patrons page handlers
function attachPatronsHandlers() {
  renderAuthUI();
  updateConnectionStatus();

  document.getElementById('homeBtn')?.addEventListener('click', () => {
    router.navigate('index');
  });

  document.getElementById('searchInput')?.addEventListener('input', loadAndDisplayPatrons);
  document.getElementById('categoryFilter')?.addEventListener('change', loadAndDisplayPatrons);
  document.getElementById('levelFilter')?.addEventListener('change', loadAndDisplayPatrons);
}

// Details page handlers
function attachDetailsHandlers() {
  renderAuthUI();
  updateConnectionStatus();

  document.getElementById('backBtn')?.addEventListener('click', () => {
    router.navigate('patrons');
  });

  document.getElementById('errorBackBtn')?.addEventListener('click', () => {
    router.navigate('patrons');
  });
}

// Admin page handlers
function attachAdminHandlers() {
  renderAuthUI();
  updateConnectionStatus();

  document.getElementById('homeBtn')?.addEventListener('click', () => {
    router.navigate('index');
  });
}

// Load and display patrons
async function loadAndDisplayPatrons() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const patronsList = document.getElementById('patronsList');
  const emptyState = document.getElementById('emptyState');

  loadingSpinner?.classList.remove('hidden');
  patronsList?.classList.add('hidden');
  emptyState?.classList.add('hidden');

  try {
    let patrons = await cache.getAllPatrons();

    // Apply filters
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const level = document.getElementById('levelFilter')?.value || '';

    patrons = patrons.filter((patron) => {
      const matchesSearch = patron.name.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || patron.category === category;
      const matchesLevel = !level || patron.level === level;

      return matchesSearch && matchesCategory && matchesLevel;
    });

    if (patrons.length === 0) {
      loadingSpinner?.classList.add('hidden');
      emptyState?.classList.remove('hidden');
      return;
    }

    // Render patron cards
    patronsList.innerHTML = patrons
      .map(
        (patron) => `
      <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer card-enter" 
        onclick="import('./app.js').then(m => m.navigateToDetails('${patron.id}'))">
        <div class="bg-gradient-to-r from-purple-400 to-purple-600 h-32 flex items-center justify-center">
          ${patron.image ? `<img src="${patron.image}" alt="${patron.name}" class="w-full h-full object-cover">` : '<span class="text-5xl">📸</span>'}
        </div>
        <div class="p-4">
          <h3 class="font-bold text-lg mb-2 truncate">${patron.name}</h3>
          <p class="text-gray-600 text-sm mb-3">${CATEGORIES[patron.category] || patron.category}</p>
          <div class="flex gap-2 items-center">
            <span class="px-2 py-1 rounded text-sm text-white ${LEVEL_COLORS[patron.level]}">${LEVEL_LABELS[patron.level]}</span>
            <span class="text-sm text-gray-500">🧶 ${patron.hookSize}mm</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    loadingSpinner?.classList.add('hidden');
    patronsList?.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading patrons:', error);
    loadingSpinner?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
  }
}

// Navigate to patron details
window.navigateToDetails = async (id) => {
  await router.navigate('details', { id });
};

// Load patron details
async function loadPatronDetails(id) {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const detailsContent = document.getElementById('detailsContent');
  const errorState = document.getElementById('errorState');

  try {
    const patron = await cache.getPatron(id);

    if (!patron) {
      loadingSpinner?.classList.add('hidden');
      errorState?.classList.remove('hidden');
      return;
    }

    // Populate details
    document.getElementById('patronName').textContent = patron.name;
    document.getElementById('patronCategory').textContent = CATEGORIES[patron.category] || patron.category;
    document.getElementById('patronLevel').textContent = LEVEL_LABELS[patron.level] || patron.level;
    document.getElementById('levelBadge').textContent = LEVEL_LABELS[patron.level];
    document.getElementById('levelBadge').className = `px-3 py-1 rounded-full text-sm font-semibold text-white ${LEVEL_COLORS[patron.level]}`;
    document.getElementById('patronHookSize').textContent = `${patron.hookSize} mm`;
    document.getElementById('patronYarnAmount').textContent = `${patron.yarnAmount} m`;
    document.getElementById('patronDescription').textContent = patron.description || 'Aucune description';

    const materialsList = document.getElementById('patronMaterials');
    materialsList.innerHTML = (patron.materials || [])
      .map((material) => `<li>${material}</li>`)
      .join('');

    if (patron.image) {
      document.getElementById('patronImage').src = patron.image;
    }

    // Download PDF button
    if (patron.pdf) {
      document.getElementById('downloadPdfBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = patron.pdf;
        link.download = `${patron.name}.pdf`;
        link.click();
      });
    } else {
      document.getElementById('downloadPdfBtn').disabled = true;
      document.getElementById('downloadPdfBtn').style.opacity = '0.5';
    }

    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', async () => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce patron?')) {
        try {
          await cache.deletePatron(id);
          await router.navigate('patrons');
        } catch (error) {
          alert('Erreur lors de la suppression');
        }
      }
    });

    loadingSpinner?.classList.add('hidden');
    detailsContent?.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading patron details:', error);
    loadingSpinner?.classList.add('hidden');
    errorState?.classList.remove('hidden');
  }
}

// Update statistics
async function updateStats() {
  try {
    const patronCount = (await cache.getAllPatrons()).length;
    document.getElementById('patronCount').textContent = patronCount;

    const storage = await cache.getStorageSize();
    if (storage) {
      document.getElementById('storageStatus').textContent = `${storage.usage} MB`;
    }
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Update connection status
function updateConnectionStatus() {
  const statusElements = document.querySelectorAll('#connectionStatus');
  const isOnline = navigator.onLine;
  const isDriveConnected = auth.isDriveConnected();

  statusElements.forEach((el) => {
    if (isOnline && isDriveConnected) {
      el.textContent = '● En ligne (Drive synchronisé)';
      el.style.color = '#10b981';
    } else if (isOnline) {
      el.textContent = '● En ligne';
      el.style.color = '#3b82f6';
    } else {
      el.textContent = '● Hors ligne';
      el.style.color = '#ef4444';
    }
  });
}

// Subscribe to auth changes
auth.subscribe(() => {
  updateConnectionStatus();
  renderAuthUI();
});

driveSync.subscribe((event) => {
  if (event === 'syncSuccess') {
    console.log('Sync successful');
    updateConnectionStatus();
  }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
