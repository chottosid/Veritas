// API Testing and Debug Utilities
import api, { getAuthToken, isAuthenticated } from './api';
import { API_CONFIG } from '@/config/api';

export const debugAPI = {
  // Test if the API is accessible
  testConnection: async () => {
    try {
      const response = await fetch(API_CONFIG.HEALTH_URL);
      const data = await response.json();
      console.log('API Health Check:', data);
      return data;
    } catch (error) {
      console.error('API Connection Failed:', error);
      return null;
    }
  },

  // Check current authentication status
  checkAuth: () => {
    const token = getAuthToken();
    const authenticated = isAuthenticated();
    
    console.log('Auth Debug Info:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      isAuthenticated: authenticated,
      localStorage: {
        token: localStorage.getItem('token') ? 'Present' : 'Missing',
        user: localStorage.getItem('user') ? 'Present' : 'Missing',
        authStorage: localStorage.getItem('auth-storage') ? 'Present' : 'Missing'
      }
    });
    
    return { hasToken: !!token, authenticated };
  },

  // Test API call with current token
  testAuthenticatedCall: async () => {
    try {
      console.log('Testing authenticated API call...');
      const response = await api.get('/citizens/profile');
      console.log('Profile API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Authenticated API call failed:', error.response?.data || error.message);
      return null;
    }
  },

  // Test complaints API specifically
  testComplaintsAPI: async () => {
    try {
      console.log('Testing complaints API...');
      const response = await api.get('/citizens/complaints');
      console.log('Complaints API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Complaints API call failed:', error.response?.data || error.message);
      return null;
    }
  }
};

// Global debug function for development
(window as any).debugAPI = debugAPI;

export default debugAPI;
