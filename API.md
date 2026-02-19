# AdaPlanning API Documentation

**25+ REST API endpoints for staff scheduling system**

## 🏗️ Base Configuration

```typescript
// Base API URL
const API_BASE = process.env.NEXT_PUBLIC_ADA_API_URL || 'https://ada.mindgen.app/api/v1'

// Authentication
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 📅 Schedule Management

### Get Schedules
```http
GET /api/schedules
GET /api/schedules?period=week&date=2024-02-19
GET /api/schedules?staff_id={uuid}&date_from=2024-02-19&date_to=2024-02-25
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "restaurant_id": "uuid", 
      "start_date": "2024-02-19",
      "end_date": "2024-02-25",
      "status": "published",
      "total_shifts": 45,
      "total_hours": 360,
      "published_at": "2024-02-18T10:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1 }
}
```

### Create Schedule
```http
POST /api/schedules
```

**Body:**
```json
{
  "start_date": "2024-02-19",
  "end_date": "2024-02-25",
  "name": "Week of February 19, 2024",
  "copy_from_template": true,
  "template_id": "uuid"
}
```

### Publish Schedule  
```http
PUT /api/schedules/{id}/publish
```

**Body:**
```json
{
  "notify_staff": true,
  "notification_message": "New schedule published for week of Feb 19"
}
```

## 👥 Staff Management

### Get Staff Members
```http
GET /api/staff
GET /api/staff?active_only=true
GET /api/staff?position=server&available_on=monday
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Jessica",
      "last_name": "Bombini", 
      "position": "manager",
      "hourly_rate": 18.50,
      "status": "active",
      "default_hours_per_week": 40,
      "availability": [
        {
          "day_of_week": 1,
          "start_time": "09:00",
          "end_time": "17:00",
          "availability_type": "regular"
        }
      ]
    }
  ]
}
```

### Create Staff Member
```http
POST /api/staff
```

**Body:**
```json
{
  "first_name": "Marco",
  "last_name": "Rossi",
  "email": "marco@losteria.be",
  "phone": "+32468123456",
  "position": "server",
  "hourly_rate": 15.00,
  "hire_date": "2024-02-19",
  "default_hours_per_week": 32
}
```

### Update Staff Availability
```http
PUT /api/staff/{id}/availability
```

**Body:**
```json
{
  "availability": [
    {
      "day_of_week": 1, // Monday
      "start_time": "10:00",
      "end_time": "18:00",
      "availability_type": "regular"
    },
    {
      "day_of_week": 2, // Tuesday  
      "start_time": "12:00",
      "end_time": "20:00",
      "availability_type": "preferred"
    }
  ]
}
```

## ⏰ Shift Operations

### Get Shifts
```http
GET /api/shifts?date=2024-02-19
GET /api/shifts?staff_id={uuid}&week=2024-W08
GET /api/shifts?status=scheduled&position=server
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "staff_member": {
        "id": "uuid",
        "first_name": "Jessica",
        "last_name": "Bombini",
        "position": "manager"
      },
      "scheduled_date": "2024-02-19",
      "start_time": "12:00:00",
      "end_time": "20:00:00", 
      "break_duration": 30,
      "status": "scheduled",
      "calculated_hours": 7.5,
      "is_overtime": false
    }
  ]
}
```

### Create Shift
```http
POST /api/shifts
```

**Body:**
```json
{
  "staff_member_id": "uuid",
  "scheduled_date": "2024-02-19",
  "start_time": "12:00",
  "end_time": "20:00",
  "position": "server",
  "break_duration": 30,
  "notes": "Lunch and dinner service"
}
```

### Assign Staff to Shift
```http
PUT /api/shifts/{id}/assign
```

**Body:**
```json
{
  "staff_member_id": "uuid",
  "notify_staff": true
}
```

### Bulk Create Shifts  
```http
POST /api/shifts/bulk
```

**Body:**
```json
{
  "shifts": [
    {
      "staff_member_id": "uuid",
      "scheduled_date": "2024-02-19", 
      "start_time": "12:00",
      "end_time": "20:00",
      "position": "server"
    },
    // ... more shifts
  ]
}
```

## 📋 Templates & Patterns

### Get Shift Templates
```http
GET /api/templates
GET /api/templates?day_of_week=1&position=server
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Monday Lunch Service",
      "day_of_week": 1,
      "start_time": "11:00",
      "end_time": "15:00",
      "position": "server",
      "min_staff": 2,
      "max_staff": 3,
      "is_active": true
    }
  ]
}
```

### Create Template
```http
POST /api/templates
```

**Body:**
```json
{
  "name": "Weekend Dinner Rush",
  "description": "High-volume dinner service template",
  "day_of_week": 6, // Saturday
  "start_time": "17:00",
  "end_time": "23:00", 
  "position": "server",
  "min_staff": 4,
  "max_staff": 6
}
```

### Apply Template to Schedule
```http
POST /api/schedules/{id}/apply-template
```

**Body:**
```json
{
  "template_id": "uuid",
  "date_range": {
    "start_date": "2024-02-19",
    "end_date": "2024-02-25"
  },
  "auto_assign_staff": true
}
```

## 📊 Reporting & Analytics

### Hours Summary
```http
GET /api/reports/hours?period=week&date=2024-02-19
GET /api/reports/hours?staff_id={uuid}&month=2024-02
```

**Response:**
```json
{
  "summary": {
    "total_scheduled_hours": 320,
    "total_actual_hours": 315,
    "overtime_hours": 15,
    "labor_cost": 4725.00
  },
  "by_staff": [
    {
      "staff_member_id": "uuid",
      "name": "Jessica Bombini",
      "scheduled_hours": 40,
      "actual_hours": 38.5,
      "overtime_hours": 0,
      "labor_cost": 693.00
    }
  ]
}
```

### Schedule Coverage Analysis
```http
GET /api/reports/coverage?date=2024-02-19&position=server
```

**Response:**
```json
{
  "coverage": {
    "date": "2024-02-19",
    "position": "server",
    "required_staff": 3,
    "scheduled_staff": 2,
    "coverage_percentage": 66.7,
    "gaps": [
      {
        "time_slot": "14:00-16:00",
        "shortage": 1,
        "severity": "medium"
      }
    ]
  }
}
```

## 🔔 Notifications

### Get Notifications
```http
GET /api/notifications?type=schedule&unread_only=true
```

### Mark as Read
```http
PUT /api/notifications/{id}/read
```

### Send Staff Notification
```http
POST /api/notifications/send
```

**Body:**
```json
{
  "recipient_ids": ["uuid1", "uuid2"],
  "type": "schedule_published",
  "title": "New Schedule Available",
  "message": "Your schedule for week of Feb 19 is now available",
  "action_url": "/schedule/2024-W08"
}
```

## 🔄 Real-time Updates

### WebSocket Connection
```javascript
const ws = new WebSocket('wss://ada.mindgen.app/ws/planning');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch(update.type) {
    case 'shift_assigned':
      // Handle shift assignment
      break;
    case 'schedule_published':  
      // Handle schedule publication
      break;
    case 'availability_updated':
      // Handle availability changes
      break;
  }
};
```

## 🔐 Authentication & Authorization

### Role-based Access
- **Admin**: Full access to all endpoints
- **Manager**: Schedule management, staff operations (read-only staff creation)
- **Staff**: Read-only access to own schedule and availability updates

### Request Headers
```http
Authorization: Bearer {jwt_token}
X-Restaurant-ID: {restaurant_uuid}
Content-Type: application/json
```

## 📱 PWA Offline Support

### Sync Queue
```http
POST /api/sync/queue
```

**Body:**
```json
{
  "operations": [
    {
      "type": "shift_update",
      "id": "local_uuid",
      "data": { /* shift data */ },
      "timestamp": "2024-02-19T15:30:00Z"
    }
  ]
}
```

---
**25+ endpoints designed for L'Osteria staff scheduling needs with PWA offline support**