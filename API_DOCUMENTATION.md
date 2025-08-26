# API Endpoints

**Authentication:** Most endpoints require a JWT token in the Authorization header (`Authorization: Bearer your_token`). Only registration and login are public.

## Citizens
<!-- 
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
``` -->
<!-- 
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
``` -->
<!-- 
### Login
**POST** `/api/citizens/login`

**Request:**
```json
{
  "nid": "1234567890123",
  "password": "securepassword123"
}
``` -->

<!-- **Response:**
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
``` -->
<!-- 
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
``` -->

<!-- ### View my complaints
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
      "area": "Dhanmondi Police Station",
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
``` -->
<!-- 
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
``` -->
<!-- 
### File a new complaint
**POST** `/api/citizens/complaints`

**Request (form-data):**
- `title`: "Theft Report"
- `description`: "My bike was stolen from parking"
- `area`: "Dhanmondi Police Station"
- `attachments`: [file1.jpg, file2.pdf] (optional, max 5 files)

**Response:**
```json
{
  "success": true,
  "message": "Complaint filed successfully",
  "data": {
    "id": "complaint_id",
    "title": "Theft Report",
    "description": "My bike was stolen from parking",
    "area": "Dhanmondi Police Station",
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
    "area": "Dhanmondi Police Station",
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
``` -->

<!-- ### Get all available lawyers
**GET** `/api/citizens/lawyers`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lawyer_id",
      "name": "Advocate Khan",
      "firmName": "Khan & Associates",
      "bid": "B123456"
    }
  ]
}
``` -->

### Request a lawyer for a case
**POST** `/api/citizens/cases/{caseId}/request-lawyer`

**Request:**
```json
{
  "lawyerId": "lawyer_id",
  "message": "Please represent me in this case"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lawyer request sent successfully",
  "data": {
    "id": "request_id",
    "status": "PENDING",
    "requestedLawyerId": {
      "name": "Advocate Khan",
      "firmName": "Khan & Associates"
    },
    "caseId": {
      "caseNumber": "CASE-2025-001"
    },
    "createdAt": "2025-08-24T12:00:00Z"
  }
}
```

### Get my lawyer requests
**GET** `/api/citizens/lawyer-requests`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "request_id",
      "status": "ACCEPTED",
      "requestedLawyerId": {
        "name": "Advocate Khan",
        "firmName": "Khan & Associates"
      },
      "caseId": {
        "caseNumber": "CASE-2025-001"
      },
      "createdAt": "2025-08-24T12:00:00Z"
    }
  ]
}
```
<!-- 
### Get my notifications
**GET** `/api/citizens/notifications`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: Show only unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "Case Update",
      "message": "New hearing date scheduled for your case",
      "type": "HEARING_SCHEDULED",
      "isRead": false,
      "caseId": {
        "caseNumber": "CASE-2025-001"
      },
      "metadata": {
        "hearingDate": "2025-09-01T10:00:00Z"
      },
      "createdAt": "2025-08-24T14:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Mark notification as read
**PUT** `/api/citizens/notifications/{notificationId}/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notification_id",
    "isRead": true
  }
}
```

### Mark all notifications as read
**PUT** `/api/citizens/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "15 notifications marked as read",
  "data": {
    "modifiedCount": 15
  }
}
<!-- ``` -->
<!-- 
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
``` -->
<!-- 
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
``` --> -->
<!-- 
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
      "area": "Dhanmondi Police Station",
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
``` -->


### Get complaint details
**GET** `/api/police/complaints/{complaintId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "complaint_id",
    "title": "Theft Report",
    "description": "Bike stolen from parking",
    "area": "Dhanmondi Police Station",
    "status": "UNDER_INVESTIGATION",
    "complainantId": {
      "name": "John Doe",
      "nid": "1234567890123",
      "phone": "+8801234567890",
      "email": "john@example.com",
      "address": "123 Main St, Dhaka"
    },
    "assignedOfficerIds": [
      {
        "name": "Officer Smith",
        "pid": "P123456",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      }
    ],
    "attachments": [
      {
        "fileName": "evidence.jpg",
        "ipfsHash": "QmHash123",
        "fileSize": 245760,
        "uploadedAt": "2025-08-24T10:00:00Z"
      }
    ],
    "hasFIR": false,
    "fir": null,
    "createdAt": "2025-08-24T09:00:00Z"
  }
}
```

### Get all judges (for FIR submission)
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
      "area": "Dhanmondi Police Station"
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
  <!-- 7:26 pm  -->

<!-- ### Get all judges
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
``` -->


