# Judge Frontend Implementation

This document outlines the complete frontend implementation for the Judge authentication and management system in the OneStopJustice application.

## Overview

The Judge frontend implementation provides a comprehensive interface for judges to:
- Register and login to the system
- View and manage their dashboard with key metrics
- Review and convert FIRs (First Information Reports) to cases
- Manage cases, schedule hearings, and deliver verdicts
- View their profile and notifications

## Components Created

### 1. JudgeDashboard Component (`/frontend/src/pages/JudgeDashboard.tsx`)

**Purpose**: Main dashboard for judges with overview statistics and quick actions.

**Features**:
- Statistics cards showing pending FIRs, active cases, scheduled hearings, and closed cases
- Recent FIRs list with quick view options
- Recent cases list with status tracking
- Quick action buttons for common tasks
- Court information display

**Key Functions**:
- `fetchDashboardData()`: Fetches FIRs and cases data from backend
- Automatic stats calculation from fetched data
- Status badges for different case states
- Date formatting utilities

**API Endpoints Used**:
- `GET /api/judges/firs` - Fetch FIRs for review
- `GET /api/judges/cases` - Fetch assigned cases

### 2. JudgeFIRs Component (`/frontend/src/pages/JudgeFIRs.tsx`)

**Purpose**: View and manage FIRs submitted for judicial review.

**Features**:
- Search and filter FIRs by number, title, area, or sections
- Detailed FIR view with all complaint information
- Complainant and investigating officer details
- Attachment viewing (IPFS integration)
- Convert FIR to case functionality
- Case number generation

**Key Functions**:
- `fetchFirs()`: Load all FIRs submitted to the judge
- `handleCreateCase()`: Convert FIR to case with case number
- File size formatting for attachments
- Search filtering logic

**API Endpoints Used**:
- `GET /api/judges/firs` - Fetch FIRs for review
- `POST /api/judges/firs/{firId}/case` - Convert FIR to case

### 3. JudgeCases Component (`/frontend/src/pages/JudgeCases.tsx`)

**Purpose**: Comprehensive case management interface for judges.

**Features**:
- View all assigned cases with detailed information
- Case status tracking (Pending, Ongoing, Closed)
- Schedule hearing dates for cases
- Close cases with verdicts
- View case participants (complainant, lawyers, officers)
- Hearing schedule management

**Key Functions**:
- `fetchCases()`: Load all cases assigned to the judge
- `handleScheduleHearing()`: Schedule new hearing dates
- `handleCloseCase()`: Close case with final verdict
- Status badge generation
- Date formatting utilities

**API Endpoints Used**:
- `GET /api/judges/cases` - Fetch assigned cases
- `POST /api/judges/cases/{caseId}/hearing` - Schedule hearing
- `POST /api/judges/cases/{caseId}/close` - Close case with verdict

## Authentication Integration

### Login/Register Support
The existing Login and Register components already support Judge authentication:

**Login Process**:
- Judge selects "Judge" role in dropdown
- Enters Judge ID (JID) and password
- Uses `/api/judges/login` endpoint
- Redirects to `/judge/dashboard` on success

**Registration Process**:
- Judge fills out registration form with:
  - Personal information (name, email, phone, address, date of birth)
  - Judge-specific fields (JID, court name, rank)
  - Password and confirmation
- Uses `/api/judges/register` endpoint
- Automatic login after successful registration

### Profile Management
Updated Profile component to handle Judge-specific information:

**Judge Profile Fields**:
- Judge ID (JID) - read-only
- Court Name - read-only
- Rank - read-only
- Personal information (name, email, phone, address) - editable

## API Configuration Updates

### Added Endpoints
Updated `frontend/src/config/api.ts` with Judge-specific endpoints:

```typescript
// Judge specific endpoints
JUDGES_FIRS: '/judges/firs',
JUDGES_CASES: '/judges/cases',
```

