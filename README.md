# AdaPlanning - Staff Scheduling System

**Digital replica of Jessica's paper calendar system for L'Osteria Deerlijk**

## 🎯 Business Case
- **Problem**: Jessica uses paper calendar for staff scheduling - inefficient, no digital backup, mobile access issues
- **Solution**: Tablet-optimized staff scheduling app with drag-and-drop interface
- **Revenue**: €100/month recurring (part of L'Osteria €550/month expansion)
- **Integration**: Seamless with Ada ecosystem (shared auth, consistent UI)

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 + TypeScript + Tailwind CSS
- **UI**: Shadcn/ui components with Ada design system
- **PWA**: Offline capabilities, app-like experience on tablet
- **i18n**: French/Dutch/English support
- **Deployment**: Vercel (ada-planning.vercel.app)

### Backend
- **API**: NestJS extending existing Ada backend
- **Database**: PostgreSQL via Supabase (shared with Ada ecosystem)
- **Auth**: Shared Ada authentication system
- **Integration**: 25+ REST API endpoints

## 📱 Key Features

### Core Functionality
- **Weekly View**: Primary interface mimicking Jessica's paper calendar
- **Drag & Drop**: Easy staff assignment and schedule adjustments
- **Staff Management**: Employee profiles, availability, roles
- **Shift Templates**: Recurring schedule patterns
- **Time Tracking**: Hours calculation and overtime alerts
- **Mobile Optimized**: Tablet-first design for restaurant use

### Integration Features  
- **Ada Ecosystem**: Shared user management and consistent branding
- **Multi-language**: French (primary), Dutch, English support
- **Offline Mode**: PWA capabilities for unreliable internet
- **Real-time Updates**: Live sync across devices
- **Audit Trail**: Change history and approval workflows

## 🗄️ Database Schema

### Core Tables
1. **shifts** - Individual work shifts with timing and roles
2. **staff_members** - Employee profiles and availability  
3. **shift_templates** - Recurring schedule patterns
4. **schedule_periods** - Weekly/monthly schedule management
5. **time_tracking** - Hours logging and overtime calculation

### Integration
- **RLS Policies**: Row-level security for multi-tenant support
- **Audit Logging**: Complete change tracking
- **Supabase**: `dxxtxdyrovawugvvrhah.supabase.co` (shared with Ada)

## 🚀 API Endpoints (25+)

### Schedule Management
- `GET/POST /api/schedules` - Schedule CRUD operations
- `GET/PUT /api/schedules/{id}/publish` - Schedule publishing
- `GET /api/schedules/current` - Active schedule retrieval

### Staff Operations  
- `GET/POST /api/staff` - Staff member management
- `GET/PUT /api/staff/{id}/availability` - Availability updates
- `GET /api/staff/{id}/hours` - Hours calculation

### Shift Management
- `GET/POST /api/shifts` - Shift operations
- `PUT /api/shifts/{id}/assign` - Staff assignment
- `DELETE /api/shifts/{id}` - Shift deletion

### Templates & Reporting
- `GET/POST /api/templates` - Shift template management
- `GET /api/reports/hours` - Hours reporting
- `GET /api/reports/coverage` - Schedule coverage analysis

## 💰 Business Integration

### Revenue Model
- **Monthly Subscription**: €100/month
- **Customer**: L'Osteria Deerlijk (validated need)
- **Expansion**: Template for other Ada ecosystem clients

### Ada Ecosystem Position
1. **Adamenu**: €50/month (menu management)
2. **Postagen**: €200/month (social media)
3. **AI Receptionist**: €100/month (call handling)
4. **AdaStock**: €100/month (inventory)
5. **AdaPlanning**: €100/month (staff scheduling) ← **THIS PROJECT**

**Total Customer Value**: €550/month (11x current revenue)

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Configure Supabase connection

# Development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

## 📋 Project Status
- **Specifications**: ✅ Complete
- **Database Schema**: ✅ Designed  
- **API Documentation**: ✅ Ready
- **Frontend Setup**: 🟡 In Progress
- **Backend Integration**: 🔲 Pending
- **Testing**: 🔲 Pending
- **Deployment**: 🔲 Pending

## 🎯 Next Steps
1. Initialize Next.js 14 project structure
2. Implement database schema in Supabase
3. Build core scheduling interface
4. Integrate with Ada authentication
5. Add PWA capabilities
6. Deploy to ada-planning.vercel.app

---
**Part of L'Osteria business expansion (€50→€550/month revenue growth)**