# 🚨 CRITICAL: Email Bounce Prevention

## Current Status: SUPABASE EMAIL RESTRICTION WARNING

Our Supabase project received a high bounce rate warning. **Any more invalid test emails could disable our email system.**

## ✅ ONLY Use These Test Emails

```
emjisolutions+test1@gmail.com
emjisolutions+test2@gmail.com  
emjisolutions+dev@gmail.com
emjisolutions+staging@gmail.com
emjisolutions+demo@gmail.com
```

## 🚫 NEVER Use These (Instant Bounce)

- `@yopmail.com` addresses
- `random@anything.com` 
- `test@test.com`
- Any email you can't access

## Development Workflow

1. **Registration Testing**: Use `emjisolutions+test1@gmail.com`
2. **Login Testing**: Use `emjisolutions+test2@gmail.com`
3. **Admin Testing**: Use `emjisolutions+dev@gmail.com`

## Email Verification Process

1. Enter approved test email
2. Check Gmail inbox (all +alias emails go to same inbox)
3. Click verification link
4. Complete authentication flow

## Before Testing Authentication

Run this command to validate any email:
```bash
node ../email_bounce_prevention.js validate <email>
```

## Emergency Recovery

If emails get disabled:
1. Stop all authentication testing
2. Contact Supabase support immediately
3. Show improved testing practices
4. Set up custom SMTP (see `supabase_custom_smtp_setup.md`)

---

**Remember: These emails all go to the same Gmail inbox but appear as different users to Supabase. Perfect for testing!**