### Authentication Endpoints
Already configured:
- `JUDGES_LOGIN: '/judges/login'`
- `JUDGES_REGISTER: '/judges/register'`
- `JUDGES_PROFILE: '/judges/profile'`
- `JUDGES_NOTIFICATIONS: '/judges/notifications'`

## Routing Configuration

### Added Routes in App.tsx
```typescript
{/* Judge Routes */}
<Route 
  path="/judge/dashboard" 
  element={
    <ProtectedRoute requiredRole="JUDGE">
      <JudgeDashboard />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/judge/firs" 
  element={
    <ProtectedRoute requiredRole="JUDGE">
      <JudgeFIRs />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/judge/cases" 
  element={
    <ProtectedRoute requiredRole="JUDGE">
      <JudgeCases />
    </ProtectedRoute>
  } 
/>
```

### Dashboard Redirection
Updated main Dashboard component to redirect judges:
```typescript
// Redirect judge users to their specific dashboard
if (user?.role === 'JUDGE') {
  return <Navigate to="/judge/dashboard" replace />;
}
```

## Navigation Updates

### Header Component Updates
Added Judge-specific navigation links:

**Desktop Navigation**:
- Dashboard → `/judge/dashboard`
- Cases → `/judge/cases`
- FIRs → `/judge/firs`

**Mobile Navigation**:
- Same links with responsive mobile menu support

## User Interface Features

### Design Consistency
- Uses existing design system and component library
- Consistent card layouts with `card-elegant` styling
- Standard button variants and icon usage
- Responsive grid layouts for different screen sizes

### Interactive Elements
- Search and filter functionality
- Modal dialogs for detailed views
- Loading states with skeleton components
- Error handling with user-friendly messages
- Toast notifications for actions

### Data Visualization
- Status badges with color coding
- Statistics cards with icons
- Date formatting for readability
- File size formatting for attachments
- Progress indicators where appropriate

## Integration with Backend APIs

### API Response Handling
All components properly handle:
- Success responses with data extraction
- Error responses with user feedback
- Loading states during API calls
- Authentication token management (automatic via axios interceptors)

### Data Types
Comprehensive TypeScript interfaces for:
- FIR data structure
- Case data structure  
- Dashboard statistics
- Profile information

### IPFS Integration
- File attachment viewing via IPFS gateway
- Proper URL generation for IPFS hashes
- File size and type handling

## Security and Access Control

### Role-Based Access
- All routes protected with `ProtectedRoute` component
- `requiredRole="JUDGE"` ensures only judges can access
- Automatic redirection for unauthorized users

### Authentication State
- Uses Zustand store for authentication state management
- Token persistence in localStorage
- Automatic logout on token expiry

## Testing and Error Handling

### Error States
- Network error handling with retry options
- Empty state messages for no data
- Loading states to prevent UI confusion
- Form validation and error display

### User Experience
- Consistent loading patterns
- Intuitive navigation flow
- Clear action feedback
- Responsive design for all devices

## File Structure

```
frontend/src/pages/
├── JudgeDashboard.tsx      # Main judge dashboard
├── JudgeFIRs.tsx          # FIR management interface
└── JudgeCases.tsx         # Case management interface

frontend/src/config/
└── api.ts                 # Updated with judge endpoints

frontend/src/components/layout/
└── Header.tsx             # Updated navigation links

Other updated files:
├── App.tsx                # Route definitions
├── Dashboard.tsx          # Redirection logic
└── Profile.tsx            # Judge profile support
```

## Summary

The Judge frontend implementation provides a complete, user-friendly interface that:

1. **Follows Existing Patterns**: Maintains consistency with the existing codebase design and architecture
2. **Comprehensive Functionality**: Covers all Judge APIs mentioned in the documentation
3. **Responsive Design**: Works well on desktop and mobile devices
4. **Error Handling**: Robust error handling and user feedback
5. **Security**: Proper authentication and authorization
6. **Performance**: Efficient data fetching and state management

The implementation is production-ready and seamlessly integrates with the existing OneStopJustice application architecture.