### Submit additional evidence for complaint
**POST** `/api/police/complaints/{complaintId}/evidence`

**Request (form-data):**
- `description`: "Additional CCTV footage"
- `evidence`: [cctv_footage.mp4, witness_statement.pdf] (max 5 files)

**Response:**
```json
{
  "success": true,
  "message": "Evidence submitted successfully",
  "data": {
    "complaintId": "complaint_id",
    "evidenceFiles": [
      {
        "fileName": "cctv_footage.mp4",
        "ipfsHash": "QmHash789",
        "fileSize": 1024000,
        "description": "Additional CCTV footage",
        "uploadedBy": "police_id",
        "uploadedAt": "2025-08-24T13:00:00Z"
      }
    ]
  }
}
```
<!-- 
### Get my assigned cases
**GET** `/api/police/cases`

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
        "firNumber": "FIR-2025-001"
      },
      "assignedJudgeId": {
        "name": "Justice Rahman",
        "courtName": "Dhaka Metropolitan Court"
      },
      "hearingDates": ["2025-09-01T10:00:00Z"]
    }
  ]
}
``` -->


### Submit additional evidence for case
**POST** `/api/police/cases/{caseId}/evidence`

**Request (form-data):**
- `description`: "Forensic report"
- `evidence`: [forensic_report.pdf, dna_analysis.pdf] (max 5 files)

**Response:**
```json
{
  "success": true,
  "message": "Evidence submitted successfully",
  "data": {
    "caseId": "case_id",
    "evidenceFiles": [
      {
        "fileName": "forensic_report.pdf",
        "ipfsHash": "QmHash101",
        "fileSize": 512000,
        "description": "Forensic report",
        "uploadedBy": "police_id",
        "uploadedAt": "2025-08-24T14:00:00Z"
      }
    ]
  }
}
```
<!-- 
### Get my notifications
**GET** `/api/police/notifications`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: Show only unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "New Case Assignment",
      "message": "You have been assigned to investigate a new case",
      "type": "CASE_CREATED",
      "isRead": false,
      "caseId": {
        "caseNumber": "CASE-2025-001"
      },
      "createdAt": "2025-08-24T14:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 60,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Mark notification as read
**PUT** `/api/police/notifications/{notificationId}/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notification_id",
    "isRead": true
  }
}
```

### Mark all notifications as read
**PUT** `/api/police/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "8 notifications marked as read",
  "data": {
    "modifiedCount": 8
  }
}
``` -->


## OC (Officer in Charge) Operations

### Get pending complaints for OC
**GET** `/api/police/oc/complaints`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "complaint_id",
      "title": "Theft Report",
      "description": "Bike stolen from parking",
      "area": "Dhanmondi Police Station",
      "status": "PENDING",
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

### Assign investigating officer to complaint
**POST** `/api/police/oc/complaints/{complaintId}/assign`

**Request:**
```json
{
  "officerId": "officer_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Officer assigned successfully",
  "data": {
    "id": "complaint_id",
    "status": "UNDER_INVESTIGATION",
    "assignedOfficerIds": [
      {
        "name": "Officer Smith",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      }
    ]
  }
}
```

### Get all officers in OC's station
**GET** `/api/police/oc/officers`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "officer_id",
      "name": "Officer Smith",
      "rank": "Inspector",
      "pid": "P123456"
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
        "area": "Dhanmondi Police Station",
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

### Convert FIR to case
**POST** `/api/judges/firs/{firId}/case`

**Request:**
```json
{
  "caseNumber": "CASE-2025-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case created successfully",
  "data": {
    "id": "case_id",
    "caseNumber": "CASE-2025-001",
    "status": "PENDING",
    "firId": {
      "firNumber": "FIR-2025-001"
    },
    "assignedJudgeId": {
      "name": "Justice Rahman",
      "courtName": "Dhaka Metropolitan Court"
    },
    "createdAt": "2025-08-24T13:00:00Z"
  }
}
```

### Get all cases assigned to me
**GET** `/api/judges/cases`

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
        "firNumber": "FIR-2025-001"
      },
      "accusedLawyerId": {
        "name": "Advocate Khan",
        "firmName": "Khan & Associates"
      },
      "prosecutorLawyerId": {
        "name": "Advocate Ahmed",
        "firmName": "Ahmed & Co"
      },
      "hearingDates": ["2025-09-01T10:00:00Z"],
      "createdAt": "2025-08-24T13:00:00Z"
    }
  ]
}
```

