# Frontend API Configuration

## Overview
The frontend now uses a centralized API configuration to manage all backend URLs and endpoints consistently across the application.

## Configuration Files

### 1. `/frontend/src/config/api.ts`
This is the main configuration file that centralizes all API-related settings:

- **API_CONFIG.BASE_URL**: The backend server base URL (configurable via `VITE_API_BASE_URL`)
- **API_CONFIG.API_BASE_URL**: The full API base URL (BASE_URL + /api)
- **API_CONFIG.HEALTH_URL**: Health check endpoint
- **API_CONFIG.IPFS_GATEWAY**: IPFS gateway URL for file access
- **API_CONFIG.ENDPOINTS**: Object containing all API endpoints

### 2. Environment Variables
- **`.env`**: Local development environment variables
- **`.env.example`**: Template file documenting available variables

Available environment variables:
- `VITE_API_BASE_URL`: Backend server URL (default: http://localhost:3001)
- `VITE_IPFS_GATEWAY`: IPFS gateway URL (default: https://ipfs.io/ipfs)

## Usage Examples

### Basic API Calls
```typescript
import api from '@/lib/api';
import { API_CONFIG } from '@/config/api';

// Using the configured axios instance (recommended)
const response = await api.get(API_CONFIG.ENDPOINTS.CITIZENS_PROFILE);

// Using specific endpoints
const login = await api.post(API_CONFIG.ENDPOINTS.CITIZENS_LOGIN, credentials);
```

### IPFS File Access
```typescript
import { getIPFSUrl } from '@/config/api';

// Get full IPFS URL for a file hash
const fileUrl = getIPFSUrl(attachment.ipfsHash);
window.open(fileUrl, '_blank');
```

### Health Check
```typescript
import { API_CONFIG } from '@/config/api';

const health = await fetch(API_CONFIG.HEALTH_URL);
```

## Updated Files

The following files have been updated to use the centralized configuration:

1. **`/src/lib/api.ts`** - Main axios instance configuration
2. **`/src/lib/debug.ts`** - Debug utilities
3. **`/src/pages/Login.tsx`** - Login endpoints
4. **`/src/pages/Register.tsx`** - Registration endpoints  
5. **`/src/pages/Profile.tsx`** - Profile endpoints
6. **`/src/pages/ComplaintDetail.tsx`** - IPFS URL generation
7. **`/src/pages/PoliceJudges.tsx`** - Updated to use centralized API instance

## Benefits

1. **Single Source of Truth**: All URLs defined in one place
2. **Environment Flexibility**: Easy switching between development/production
3. **Maintainability**: Changes to API structure only need updates in one file
4. **Type Safety**: TypeScript interfaces for better development experience
5. **Consistency**: All components use the same configuration

## Migration Notes

- All hardcoded URLs have been replaced with centralized configuration
- Environment variables are now properly utilized
- IPFS gateway is configurable for different deployment scenarios
- All API calls now use the centralized axios instance with proper authentication

## Future Enhancements

- Add retry logic and timeout configurations
- Implement request/response interceptors for logging
- Add API versioning support
- Create endpoint builders for dynamic routes
