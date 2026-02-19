# AdaPlanning Frontend

Tablet-optimized restaurant staff scheduling application for the Ada ecosystem.

## 🍝 About

AdaPlanning is designed specifically for L'Osteria Deerlijk to replace their paper-based staff scheduling system with a modern, touch-friendly digital solution. The application replicates the familiar monthly calendar layout while adding powerful features like drag-and-drop scheduling, staff management, and real-time updates.

## 🎯 Features

- **Monthly Calendar View**: Exact replica of the paper calendar layout Jessica uses
- **Staff Management**: Add, edit, and manage restaurant staff with color-coded assignments
- **Touch Optimized**: Designed for tablet use with large touch targets and gestures
- **Multilingual**: French primary interface with Dutch and English support
- **PWA Support**: Install on tablets for offline functionality
- **Real-time Updates**: Live synchronization across devices
- **Export Options**: PDF schedules for printing and sharing

## 🏗️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **Components**: Radix UI primitives
- **State**: Zustand + React Query
- **Database**: Supabase integration
- **PWA**: Next.js PWA plugin
- **Internationalization**: next-intl

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Ada Systems Supabase database

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ada-planning-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Development

```bash
# Development server (port 3001)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm run start
```

## 🏛️ Architecture

### Directory Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard views
│   ├── auth/             # Authentication pages
│   └── settings/         # Settings pages
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   ├── calendar/        # Calendar-specific components
│   ├── staff/           # Staff management components
│   └── forms/           # Form components
├── lib/                 # Utility functions
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

### Key Components

- **CalendarView**: Main monthly calendar display
- **CalendarCell**: Individual day cells with staff assignments
- **Header**: Top navigation with user actions
- **Sidebar**: Left navigation with staff quick access
- **StaffManager**: Staff CRUD operations
- **AssignmentModal**: Create/edit staff assignments

## 🎨 Design System

### Colors

The application uses a consistent color palette:

- **Primary**: Blue (#3b82f6) - Main actions and navigation
- **Staff Colors**: 
  - José: Red (#ef4444)
  - Angélys: Purple (#8b5cf6)
  - Mélia: Green (#10b981)
  - Lino: Amber (#f59e0b)
  - Lucas: Blue (#3b82f6)

### Typography

- **Font**: Inter (system fallback)
- **Sizes**: Optimized for tablet viewing distances

### Touch Targets

- Minimum 44px for interactive elements
- Large buttons and touch areas
- Smooth animations and feedback

## 📱 PWA Features

### Offline Support

- Calendar data cached locally
- Basic functionality without internet
- Sync when connection restored

### Installation

- Add to home screen on tablets
- Full-screen experience
- OS-level integration

## 🌐 Internationalization

### Supported Languages

- **French (fr)**: Primary language for L'Osteria
- **Dutch (nl)**: Secondary language
- **English (en)**: Fallback language

### Usage

```tsx
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('calendar');
  return <h1>{t('title')}</h1>;
}
```

## 🔌 API Integration

### Supabase Connection

```typescript
// Example API call
const { data: staff } = await supabase
  .from('planning_staff')
  .select('*')
  .eq('organization_id', orgId);
```

### Authentication

- Supabase Auth integration
- Row Level Security (RLS)
- Organization-based access control

## 📊 Database Schema

The frontend connects to these main tables:

- `planning_organizations`: Restaurant details
- `planning_staff`: Staff member information  
- `planning_schedules`: Monthly schedule containers
- `planning_assignments`: Daily staff assignments
- `planning_audit_log`: Change tracking

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel --prod

# Custom domain: ada-planning.vercel.app
```

### Environment Variables

```bash
# Production environment
NEXT_PUBLIC_API_URL=https://api.ada-systems.be
NEXTAUTH_URL=https://ada-planning.vercel.app
NEXT_PUBLIC_APP_ENV=production
```

## 🧪 Testing

### Test Strategy

- Unit tests for utilities and hooks
- Component testing with React Testing Library
- E2E testing for critical user flows
- Manual testing on tablet devices

### Running Tests

```bash
# Run unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🐛 Troubleshooting

### Common Issues

**Calendar not loading**:
- Check Supabase connection
- Verify RLS policies
- Check browser console for errors

**Touch not responsive**:
- Ensure proper touch-action CSS
- Check for JavaScript event conflicts
- Test on actual tablet device

**PWA not installing**:
- Verify manifest.json is valid
- Check HTTPS requirement
- Ensure service worker registration

## 📈 Performance

### Optimization

- Image optimization with Next.js
- Code splitting by route
- PWA caching strategies
- Minimal bundle size

### Monitoring

- Core Web Vitals tracking
- Error boundary implementation
- Performance metrics logging

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `develop`
2. Implement changes with tests
3. Submit pull request
4. Code review and approval
5. Merge to `develop`
6. Deploy to production

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Conventional commit messages
- Component documentation

## 📞 Support

### L'Osteria Contact

- **Restaurant**: L'Osteria Deerlijk
- **Address**: Kortrijkstraat 123, 8540 Deerlijk
- **Phone**: +32 56 25 63 83
- **Primary User**: Jessica Bombini

### Technical Support

- **Developer**: Ada Systems
- **Documentation**: Internal Ada docs
- **Issues**: GitHub repository

## 📄 License

Private software for Ada Systems ecosystem. All rights reserved.

---

**Built with ❤️ for L'Osteria Deerlijk**