### Get case details
**GET** `/api/judges/cases/{caseId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case_id",
    "caseNumber": "CASE-2025-001",
    "status": "ONGOING",
    "firId": {
      "firNumber": "FIR-2025-001",
      "complaintId": {
        "title": "Theft Report",
        "complainantId": {
          "name": "John Doe",
          "nid": "1234567890123",
          "phone": "+8801234567890"
        }
      }
    },
    "assignedJudgeId": {
      "name": "Justice Rahman",
      "courtName": "Dhaka Metropolitan Court"
    },
    "accusedLawyerId": {
      "name": "Advocate Khan",
      "firmName": "Khan & Associates"
    },
    "prosecutorLawyerId": {
      "name": "Advocate Ahmed",
      "firmName": "Ahmed & Co"
    },
    "investigatingOfficerIds": [
      {
        "name": "Officer Smith",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      }
    ],
    "hearingDates": ["2025-09-01T10:00:00Z"]
  }
}
```

### Schedule hearing date
**POST** `/api/judges/cases/{caseId}/hearing`

**Request:**
```json
{
  "hearingDate": "2025-09-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hearing date scheduled successfully",
  "data": {
    "id": "case_id",
    "caseNumber": "CASE-2025-001",
    "status": "ONGOING",
    "hearingDates": ["2025-09-01T10:00:00Z"]
  }
}
```

### Close case with verdict
**POST** `/api/judges/cases/{caseId}/close`

**Request:**
```json
{
  "verdict": "Guilty - 5 years imprisonment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case closed successfully",
  "data": {
    "id": "case_id",
    "caseNumber": "CASE-2025-001",
    "status": "CLOSED",
    "verdict": "Guilty - 5 years imprisonment"
  }
}
```

### Get my notifications
**GET** `/api/judges/notifications`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: Show only unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "New FIR Submitted",
      "message": "A new FIR has been submitted to your court",
      "type": "FIR_REGISTERED",
      "isRead": false,
      "firId": {
        "firNumber": "FIR-2025-002"
      },
      "createdAt": "2025-08-24T15:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 40,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Mark notification as read
**PUT** `/api/judges/notifications/{notificationId}/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notification_id",
    "isRead": true
  }
}
```

### Mark all notifications as read
**PUT** `/api/judges/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "12 notifications marked as read",
  "data": {
    "modifiedCount": 12
  }
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

### Get lawyer requests sent to me
**GET** `/api/lawyers/requests`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "request_id",
      "status": "PENDING",
      "citizenId": {
        "name": "John Doe",
        "nid": "1234567890123",
        "phone": "+8801234567890"
      },
      "caseId": {
        "caseNumber": "CASE-2025-001"
      },
      "createdAt": "2025-08-24T12:00:00Z"
    }
  ]
}
```

### Accept or reject lawyer request
**PUT** `/api/lawyers/requests/{requestId}`

**Request:**
```json
{
  "status": "ACCEPTED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "data": {
    "id": "request_id",
    "status": "ACCEPTED",
    "citizenId": {
      "name": "John Doe",
      "nid": "1234567890123",
      "phone": "+8801234567890"
    },
    "caseId": {
      "caseNumber": "CASE-2025-001"
    }
  }
}
```

