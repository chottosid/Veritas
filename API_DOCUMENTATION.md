# API Endpoints

**Authentication:** Most endpoints require a JWT token in the Authorization header (`Authorization: Bearer your_token`). Only registration and login are public.

## Citizens

### Register a new citizen
**POST** `/api/citizens/register`

**Request:**
```json
{
  "name": "John Doe",
  "address": "123 Main St, Dhaka", 
  "dateOfBirth": "1990-01-01",
  "phone": "+8801234567890",
  "email": "john@example.com",
  "nid": "1234567890123",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Citizen registered successfully",
  "data": {
    "id": "citizen_id",
    "name": "John Doe",
    "nid": "1234567890123",
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/citizens/login`

**Request:**
```json
{
  "nid": "1234567890123",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "citizen_id",
    "name": "John Doe",
    "nid": "1234567890123",
    "token": "jwt_token_here"
  }
}
```

### Get my profile
**GET** `/api/citizens/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "citizen_id",
    "name": "John Doe",
    "address": "123 Main St, Dhaka",
    "dateOfBirth": "1990-01-01",
    "phone": "+8801234567890",
    "email": "john@example.com",
    "nid": "1234567890123",
    "createdAt": "2025-08-24T10:00:00Z"
  }
}
```

### View my complaints
**GET** `/api/citizens/complaints`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "complaint_id",
      "title": "Theft Report",
      "description": "My bike was stolen",
      "location": "Dhanmondi, Dhaka",
      "area": "Dhanmondi",
      "status": "UNDER_INVESTIGATION",
      "assignedOfficerIds": [
        {
          "id": "officer_id",
          "name": "Officer Smith",
          "rank": "Inspector"
        }
      ],
      "attachments": [
        {
          "fileName": "evidence.jpg",
          "ipfsHash": "QmHash123",
          "uploadedAt": "2025-08-24T10:00:00Z"
        }
      ],
      "createdAt": "2025-08-24T09:00:00Z"
    }
  ]
}
```

### View my cases
**GET** `/api/citizens/cases`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "case_id",
      "caseNumber": "CASE-2025-001",
      "status": "ONGOING",
      "firId": {
        "firNumber": "FIR-2025-001",
        "sections": ["IPC-379"]
      },
      "assignedJudgeId": {
        "name": "Justice Rahman",
        "courtName": "Dhaka Metropolitan Court"
      },
      "hearingDates": ["2025-09-01T10:00:00Z"],
      "createdAt": "2025-08-24T11:00:00Z"
    }
  ]
}
```

### File a new complaint
**POST** `/api/citizens/complaints`

**Request (form-data):**
- `title`: "Theft Report"
- `description`: "My bike was stolen from parking"
- `location`: "Dhanmondi, Dhaka"
- `area`: "Dhanmondi"
- `attachments`: [file1.jpg, file2.pdf] (optional)

**Response:**
```json
{
  "success": true,
  "message": "Complaint filed successfully",
  "data": {
    "id": "complaint_id",
    "title": "Theft Report",
    "description": "My bike was stolen from parking",
    "location": "Dhanmondi, Dhaka",
    "area": "Dhanmondi",
    "status": "PENDING",
    "complainantId": {
      "name": "John Doe",
      "nid": "1234567890123"
    },
    "attachments": [
      {
        "fileName": "evidence.jpg",
        "ipfsHash": "QmHash123",
        "fileSize": 245760
      }
    ],
    "createdAt": "2025-08-24T10:00:00Z"
  }
}
```

### Get complaint details
**GET** `/api/citizens/complaints/{complaintId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "complaint_id",
    "title": "Theft Report",
    "description": "My bike was stolen",
    "location": "Dhanmondi, Dhaka",
    "area": "Dhanmondi",
    "status": "UNDER_INVESTIGATION",
    "complainantId": {
      "name": "John Doe",
      "nid": "1234567890123",
      "phone": "+8801234567890"
    },
    "assignedOfficerIds": [
      {
        "name": "Officer Smith",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      }
    ],
    "attachments": [],
    "createdAt": "2025-08-24T10:00:00Z"
  }
}
```

## Police Operations

### Register
**POST** `/api/police/register`

**Request:**
```json
{
  "name": "Officer Smith",
  "address": "Police Station Address",
  "dateOfBirth": "1985-01-01",
  "phone": "+8801234567891",
  "email": "officer@police.gov",
  "pid": "P123456",
  "rank": "Inspector",
  "station": "Dhanmondi Police Station",
  "isOC": false,
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Police officer registered successfully",
  "data": {
    "id": "police_id",
    "name": "Officer Smith",
    "pid": "P123456",
    "rank": "Inspector",
    "station": "Dhanmondi Police Station",
    "isOC": false,
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/police/login`

**Request:**
```json
{
  "pid": "P123456",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "police_id",
    "name": "Officer Smith",
    "pid": "P123456",
    "rank": "Inspector",
    "station": "Dhanmondi Police Station",
    "isOC": false,
    "token": "jwt_token_here"
  }
}
```

