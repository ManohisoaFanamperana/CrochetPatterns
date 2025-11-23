// Google Drive synchronization module
import auth from './auth.js';
import cache from './cache.js';

class DriveSync {
  constructor() {
    this.folderId = null;
    this.lastSync = null;
    this.isSyncing = false;
    this.FOLDER_NAME = 'CrochetPatterns';
  }

  async init() {
    this.lastSync = localStorage.getItem('lastDriveSync');
    auth.subscribe((event) => {
      if (event === 'driveConnected') {
        this.ensureFolderExists();
      }
    });
  }

  // Ensure the CrochetPatterns folder exists in Drive
  async ensureFolderExists() {
    if (!auth.isDriveConnected() || this.isSyncing) return;

    try {
      this.isSyncing = true;
      const existing = await this.findFolder(this.FOLDER_NAME);

      if (existing) {
        this.folderId = existing.id;
        console.log('Folder found:', this.folderId);
      } else {
        this.folderId = await this.createFolder(this.FOLDER_NAME);
        console.log('Folder created:', this.folderId);
      }

      this.notifyListeners('folderReady');
    } catch (error) {
      console.error('Error ensuring folder:', error);
      this.notifyListeners('syncError', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Find folder by name
  async findFolder(folderName) {
    const token = auth.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and trashed=false and mimeType='application/vnd.google-apps.folder'&spaces=drive&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
      }
    } catch (error) {
      console.error('Error finding folder:', error);
    }

    return null;
  }

  // Create a new folder
  async createFolder(folderName) {
    const token = auth.getAccessToken();
    if (!token) return null;

    try {
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }

    return null;
  }

  // Upload patron to Drive
  async uploadPatron(patron) {
    if (!auth.isDriveConnected() || !this.folderId) {
      console.warn('Cannot sync: not connected to Drive');
      return false;
    }

    try {
      this.isSyncing = true;

      // Upload patron JSON metadata
      const metadata = {
        ...patron,
        syncedAt: new Date().toISOString()
      };

      const fileId = await this.uploadFile(
        `${patron.id}.json`,
        JSON.stringify(metadata, null, 2),
        'application/json'
      );

      if (!fileId) throw new Error('Failed to upload patron JSON');

      // Upload image if exists
      if (patron.image) {
        await this.uploadFile(
          `${patron.id}-image`,
          patron.image,
          'image/jpeg'
        );
      }

      // Upload PDF if exists
      if (patron.pdf) {
        await this.uploadFile(
          `${patron.id}.pdf`,
          patron.pdf,
          'application/pdf'
        );
      }

      this.lastSync = new Date().toISOString();
      localStorage.setItem('lastDriveSync', this.lastSync);
      this.notifyListeners('syncSuccess', patron.id);

      return true;
    } catch (error) {
      console.error('Error uploading patron:', error);
      this.notifyListeners('syncError', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // Upload a file to Drive
  async uploadFile(fileName, content, mimeType) {
    const token = auth.getAccessToken();
    if (!token || !this.folderId) return null;

    try {
      const metadata = {
        name: fileName,
        parents: [this.folderId]
      };

      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );

      if (content instanceof Blob) {
        formData.append('file', content);
      } else {
        formData.append('file', new Blob([content], { type: mimeType }));
      }

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }

    return null;
  }

  // Sync all local patrons to Drive
  async syncAll() {
    if (!auth.isDriveConnected()) {
      console.warn('Not connected to Drive');
      return false;
    }

    try {
      const patrons = await cache.getAllPatrons();

      for (const patron of patrons) {
        await this.uploadPatron(patron);
      }

      return true;
    } catch (error) {
      console.error('Error syncing all:', error);
      return false;
    }
  }

  // Fetch patrons from Drive
  async fetchFromDrive() {
    if (!auth.isDriveConnected() || !this.folderId) {
      console.warn('Cannot fetch: not connected to Drive');
      return [];
    }

    try {
      this.isSyncing = true;
      const token = auth.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${this.folderId}' in parents and name contains '.json' and trashed=false&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();
      const patrons = [];

      for (const file of data.files || []) {
        const patron = await this.downloadFile(file.id);
        if (patron) patrons.push(patron);
      }

      return patrons;
    } catch (error) {
      console.error('Error fetching from Drive:', error);
      this.notifyListeners('syncError', error);
      return [];
    } finally {
      this.isSyncing = false;
    }
  }

  // Download a file from Drive
  async downloadFile(fileId) {
    const token = auth.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const text = await response.text();
        return JSON.parse(text);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }

    return null;
  }

  // Observer pattern
  listeners = [];

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners(event, data = null) {
    this.listeners.forEach((callback) => callback(event, data));
  }
}

export default new DriveSync();
