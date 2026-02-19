import { StaffMember, Shift } from '@/types/planning';

// Demo staff members based on Jessica's paper calendar
export const demoStaff: StaffMember[] = [
  {
    id: 'staff-1',
    first_name: 'Jessica',
    last_name: 'Bombini',
    email: 'jessica@losteria.be',
    position: 'manager',
    hourly_rate: 18.50,
    hire_date: '2023-01-15',
    status: 'active',
    default_hours_per_week: 40,
    availability: [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', availability_type: 'regular' },
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', availability_type: 'regular' },
      { day_of_week: 3, start_time: '09:00', end_time: '17:00', availability_type: 'regular' },
      { day_of_week: 4, start_time: '09:00', end_time: '17:00', availability_type: 'regular' },
      { day_of_week: 5, start_time: '09:00', end_time: '17:00', availability_type: 'regular' },
    ]
  },
  {
    id: 'staff-2',
    first_name: 'Anne',
    last_name: 'Martin',
    email: 'anne@losteria.be',
    position: 'server',
    hourly_rate: 15.00,
    hire_date: '2023-03-01',
    status: 'active',
    default_hours_per_week: 32,
    availability: [
      { day_of_week: 2, start_time: '12:00', end_time: '20:00', availability_type: 'regular' },
      { day_of_week: 3, start_time: '12:00', end_time: '20:00', availability_type: 'regular' },
      { day_of_week: 4, start_time: '12:00', end_time: '20:00', availability_type: 'regular' },
      { day_of_week: 5, start_time: '12:00', end_time: '22:00', availability_type: 'regular' },
      { day_of_week: 6, start_time: '12:00', end_time: '22:00', availability_type: 'regular' },
    ]
  },
  {
    id: 'staff-3',
    first_name: 'Lino',
    last_name: 'Rossi',
    email: 'lino@losteria.be',
    position: 'kitchen',
    hourly_rate: 16.50,
    hire_date: '2023-02-15',
    status: 'active',
    default_hours_per_week: 35,
    availability: [
      { day_of_week: 1, start_time: '15:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 2, start_time: '15:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 3, start_time: '15:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 5, start_time: '15:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 6, start_time: '15:00', end_time: '23:00', availability_type: 'regular' },
    ]
  },
  {
    id: 'staff-4',
    first_name: 'Sophie',
    last_name: 'Dubois',
    email: 'sophie@losteria.be',
    position: 'server',
    hourly_rate: 14.50,
    hire_date: '2023-05-10',
    status: 'active',
    default_hours_per_week: 30,
    availability: [
      { day_of_week: 1, start_time: '18:00', end_time: '22:00', availability_type: 'regular' },
      { day_of_week: 3, start_time: '18:00', end_time: '22:00', availability_type: 'regular' },
      { day_of_week: 6, start_time: '12:00', end_time: '22:00', availability_type: 'regular' },
      { day_of_week: 7, start_time: '12:00', end_time: '20:00', availability_type: 'regular' },
    ]
  },
  {
    id: 'staff-5',
    first_name: 'Marco',
    last_name: 'Pellegrini',
    email: 'marco@losteria.be',
    position: 'bar',
    hourly_rate: 15.50,
    hire_date: '2023-04-01',
    status: 'active',
    default_hours_per_week: 28,
    availability: [
      { day_of_week: 4, start_time: '19:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 5, start_time: '19:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 6, start_time: '17:00', end_time: '23:00', availability_type: 'regular' },
      { day_of_week: 7, start_time: '17:00', end_time: '21:00', availability_type: 'regular' },
    ]
  }
];