### Get my assigned cases
**GET** `/api/lawyers/cases`

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
        "firNumber": "FIR-2025-001"
      },
      "assignedJudgeId": {
        "name": "Justice Rahman",
        "courtName": "Dhaka Metropolitan Court"
      },
      "accusedLawyerId": {
        "name": "Advocate Khan",
        "firmName": "Khan & Associates"
      },
      "prosecutorLawyerId": {
        "name": "Advocate Ahmed",
        "firmName": "Ahmed & Co"
      },
      "hearingDates": ["2025-09-01T10:00:00Z"]
    }
  ]
}
```

### Get case details
**GET** `/api/lawyers/cases/{caseId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case_id",
    "caseNumber": "CASE-2025-001",
    "status": "ONGOING",
    "firId": {
      "firNumber": "FIR-2025-001",
      "complaintId": {
        "title": "Theft Report",
        "complainantId": {
          "name": "John Doe",
          "nid": "1234567890123",
          "phone": "+8801234567890"
        }
      }
    },
    "assignedJudgeId": {
      "name": "Justice Rahman",
      "courtName": "Dhaka Metropolitan Court"
    },
    "accusedLawyerId": {
      "name": "Advocate Khan",
      "firmName": "Khan & Associates"
    },
    "prosecutorLawyerId": {
      "name": "Advocate Ahmed",
      "firmName": "Ahmed & Co"
    },
    "investigatingOfficerIds": [
      {
        "name": "Officer Smith",
        "rank": "Inspector",
        "station": "Dhanmondi Police Station"
      }
    ],
    "hearingDates": ["2025-09-01T10:00:00Z"]
  }
}
```

### Submit documents for case
**POST** `/api/lawyers/cases/{caseId}/documents`

**Request (form-data):**
- `documentType`: "EVIDENCE"
- `description`: "Client's alibi evidence"
- `documents`: [alibi_witness.pdf, cctv_evidence.mp4] (max 5 files)

**Response:**
```json
{
  "success": true,
  "message": "Documents submitted successfully",
  "data": {
    "caseId": "case_id",
    "documents": [
      {
        "fileName": "alibi_witness.pdf",
        "ipfsHash": "QmHash202",
        "fileSize": 256000,
        "documentType": "EVIDENCE",
        "description": "Client's alibi evidence",
        "uploadedBy": "lawyer_id",
        "uploadedAt": "2025-08-24T15:00:00Z"
      }
    ]
  }
}
```

### Get my notifications
**GET** `/api/lawyers/notifications`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `unreadOnly`: Show only unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_id",
      "title": "New Case Assignment",
      "message": "You have been assigned to represent a client in a new case",
      "type": "CASE_CREATED",
      "isRead": false,
      "caseId": {
        "caseNumber": "CASE-2025-002"
      },
      "createdAt": "2025-08-24T16:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalItems": 80,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Mark notification as read
**PUT** `/api/lawyers/notifications/{notificationId}/read`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "notification_id",
    "isRead": true
  }
}
```

### Mark all notifications as read
**PUT** `/api/lawyers/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "message": "6 notifications marked as read",
  "data": {
    "modifiedCount": 6
  }
}
```

## Case Proceedings (Timeline)

Each notable action on a case creates a proceeding entry. Proceeding types include:
- `CASE_CREATED`
- `HEARING_SCHEDULED`
- `EVIDENCE_SUBMITTED`
- `DOCUMENT_FILED`
- `STATUS_CHANGED`
- `SUMMON_ISSUED`
- `ORDER_PASSED`
- `JUDGMENT`

Proceedings include: `type`, `createdByRole`, `createdById`, `description`, optional `attachments` (IPFS), and `metadata` (e.g., `hearingDate`).

### Get proceedings for a case (citizen)
**GET** `/api/citizens/cases/{caseId}/proceedings`

Requires the citizen to be the complainant tied to the case's FIR.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proceeding_id",
      "type": "HEARING_SCHEDULED",
      "createdByRole": "JUDGE",
      "description": "Hearing scheduled on 2025-09-01T10:00:00Z",
      "metadata": { "hearingDate": "2025-09-01T10:00:00Z" },
      "attachments": [],
      "createdAt": "2025-08-24T13:00:00Z"
    }
  ]
}
```

### Get proceedings for a case (judge)
**GET** `/api/judges/cases/{caseId}/proceedings`

Accessible only if the case is assigned to the judge.

### Get proceedings for a case (lawyer)
**GET** `/api/lawyers/cases/{caseId}/proceedings`

Accessible if the lawyer is assigned as accused or prosecutor.

### Auto-created proceedings
- When a judge creates a case: `CASE_CREATED`
- When a judge schedules a hearing: `HEARING_SCHEDULED`
- When police submit evidence: `EVIDENCE_SUBMITTED`
- When a lawyer submits documents: `DOCUMENT_FILED` or `EVIDENCE_SUBMITTED`
- When a judge closes a case: `JUDGMENT`

Proceedings are read-only; they form the timeline of actions. Notifications may be generated from these events separately.

## Health Check

### Server health check
**GET** `/health`

**Response:**
```json
{
  "status": "OK",
  "message": "Server and database are running"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!",
  "timestamp": "2025-08-24T10:00:00Z"
}
```
