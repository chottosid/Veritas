## Minimal API Flow Guide

### Citizen
1) Register/Login
   - POST /api/citizens/register or POST /api/citizens/login
2) File Complaint (optional attachments via IPFS)
   - POST /api/citizens/complaints (form-data)
3) View My Complaints
   - GET /api/citizens/complaints
4) View My Cases
   - GET /api/citizens/cases
5) Request Lawyer for a Case
   - POST /api/citizens/cases/:caseId/request-lawyer
6) Case Proceedings Timeline
   - GET /api/citizens/cases/:caseId/proceedings
7) Notifications
   - GET /api/citizens/notifications

### OC (Officer in Charge)
1) Login
   - POST /api/police/login
2) See Pending Area Complaints
   - GET /api/police/oc/complaints
3) List Station Officers
   - GET /api/police/oc/officers
4) Assign Officer to Complaint
   - POST /api/police/oc/complaints/:complaintId/assign

### Police (Investigating Officer)
1) Login
   - POST /api/police/login
2) View Assigned Complaints
   - GET /api/police/complaints
3) Add Evidence to Complaint (IPFS)
   - POST /api/police/complaints/:complaintId/evidence (form-data)
4) Convert Complaint to FIR (optional attachments; send to judge)
   - POST /api/police/complaints/:complaintId/fir (form-data)
5) View Assigned Cases
   - GET /api/police/cases
6) Add Evidence to Case (IPFS)
   - POST /api/police/cases/:caseId/evidence (form-data)

### Judge
1) Login
   - POST /api/judges/login
2) View FIRs Submitted to Me
   - GET /api/judges/firs
3) Create Case from FIR
   - POST /api/judges/firs/:firId/case
4) View My Cases
   - GET /api/judges/cases
5) Schedule Hearing
   - POST /api/judges/cases/:caseId/hearing
6) View Case Proceedings Timeline
   - GET /api/judges/cases/:caseId/proceedings
7) Close Case with Verdict
   - POST /api/judges/cases/:caseId/close

### Lawyer
1) Login
   - POST /api/lawyers/login
2) Review Incoming Requests
   - GET /api/lawyers/requests
3) Accept/Reject Request
   - PUT /api/lawyers/requests/:requestId (status: ACCEPTED/REJECTED)
4) View My Cases
   - GET /api/lawyers/cases
5) Submit Documents/Evidence (IPFS)
   - POST /api/lawyers/cases/:caseId/documents (form-data)
6) View Case Proceedings Timeline
   - GET /api/lawyers/cases/:caseId/proceedings

### Notifications (all roles)
- GET /api/{role}/notifications
- PUT /api/{role}/notifications/:notificationId/read
- PUT /api/{role}/notifications/read-all


