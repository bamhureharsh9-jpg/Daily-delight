// API Configuration
// ---------------------------------------------------------------
// This file controls whether the app uses a real backend or the
// built-in offline mock data.
//
// SET useMockData TO false AND FILL IN baseUrl WHEN YOU HAVE
// A LIVE BACKEND.  LEAVE useMockData true FOR DEMOS / DEV.
// ---------------------------------------------------------------

export const API_CONFIG = {
  // Toggle this to false once your backend is live
  useMockData: true,

  // Base URL of your backend (no trailing slash).
  // For local dev: 'http://localhost:3000'
  // For Replit:   'https://<your-repl>.repl.co'
  // For Vercel:   'https://<your-deployment>.vercel.app'
  baseUrl: 'INSERT_REPLIT_URL_HERE',

  // WebSocket URL for real-time events (optional, falls back to
  // BroadcastChannel if not set or unreachable)
  wsUrl: '',

  // Request timeout in ms
  timeout: 10000,

  // Include credentials (cookies) on cross-origin requests
  withCredentials: false,
};

export default API_CONFIG;
