# API Endpoints

## Citizens

### Register a new citizen
**POST** `/api/citizens/register`

Send citizen details to register them in the system.

```json
{
  "name": "John Doe",
  "address": "123 Main St, Dhaka", 
  "dateOfBirth": "1990-01-01",
  "phone": "+8801234567890",
  "email": "john@example.com",
  "nid": "1234567890123"
}
```

### Get citizen info
**GET** `/api/citizens/{citizenId}`

Returns the citizen's profile information.

## Complaints

### View citizen's complaints
**GET** `/api/complaints/citizen/{citizenId}`

Shows all complaints filed by this citizen.

### View citizen's cases
**GET** `/api/complaints/citizen/{citizenId}/cases`

Shows all court cases where this citizen is involved.

### File a new complaint
**POST** `/api/complaints/file`

Submit a new complaint with optional file attachments. Use form-data format.

Required fields:
- `complainantId` - ID of the citizen filing complaint
- `title` - Short title of the complaint
- `description` - Full details of what happened
- `location` - Where the incident occurred
- `area` - Police area/jurisdiction
- `attachments` - Files (optional, max 5 files, 10MB each)

### Get complaint details
**GET** `/api/complaints/{complaintId}`

Shows full details of a specific complaint.

## Police Operations

### OC: View assigned complaints
**GET** `/api/police/oc/{ocId}/complaints`

Shows all complaints assigned to this Officer in Charge.

### OC: Assign officers to investigate
**POST** `/api/police/complaints/{complaintId}/assign-officers`

Let the OC assign officers to investigate a complaint.

```json
{
  "ocId": "officer_in_charge_id",
  "officerIds": ["officer1_id", "officer2_id"]
}
```

### View officers in a station
**GET** `/api/police/station/{stationName}/officers`

Lists all officers available in this police station.

### Officer: View my assigned complaints
**GET** `/api/police/officer/{officerId}/complaints`

Shows all complaints assigned to this officer for investigation.
