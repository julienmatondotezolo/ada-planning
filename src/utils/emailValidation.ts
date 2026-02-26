// Email Validation Utility - Prevents Supabase Bounce Rate Issues
// Only allows valid test emails during development

export const VALID_TEST_EMAILS = [
  'emjisolutions+test1@gmail.com',
  'emjisolutions+test2@gmail.com',
  'emjisolutions+dev@gmail.com',
  'emjisolutions+staging@gmail.com',
  'emjisolutions+demo@gmail.com'
];

export const INVALID_PATTERNS = [
  '@yopmail.com',
  '@tempmail.',
  '@guerrillamail.',
  'test@test.',
  'fake@',
  'random@',
  'invalid@'
];

export interface ValidationResult {
  valid: boolean;
  reason: string;
  suggestion?: string;
}

export function validateTestEmail(email: string): ValidationResult {
  // In development, enforce strict email validation
  if (process.env.NODE_ENV === 'development') {
    // Check if email is in approved test list
    if (VALID_TEST_EMAILS.includes(email)) {
      return { 
        valid: true, 
        reason: 'Approved test email' 
      };
    }
    
    // Check for known bounce patterns
    for (const pattern of INVALID_PATTERNS) {
      if (email.includes(pattern)) {
        return { 
          valid: false, 
          reason: `Email pattern '${pattern}' causes bounces`,
          suggestion: `Use: ${VALID_TEST_EMAILS[0]}`
        };
      }
    }
    
    // Warn about non-test emails in development
    if (!email.includes('emjisolutions')) {
      return {
        valid: false,
        reason: 'Use approved test emails in development to prevent bounce rates',
        suggestion: `Use: ${VALID_TEST_EMAILS[0]}`
      };
    }
  }
  
  // Basic email validation for all environments
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      valid: false, 
      reason: 'Invalid email format' 
    };
  }
  
  return { 
    valid: true, 
    reason: 'Valid email format' 
  };
}

export function getRandomTestEmail(): string {
  const randomIndex = Math.floor(Math.random() * VALID_TEST_EMAILS.length);
  return VALID_TEST_EMAILS[randomIndex];
}

export function suggestTestEmail(invalidEmail: string): string {
  // Extract username part if possible
  const [username] = invalidEmail.split('@');
  
  // If it's already an emjisolutions email, just fix the format
  if (invalidEmail.includes('emjisolutions')) {
    return VALID_TEST_EMAILS[0];
  }
  
  // Suggest based on username
  if (username.includes('test') || username.includes('dev')) {
    return 'emjisolutions+dev@gmail.com';
  }
  
  if (username.includes('admin') || username.includes('manager')) {
    return 'emjisolutions+test1@gmail.com';
  }
  
  return VALID_TEST_EMAILS[0];
}