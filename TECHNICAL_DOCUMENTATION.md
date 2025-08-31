# Justice Nexus Chain - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Design](#system-design)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Authentication & Security](#authentication--security)
8. [Blockchain Integration](#blockchain-integration)
9. [Frontend Architecture](#frontend-architecture)

## Project Overview

Justice Nexus Chain is a comprehensive blockchain-based justice management system designed to streamline legal processes, enhance transparency, and improve the efficiency of the judicial system. The platform serves multiple user roles including citizens, police officers, judges, and lawyers, providing role-specific dashboards and functionalities.

### Key Features
- **Multi-role User Management**: Citizens, Police, Judges, Lawyers
- **Complaint Management**: File and track complaints with blockchain verification
- **Case Management**: End-to-end case lifecycle management
- **Document Management**: Secure document storage with IPFS integration
- **Real-time Notifications**: WebSocket-based real-time updates
- **Blockchain Transparency**: Immutable record keeping on blockchain
- **Dashboard Analytics**: Role-specific insights and statistics

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (Hardhat)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   MongoDB       │    │   IPFS Storage  │
│   (Real-time)   │    │   (Database)    │    │   (Documents)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### System Components
1. **Frontend Application**: React-based SPA with TypeScript
2. **Backend API**: Express.js REST API with middleware
3. **Database**: MongoDB with Mongoose ODM
4. **Blockchain**: Ethereum-based smart contracts
5. **File Storage**: IPFS for decentralized document storage
6. **Real-time Communication**: WebSocket server
7. **Authentication**: JWT-based authentication system

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Real-time**: Socket.io
- **Blockchain**: Ethers.js, Hardhat

### Blockchain
- **Network**: Ethereum (Amoy Testnet)
- **Development**: Hardhat
- **Smart Contracts**: Solidity 0.8.24
- **Web3 Library**: Ethers.js

### Infrastructure
- **File Storage**: IPFS (Pinata)
- **Version Control**: Git
- **Package Manager**: npm
- **Development**: Nodemon

## System Design

### User Roles & Permissions

#### 1. Citizen
- **Capabilities**: File complaints, track cases, request lawyers
- **Dashboard**: Complaint history, case status, notifications
- **Authentication**: Email + OTP verification

#### 2. Police Officer
- **Capabilities**: Manage complaints, create FIRs, submit evidence
- **Dashboard**: Assigned cases, FIR management, evidence tracking
- **Authentication**: PID + password

#### 3. Judge
- **Capabilities**: Review FIRs, manage cases, schedule hearings
- **Dashboard**: Case queue, hearing management, decision tracking
- **Authentication**: JID + password

#### 4. Lawyer
- **Capabilities**: Accept client requests, manage cases, submit documents
- **Dashboard**: Client requests, case management, document library
- **Authentication**: BID + password

### Data Flow Architecture

```
User Action → Frontend → API Gateway → Business Logic → Database
     ↓              ↓           ↓            ↓           ↓
Blockchain ← Smart Contract ← Web3 ← Event Handler ← Data Change
     ↓              ↓           ↓            ↓           ↓
IPFS Storage ← Document Upload ← File Handler ← Validation
     ↓              ↓           ↓            ↓           ↓
WebSocket → Real-time Update → Notification → User Interface
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Citizen Registration
```http
POST /citizens/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "nid": "string",
  "password": "string",
  "otp": "string"
}
```

#### Citizen Login
```http
POST /citizens/login
Content-Type: application/json

{
  "nid": "string",
  "phone": "string",
  "password": "string"
}
```

#### OTP Verification
```http
POST /otp/verify
Content-Type: application/json

{
  "email": "string",
  "otp": "string",
  "type": "REGISTRATION"
}
```

### Complaint Management

#### File Complaint
```http
POST /citizens/complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "string",
  "description": "string",
  "category": "string",
  "location": "string",
  "evidence": [files]
}
```

#### Get Complaints
```http
GET /citizens/complaints
Authorization: Bearer <token>
```

### Case Management

#### Create FIR
```http
POST /police/cases
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "complaintId": "string",
  "firNumber": "string",
  "description": "string",
  "evidence": [files]
}
```

#### Get Cases
```http
GET /judges/cases
Authorization: Bearer <token>
```

## Database Schema

### User Models

#### Citizen Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: String,
  dateOfBirth: Date,
  nid: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Police Schema
```javascript
{
  _id: ObjectId,
  name: String,
  pid: String,
  rank: String,
  station: String,
  isOC: Boolean,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Judge Schema
```javascript
{
  _id: ObjectId,
  name: String,
  jid: String,
  courtName: String,
  rank: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Lawyer Schema
```javascript
{
  _id: ObjectId,
  name: String,
  bid: String,
  firmName: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Business Models

#### Complaint Schema
```javascript
{
  _id: ObjectId,
  citizenId: ObjectId,
  title: String,
  description: String,
  category: String,
  location: String,
  status: String,
  evidence: [String], // IPFS hashes
  blockchainHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Case Schema
```javascript
{
  _id: ObjectId,
  complaintId: ObjectId,
  firNumber: String,
  policeId: ObjectId,
  judgeId: ObjectId,
  lawyerId: ObjectId,
  status: String,
  evidence: [String], // IPFS hashes
  blockchainHash: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication & Security

### JWT Authentication
- **Algorithm**: HS256
- **Expiration**: 24 hours (configurable)
- **Payload**: User ID, Role, and role-specific identifiers

### Password Security
- **Hashing**: bcrypt with salt rounds of 10
- **Validation**: Minimum 8 characters, complexity requirements

### OTP System
- **Type**: Email-based OTP verification
- **Expiration**: 10 minutes
- **Rate Limiting**: 60-second cooldown between requests
- **Security**: One-time use, expires after verification

### API Security
- **CORS**: Configured for frontend domain
- **Rate Limiting**: Implemented on sensitive endpoints
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## Blockchain Integration

### Smart Contracts

#### JusticeEvents Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract JusticeEvents {
    event ComplaintFiled(
        uint256 indexed complaintId,
        address indexed citizen,
        string title,
        string ipfsHash,
        uint256 timestamp
    );
    
    event CaseCreated(
        uint256 indexed caseId,
        uint256 indexed complaintId,
        string firNumber,
        address indexed police,
        uint256 timestamp
    );
    
    event CaseUpdated(
        uint256 indexed caseId,
        string status,
        uint256 timestamp
    );
}
```

### Blockchain Operations
1. **Complaint Filing**: Records complaint hash on blockchain
2. **FIR Creation**: Links FIR to complaint on blockchain
3. **Case Updates**: Tracks case status changes
4. **Evidence Storage**: IPFS hashes stored on blockchain

### Web3 Integration
- **Network**: Amoy Testnet (Polygon)
- **Gas Management**: Automatic gas estimation
- **Error Handling**: Comprehensive transaction error handling
- **Event Listening**: Real-time blockchain event monitoring

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── auth/
│   ├── layout/
│   ├── ui/
│   └── [role-specific]/
├── pages/
│   ├── auth/
│   ├── dashboard/
│   └── [feature]/
├── hooks/
├── store/
├── lib/
└── config/
```

### State Management
- **Global State**: Zustand for authentication and user data
- **Local State**: React useState for component-specific state
- **Server State**: Axios for API calls with error handling

### Routing Strategy
- **Protected Routes**: Role-based access control
- **Dynamic Routing**: User role determines dashboard
- **Navigation Guards**: Authentication checks

### UI/UX Design
- **Design System**: Consistent component library
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliance
- **Performance**: Code splitting and lazy loading

## Conclusion

Justice Nexus Chain represents a modern approach to justice management, leveraging blockchain technology for transparency and immutability while providing an intuitive user experience. The system is designed to be scalable, secure, and maintainable, with comprehensive documentation in place.

The platform successfully bridges the gap between traditional justice systems and modern technology, providing a foundation for future enhancements and integrations.
