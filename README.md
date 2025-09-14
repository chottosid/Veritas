# Veritas

<div align="center">
  <img src="frontend/public/veritas.png" alt="Veritas Logo" width="200" height="200">
</div>

**A comprehensive blockchain-based justice management system**

Veritas is a complete blockchain-based justice management system designed to bring transparency and efficiency to the judicial process using smart contracts and modern web technologies.

## What We Built

Veritas is a comprehensive platform that connects citizens, police officers, judges, and lawyers in a transparent, blockchain-powered ecosystem. It serves as a digital bridge between traditional justice systems and modern technology.

**Key Features:**
- Citizens can file complaints with blockchain verification
- Police can create FIRs and manage cases
- Judges can review cases and schedule hearings
- Lawyers can accept client requests and manage cases
- Everything is stored on blockchain for transparency
- Real-time notifications and updates

## Architecture Overview

We've built this as a full-stack application with:
- **Frontend**: React with TypeScript for a modern user interface
- **Backend**: Node.js with Express for API handling
- **Database**: MongoDB for storing user data and case information
- **Blockchain**: Ethereum-based smart contracts for immutable records
- **File Storage**: IPFS for decentralized document storage

The system uses JWT authentication, WebSocket for real-time updates, and integrates with Ethereum-based networks for blockchain functionality.

## Quick Setup

### Prerequisites
Make sure you have these installed:
- Node.js (v16 or higher)
- MongoDB (running locally or cloud instance)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB connection string
   - Add your blockchain private key and RPC URL
   - Configure IPFS credentials (Pinata)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:8080 (if running frontend separately)

### For Production
```bash
npm start
```

That's it! The system should be up and running. Check the technical documentation for more detailed setup instructions and API documentation.

---

*Built with ❤️ for transparent justice*