### Get my profile
**GET** `/api/police/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "police_id",
    "name": "Officer Smith",
    "address": "Police Station Address",
    "pid": "P123456",
    "rank": "Inspector",
    "station": "Dhanmondi Police Station",
    "isOC": false,
    "createdAt": "2025-08-24T08:00:00Z"
  }
}
```

### View my assigned complaints
**GET** `/api/police/complaints`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "complaint_id",
      "title": "Theft Report",
      "description": "Bike stolen from parking",
      "location": "Dhanmondi, Dhaka",
      "status": "UNDER_INVESTIGATION",
      "complainantId": {
        "name": "John Doe",
        "nid": "1234567890123",
        "phone": "+8801234567890"
      },
      "createdAt": "2025-08-24T09:00:00Z"
    }
  ]
}
```

### Convert complaint to FIR
**POST** `/api/police/complaints/{complaintId}/fir`

**Request (form-data):**
- `firNumber`: "FIR-2025-001"
- `sections`: ["IPC-379", "IPC-380"]
- `judgeId`: "judge_id" (optional)
- `attachments`: [investigation_report.pdf] (optional)

**Response:**
```json
{
  "success": true,
  "message": "FIR registered successfully",
  "data": {
    "id": "fir_id",
    "firNumber": "FIR-2025-001",
    "sections": ["IPC-379", "IPC-380"],
    "complaintId": {
      "title": "Theft Report",
      "description": "Bike stolen from parking",
      "location": "Dhanmondi, Dhaka"
    },
    "registeredBy": {
      "name": "Officer Smith",
      "pid": "P123456",
      "rank": "Inspector"
    },
    "submittedToJudge": {
      "name": "Justice Rahman",
      "courtName": "Dhaka Metropolitan Court"
    },
    "attachments": [
      {
        "fileName": "investigation_report.pdf",
        "ipfsHash": "QmHash456",
        "fileSize": 512000
      }
    ],
    "createdAt": "2025-08-24T12:00:00Z"
  }
}
```

### Get all judges
**GET** `/api/police/judges`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "judge_id",
      "name": "Justice Rahman",
      "courtName": "Dhaka Metropolitan Court",
      "jid": "J123456"
    }
  ]
}
```

## Judges

### Register
**POST** `/api/judges/register`

**Request:**
```json
{
  "name": "Justice Rahman",
  "address": "Court Address",
  "dateOfBirth": "1970-01-01",
  "phone": "+8801234567892",
  "email": "judge@court.gov",
  "courtName": "Dhaka Metropolitan Court",
  "rank": "Metropolitan Judge",
  "jid": "J123456",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Judge registered successfully",
  "data": {
    "id": "judge_id",
    "name": "Justice Rahman",
    "jid": "J123456",
    "courtName": "Dhaka Metropolitan Court",
    "rank": "Metropolitan Judge",
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/judges/login`

**Request:**
```json
{
  "jid": "J123456",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "judge_id",
    "name": "Justice Rahman",
    "jid": "J123456",
    "courtName": "Dhaka Metropolitan Court",
    "rank": "Metropolitan Judge",
    "token": "jwt_token_here"
  }
}
```

### Get my profile
**GET** `/api/judges/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "judge_id",
    "name": "Justice Rahman",
    "address": "Court Address",
    "courtName": "Dhaka Metropolitan Court",
    "rank": "Metropolitan Judge",
    "jid": "J123456",
    "createdAt": "2025-08-24T07:00:00Z"
  }
}
```

### View FIRs submitted to me
**GET** `/api/judges/firs`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fir_id",
      "firNumber": "FIR-2025-001",
      "sections": ["IPC-379", "IPC-380"],
      "complaintId": {
        "title": "Theft Report",
        "description": "Bike stolen from parking",
        "location": "Dhanmondi, Dhaka",
        "complainantId": {
          "name": "John Doe",
          "nid": "1234567890123",
          "phone": "+8801234567890"
        }
      },
      "registeredBy": {
        "name": "Officer Smith",
        "pid": "P123456",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      },
      "attachments": [
        {
          "fileName": "investigation_report.pdf",
          "ipfsHash": "QmHash456"
        }
      ],
      "createdAt": "2025-08-24T12:00:00Z"
    }
  ]
}
```

## Lawyers

### Register
**POST** `/api/lawyers/register`

**Request:**
```json
{
  "name": "Advocate Khan",
  "address": "Law Firm Address",
  "dateOfBirth": "1975-01-01",
  "phone": "+8801234567893",
  "email": "lawyer@firm.com",
  "firmName": "Khan & Associates",
  "bid": "B123456",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lawyer registered successfully",
  "data": {
    "id": "lawyer_id",
    "name": "Advocate Khan",
    "bid": "B123456",
    "firmName": "Khan & Associates",
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/lawyers/login`

**Request:**
```json
{
  "bid": "B123456",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "lawyer_id",
    "name": "Advocate Khan",
    "bid": "B123456",
    "firmName": "Khan & Associates",
    "token": "jwt_token_here"
  }
}
```

### Get my profile
**GET** `/api/lawyers/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lawyer_id",
    "name": "Advocate Khan",
    "address": "Law Firm Address",
    "firmName": "Khan & Associates",
    "bid": "B123456",
    "createdAt": "2025-08-24T06:00:00Z"
  }
}
```
