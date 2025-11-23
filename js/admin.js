// Admin panel module
import cache from './cache.js';
import driveSync from './driveSync.js';
import auth from './auth.js';
import { CATEGORIES } from './data.js';

export async function initAdmin() {
  const form = document.getElementById('patronForm');
  const imageInput = document.getElementById('patronImage');
  const imagePreview = document.getElementById('imagePreview');
  const pdfInput = document.getElementById('patronPdf');
  const pdfName = document.getElementById('pdfName');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  const submitText = document.getElementById('submitText');

  let compressedImage = null;
  let pdfFile = null;

  // Image preview
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      imagePreview.src = preview;
      imagePreview.classList.remove('hidden');

      try {
        const compressed = await cache.compressImage(file);
        compressedImage = await cache.blobToBase64(compressed);
      } catch (error) {
        console.error('Image compression error:', error);
        errorMessage.textContent = 'Erreur lors de la compression de l\'image';
        errorMessage.classList.remove('hidden');
      }
    }
  });

  // PDF preview
  pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      pdfFile = file;
      pdfName.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.isConnected()) {
      errorMessage.textContent = 'Vous devez d\'abord vous connecter avec Google';
      errorMessage.classList.remove('hidden');
      return;
    }

    try {
      successMessage.classList.add('hidden');
      errorMessage.classList.add('hidden');
      submitText.textContent = 'Sauvegarde en cours...';

      const patron = {
        id: Date.now().toString(),
        name: document.getElementById('patronName').value,
        category: document.getElementById('patronCategory').value,
        level: document.getElementById('patronLevel').value,
        hookSize: document.getElementById('patronHookSize').value,
        yarnAmount: parseInt(document.getElementById('patronYarnAmount').value),
        materials: document.getElementById('patronMaterials').value
          .split(',')
          .map((m) => m.trim())
          .filter((m) => m),
        description: document.getElementById('patronDescription').value,
        image: compressedImage,
        pdf: pdfFile ? await cache.blobToBase64(pdfFile) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to IndexedDB
      await cache.savePatron(patron);

      // Try to sync to Drive if connected
      if (auth.isDriveConnected()) {
        await driveSync.uploadPatron(patron);
      }

      successMessage.classList.remove('hidden');
      submitText.textContent = 'Sauvegarder le patron';

      // Reset form
      form.reset();
      compressedImage = null;
      pdfFile = null;
      imagePreview.classList.add('hidden');
      pdfName.textContent = '';

      // Reload local patrons list
      loadLocalPatrons();

      // Hide success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    } catch (error) {
      console.error('Form submission error:', error);
      errorMessage.textContent = `Erreur: ${error.message}`;
      errorMessage.classList.remove('hidden');
      submitText.textContent = 'Sauvegarder le patron';
    }
  });

  // Load and display local patrons
  async function loadLocalPatrons() {
    const list = document.getElementById('localPatronsList');
    const noPatrons = document.getElementById('noLocalPatrons');

    try {
      const patrons = await cache.getAllPatrons();

      if (patrons.length === 0) {
        list.innerHTML = '';
        noPatrons.classList.remove('hidden');
      } else {
        noPatrons.classList.add('hidden');
        list.innerHTML = patrons
          .map(
            (patron) => `
          <div class="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition">
            <div>
              <h3 class="font-semibold text-lg">${patron.name}</h3>
              <p class="text-gray-600 text-sm">${CATEGORIES[patron.category] || patron.category}</p>
              <p class="text-gray-500 text-xs mt-1">${new Date(patron.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <button class="delete-patron-btn bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition" data-id="${patron.id}">
              Supprimer
            </button>
          </div>
        `
          )
          .join('');

        // Add delete handlers
        document.querySelectorAll('.delete-patron-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('Êtes-vous sûr de vouloir supprimer ce patron?')) {
              try {
                await cache.deletePatron(id);
                loadLocalPatrons();
              } catch (error) {
                errorMessage.textContent = `Erreur lors de la suppression: ${error.message}`;
                errorMessage.classList.remove('hidden');
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('Error loading patrons:', error);
      errorMessage.textContent = 'Erreur lors du chargement des patrons';
      errorMessage.classList.remove('hidden');
    }
  }

  // Initial load
  loadLocalPatrons();
}
