// Centralized API configuration
export const API_CONFIG = {
  // Backend server configuration
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  API_PREFIX: '/api',
  
  // Derived URLs
  get API_BASE_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}`;
  },
  
  get HEALTH_URL() {
    return `${this.BASE_URL}/health`;
  },
  
  // IPFS configuration
  IPFS_GATEWAY: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs',
  
  // Other endpoints
  ENDPOINTS: {
    // Auth endpoints
    CITIZENS_LOGIN: '/citizens/login',
    CITIZENS_REGISTER: '/citizens/register',
    POLICE_LOGIN: '/police/login',
    POLICE_REGISTER: '/police/register',
    JUDGES_LOGIN: '/judges/login', 
    JUDGES_REGISTER: '/judges/register',
    LAWYERS_LOGIN: '/lawyers/login',
    LAWYERS_REGISTER: '/lawyers/register',
    
    // Profile endpoints
    CITIZENS_PROFILE: '/citizens/profile',
    POLICE_PROFILE: '/police/profile',
    JUDGES_PROFILE: '/judges/profile',
    LAWYERS_PROFILE: '/lawyers/profile',
    
    // Core functionality
    CITIZENS_COMPLAINTS: '/citizens/complaints',
    CITIZENS_CASES: '/citizens/cases',
    CITIZENS_LAWYERS: '/citizens/lawyers',
    CITIZENS_LAWYER_REQUESTS: '/citizens/lawyer-requests',
    POLICE_COMPLAINTS: '/police/complaints',
    POLICE_JUDGES: '/police/judges',
    POLICE_CASES: '/police/cases',
    
    // Judge specific endpoints
    JUDGES_FIRS: '/judges/firs',
    JUDGES_CASES: '/judges/cases',
    
    // Lawyer specific endpoints
    LAWYERS_REQUESTS: '/lawyers/requests',
    LAWYERS_CASES: '/lawyers/cases',
    
    // Notifications
    CITIZENS_NOTIFICATIONS: '/citizens/notifications',
    POLICE_NOTIFICATIONS: '/police/notifications',
    JUDGES_NOTIFICATIONS: '/judges/notifications',
    LAWYERS_NOTIFICATIONS: '/lawyers/notifications',
    
    // OTP endpoints
    OTP_SEND: '/otp/send',
    OTP_VERIFY: '/otp/verify',
    OTP_RESEND: '/otp/resend',
  }
} as const;

// Helper function to get full IPFS URL
export const getIPFSUrl = (hash: string): string => {
  return `${API_CONFIG.IPFS_GATEWAY}/${hash}`;
};

// Helper function to build API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

export default API_CONFIG;
