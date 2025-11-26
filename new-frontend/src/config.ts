/**
 * Configuration for API endpoints based on environment
 */

// Get the API URL from environment variable, with fallback based on mode
const getApiUrl = (): string => {
  // In Vite, import.meta.env.MODE is 'development' or 'production'
  // import.meta.env.VITE_API_URL can be set in .env files
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback based on mode
  if (import.meta.env.MODE === 'production') {
    return 'http://34.83.37.61:8000';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('Environment mode:', import.meta.env.MODE);
}

