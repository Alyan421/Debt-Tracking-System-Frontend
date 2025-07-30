import config from '../config';

/**
 * Service for handling authentication with the backend
 */
const authService = {
  /**
   * Creates a Basic Auth header value using the configured credentials
   */
  getBasicAuthHeader: () => {
    const { username, password } = config.auth;
    const base64Credentials = btoa(`${username}:${password}`);
    return `Basic ${base64Credentials}`;
  },
  
  /**
   * Verify if the current credentials work by making a test API request
   * This is useful to check if the configured credentials are valid
   */
  verifyCredentials: async () => {
    try {
      // Try to access any protected endpoint
      const response = await fetch(`${config.apiUrl}/api/Customer`, {
        method: 'GET',
        headers: {
          'Authorization': authService.getBasicAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Credentials verification failed:', error);
      return false;
    }
  },
  
  /**
   * Store a flag in session storage indicating the user has completed the app login flow
   * This is for the frontend UI access control only, not for API auth
   */
  setFrontendAuthenticated: (isAuthenticated: boolean) => {
    sessionStorage.setItem('frontendAuthenticated', isAuthenticated ? 'true' : 'false');
  },
  
  /**
   * Check if user has completed the frontend login flow
   */
  isFrontendAuthenticated: () => {
    return sessionStorage.getItem('frontendAuthenticated') === 'true';
  },
  
  /**
   * Log out from the frontend (this doesn't affect API auth which is stateless)
   */
  frontendLogout: () => {
    sessionStorage.removeItem('frontendAuthenticated');
  }
};

export default authService;