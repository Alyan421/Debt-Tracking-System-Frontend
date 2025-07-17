/**
 * Application configuration sourced from environment variables
 */
const config = {
  /**
   * API URL for backend requests
   */
  apiUrl: process.env.REACT_APP_API_URL || 'https://localhost:7133',
  
  /**
   * Password for application access
   */
  appPassword: process.env.REACT_APP_PASSWORD || 'default',
  
  /**
   * Basic auth credentials for backend API
   */
  auth: {
    username: process.env.REACT_APP_API_USERNAME || 'admin',
    password: process.env.REACT_APP_API_PASSWORD || 'password',
  },
  
  /**
   * Whether we're running in production mode
   */
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;