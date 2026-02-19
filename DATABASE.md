# AdaPlanning Database Schema

**Production-ready PostgreSQL schema for staff scheduling system**

## 🗄️ Core Tables

### 1. staff_members
```sql
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Basic Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    
    -- Employment
    employee_id VARCHAR(50),
    hire_date DATE,
    position VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    status employee_status DEFAULT 'active',
    
    -- Scheduling
    default_hours_per_week INTEGER DEFAULT 0,
    max_hours_per_week INTEGER DEFAULT 40,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enum for employee status
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
```

### 2. shifts
```sql
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    staff_member_id UUID REFERENCES staff_members(id),
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- minutes
    
    -- Classification
    position VARCHAR(100),
    shift_type shift_type_enum DEFAULT 'regular',
    is_published BOOLEAN DEFAULT FALSE,
    
    -- Status
    status shift_status DEFAULT 'scheduled',
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enum definitions
CREATE TYPE shift_type_enum AS ENUM ('regular', 'overtime', 'double_time', 'holiday');
CREATE TYPE shift_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
```

### 3. staff_availability
```sql  
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID NOT NULL REFERENCES staff_members(id),
    
    -- Availability Window
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Type & Status
    availability_type availability_type_enum DEFAULT 'regular',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Date Range (for temporary availability)
    effective_from DATE,
    effective_to DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(staff_member_id, day_of_week, start_time, end_time, effective_from, effective_to)
);

CREATE TYPE availability_type_enum AS ENUM ('regular', 'preferred', 'unavailable', 'temporary');
```

### 4. shift_templates
```sql
CREATE TABLE shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Template Info
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Pattern
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    position VARCHAR(100),
    
    -- Configuration
    min_staff INTEGER DEFAULT 1,
    max_staff INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

### 5. schedule_periods
```sql
CREATE TABLE schedule_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Period Definition
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    name VARCHAR(200), -- e.g., "Week of Jan 15, 2024"
    
    -- Status
    status schedule_status DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(restaurant_id, start_date, end_date),
    CHECK (end_date >= start_date)
);

CREATE TYPE schedule_status AS ENUM ('draft', 'published', 'archived');
```

## 🔐 Row Level Security (RLS)

### Enable RLS on all tables
```sql
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_periods ENABLE ROW LEVEL SECURITY;
```

### RLS Policies
```sql
-- Staff Members: Users can only see staff from their restaurant
CREATE POLICY "staff_members_restaurant_access" ON staff_members
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants 
            WHERE id IN (
                SELECT restaurant_id FROM restaurant_users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Shifts: Restaurant-based access
CREATE POLICY "shifts_restaurant_access" ON shifts
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants 
            WHERE id IN (
                SELECT restaurant_id FROM restaurant_users 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Similar policies for other tables...
```

## 📊 Indexes for Performance

```sql
-- Shifts query optimization
CREATE INDEX idx_shifts_restaurant_date ON shifts (restaurant_id, scheduled_date);
CREATE INDEX idx_shifts_staff_date ON shifts (staff_member_id, scheduled_date);
CREATE INDEX idx_shifts_status ON shifts (status);

-- Staff availability lookups
CREATE INDEX idx_staff_availability_member_day ON staff_availability (staff_member_id, day_of_week);
CREATE INDEX idx_staff_availability_active ON staff_availability (is_active) WHERE is_active = true;

-- Schedule periods
CREATE INDEX idx_schedule_periods_restaurant_dates ON schedule_periods (restaurant_id, start_date, end_date);
```

## 🔄 Audit Trail

```sql
-- Audit log table for tracking changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_shifts AFTER INSERT OR UPDATE OR DELETE ON shifts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_staff_members AFTER INSERT OR UPDATE OR DELETE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 🚀 Deployment

### Supabase Migration
```sql
-- Run in Supabase SQL Editor
-- 1. Create types first
-- 2. Create tables with references
-- 3. Enable RLS and create policies
-- 4. Create indexes
-- 5. Set up audit triggers

-- Connection: dxxtxdyrovawugvvrhah.supabase.co
-- Project: Ada Ecosystem (shared with Adamenu)
```

### Integration with Ada Backend
- **Shared Authentication**: Uses existing Ada user system
- **Multi-tenant**: Restaurant-based data isolation
- **API Endpoints**: Extend existing NestJS Ada backend
- **Consistent**: Same patterns as Adamenu database structure

---
**Production-ready schema designed for L'Osteria staff scheduling needs**