// Generate demo shifts for February 2026
export function generateDemoShifts(year: number = 2026, month: number = 1): Shift[] { // month 1 = February (0-indexed)
  const shifts: Shift[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Common shift patterns for L'Osteria
  const shiftPatterns = [
    { start: '09:00', end: '15:00', position: 'manager', break: 30 },
    { start: '12:00', end: '20:00', position: 'server', break: 30 },
    { start: '15:00', end: '23:00', position: 'kitchen', break: 30 },
    { start: '18:00', end: '22:00', position: 'server', break: 0 },
    { start: '17:00', end: '23:00', position: 'bar', break: 30 },
    { start: '10:00', end: '16:00', position: 'manager', break: 30 },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateString = date.toISOString().split('T')[0];
    
    // Skip some days randomly to make it look realistic
    if (Math.random() > 0.85) continue;
    
    // Add 1-4 shifts per day
    const numShifts = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numShifts; i++) {
      const pattern = shiftPatterns[Math.floor(Math.random() * shiftPatterns.length)];
      const staff = demoStaff[Math.floor(Math.random() * demoStaff.length)];
      
      // Check if staff is available on this day
      const staffAvailability = staff.availability.find(a => a.day_of_week === (dayOfWeek || 7));
      if (!staffAvailability) continue;
      
      const startTime = new Date(`1970-01-01T${pattern.start}:00`);
      const endTime = new Date(`1970-01-01T${pattern.end}:00`);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const workingHours = durationHours - (pattern.break / 60);
      
      const shift: Shift = {
        id: `shift-${year}-${month}-${day}-${i}`,
        staff_member_id: staff.id,
        staff: {  // Add staff data for drag & drop display
          id: staff.id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          position: staff.position
        },
        scheduled_date: dateString,
        start_time: pattern.start,
        end_time: pattern.end,
        break_duration: pattern.break,
        position: pattern.position,
        status: 'scheduled',
        calculated_hours: workingHours,
        is_overtime: workingHours > 8,
        notes: ''
      };
      
      shifts.push(shift);
    }
  }
  
  return shifts.sort((a, b) => {
    const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });
}

// Generate shifts for specific staff members (useful when API returns real staff)
export function generateShiftsForStaff(staff: StaffMember[], year: number = 2026, month: number = 1): Shift[] {
  const shifts: Shift[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Common shift patterns for L'Osteria
  const shiftPatterns = [
    { start: '09:00', end: '15:00', position: 'manager', break: 30 },
    { start: '12:00', end: '20:00', position: 'server', break: 30 },
    { start: '15:00', end: '23:00', position: 'kitchen', break: 30 },
    { start: '18:00', end: '22:00', position: 'server', break: 0 },
    { start: '17:00', end: '23:00', position: 'bar', break: 30 },
    { start: '10:00', end: '16:00', position: 'manager', break: 30 },
  ];

  console.log(`🎯 Generating shifts for ${staff.length} staff members in ${year}-${month + 1}`);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateString = date.toISOString().split('T')[0];
    
    // Skip some days randomly to make it look realistic
    if (Math.random() > 0.85) continue;
    
    // Add 1-3 shifts per day
    const numShifts = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numShifts && i < staff.length; i++) {
      const pattern = shiftPatterns[Math.floor(Math.random() * shiftPatterns.length)];
      const staffMember = staff[i % staff.length]; // Rotate through available staff
      
      const startTime = new Date(`1970-01-01T${pattern.start}:00`);
      const endTime = new Date(`1970-01-01T${pattern.end}:00`);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const workingHours = durationHours - (pattern.break / 60);
      
      const shift: Shift = {
        id: `shift-${staffMember.id}-${dateString}-${i}`,
        staff_member_id: staffMember.id,
        staff: {  // Add staff data for drag & drop display
          id: staffMember.id,
          first_name: staffMember.first_name,
          last_name: staffMember.last_name,
          position: staffMember.position
        },
        scheduled_date: dateString,
        start_time: pattern.start,
        end_time: pattern.end,
        break_duration: pattern.break,
        position: pattern.position,
        status: 'scheduled',
        calculated_hours: workingHours,
        is_overtime: workingHours > 8,
        notes: ''
      };
      
      shifts.push(shift);
      console.log(`📅 Created shift: ${staffMember.first_name} on ${dateString} (${pattern.start}-${pattern.end})`);
    }
  }
  
  return shifts.sort((a, b) => {
    const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });
}

// Mock API responses for demo mode
export const demoAPI = {
  getStaff: async () => ({ data: demoStaff }),
  getShifts: async (params?: any) => ({ 
    data: generateDemoShifts(2026, 1) // February 2026
  }),
};