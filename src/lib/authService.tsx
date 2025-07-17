import config from '../config';

/**
 * Service for handling authentication with the backend
 */
const authService = {
  /**
   * Creates a Basic Auth header value
   */
  getBasicAuthHeader: () => {
    const { username, password } = config.auth;
    const base64Credentials = btoa(`${username}:${password}`);
    return `Basic ${base64Credentials}`;
  },
  
  /**
   * Check if user is authenticated by verifying credentials against the backend
   */
  verifyAuth: async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': authService.getBasicAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Auth verification failed:', error);
      return false;
    }
  },
  
  /**
   * Store authentication state in session storage
   */
  setAuthenticated: (isAuthenticated: boolean) => {
    sessionStorage.setItem('isAuthenticated', isAuthenticated ? 'true' : 'false');
  },
  
  /**
   * Check if user is authenticated from session storage
   */
  isAuthenticated: () => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  },
  
  /**
   * Log out user by clearing authentication state
   */
  logout: () => {
    sessionStorage.removeItem('isAuthenticated');
  }
};

export default authService;