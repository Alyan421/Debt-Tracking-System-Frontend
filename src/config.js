console.log('Environment variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_PASSWORD: process.env.REACT_APP_PASSWORD,
  NODE_ENV: process.env.NODE_ENV
});

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
   * Whether we're running in production mode
   */
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;