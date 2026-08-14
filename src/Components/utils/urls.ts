
// For local testing against the backend running on port 5001:
const LOCAL_API_URL = 'http://192.168.1.39:5001/';

// Production API URL:
const PROD_API_URL = 'http://facekit.officekithr.net/facekit/';

// Set to true when testing against local backend server
const USE_LOCAL_SERVER = false;

export const BASE_URL = USE_LOCAL_SERVER ? LOCAL_API_URL : PROD_API_URL;
export const API_URL = USE_LOCAL_SERVER ? LOCAL_API_URL : PROD_API_URL;
