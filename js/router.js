// Simple router module
class Router {
  constructor() {
    this.routes = new Map();
    this.currentPage = null;
    this.listeners = [];
  }

  // Register a route
  register(path, handler) {
    this.routes.set(path, handler);
  }

  // Navigate to a page
  async navigate(path, params = {}) {
    const handler = this.routes.get(path);

    if (!handler) {
      console.warn(`Route not found: ${path}`);
      return;
    }

    this.currentPage = path;
    window.history.pushState({ path, params }, '', `/${path}`);

    try {
      await handler(params);
      this.notifyListeners('routeChanged', { path, params });
    } catch (error) {
      console.error(`Error navigating to ${path}:`, error);
      this.notifyListeners('navigationError', error);
    }
  }

  // Handle browser back/forward
  handlePopState() {
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.path) {
        this.navigate(event.state.path, event.state.params).catch(console.error);
      }
    });
  }

  // Get current page
  getCurrentPage() {
    return this.currentPage;
  }

  // Observer pattern
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => callback(event, data));
  }
}

export default new Router();
