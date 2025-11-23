// Google Authentication module
class GoogleAuth {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.accessToken = null;
    this.CLIENT_ID = '138400096798-0npivu83t0v4nju3p555v5975mp1krpu.apps.googleusercontent.com';
    this.SCOPES = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    this.init();
  }

  async init() {
    return new Promise((resolve) => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: this.CLIENT_ID,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        this.isInitialized = true;
        this.restoreSession();
        resolve(true);
      } else {
        console.warn('Google Identity Services not loaded');
        resolve(false);
      }
    });
  }

  handleCredentialResponse(response) {
    if (response.credential) {
      const decoded = this.decodeJwt(response.credential);
      this.currentUser = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
      this.accessToken = response.credential;
      this.saveSession();
      this.notifyListeners('userChanged');
    }
  }

  async loginWithDrive() {
    if (!this.isInitialized) {
      console.error('Google Auth not initialized');
      return false;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.accounts.oauth2) {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES.join(' '),
            callback: (response) => {
              if (response.access_token) {
                this.accessToken = response.access_token;
                this.saveSession();
                this.notifyListeners('driveConnected');
                resolve(true);
              } else {
                reject(new Error('No access token'));
              }
            },
            error_callback: (error) => reject(error)
          });
          client.requestAccessToken({ prompt: '' });
        } else {
          reject(new Error('OAuth2 not available'));
        }
      });
      return response;
    } catch (error) {
      console.error('Drive login error:', error);
      return false;
    }
  }

  logout() {
    this.currentUser = null;
    this.accessToken = null;
    localStorage.removeItem('userSession');
    localStorage.removeItem('driveToken');
    this.notifyListeners('userChanged');
  }

  decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem('userSession', JSON.stringify(this.currentUser));
    }
    if (this.accessToken) {
      localStorage.setItem('driveToken', this.accessToken);
    }
  }

  restoreSession() {
    const userSession = localStorage.getItem('userSession');
    const driveToken = localStorage.getItem('driveToken');

    if (userSession) {
      this.currentUser = JSON.parse(userSession);
      this.notifyListeners('userChanged');
    }

    if (driveToken) {
      this.accessToken = driveToken;
      this.notifyListeners('driveConnected');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isConnected() {
    return !!this.currentUser;
  }

  isDriveConnected() {
    return !!this.accessToken;
  }

  renderSignInButton(containerId) {
    if (this.isInitialized && typeof google !== 'undefined') {
      google.accounts.id.renderButton(
        document.getElementById(containerId),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          logo_alignment: 'left'
        }
      );
    }
  }

  renderSignOutButton(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      if (this.currentUser) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${this.currentUser.picture}" alt="Avatar" 
              style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div style="font-size: 0.875rem;">
              <p style="margin: 0; font-weight: 600;">${this.currentUser.name}</p>
              <p style="margin: 0; color: #666; font-size: 0.8rem;">${this.currentUser.email}</p>
            </div>
            <button id="logoutBtn" style="
              margin-left: 8px;
              padding: 6px 12px;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 600;
            ">Déconnexion</button>
          </div>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
          this.logout();
        });
      } else {
        this.renderSignInButton(containerId);
      }
    }
  }

  // Observer pattern
  listeners = [];

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach((callback) => callback(event));
  }
}

export default new GoogleAuth();
