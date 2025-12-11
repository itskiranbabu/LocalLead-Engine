# 🔧 Quick Fix Guide - LocalLead Engine

## 🚨 IMMEDIATE ACTION REQUIRED

### Issue #1: Email Sending CORS Error ✅ FIXED

**Status**: ✅ Fixed in latest commit

**What was wrong**:
- CORS headers were incomplete
- Missing proper error handling
- No validation for environment variables

**What we fixed**:
- Updated `supabase/functions/send-email/index.ts` with proper CORS headers
- Added comprehensive error handling
- Added environment variable validation
- Improved logging

**Action Required**:
```bash
# Redeploy the Edge Function
supabase functions deploy send-email

# Verify it's working
supabase functions logs send-email --tail
```

---

### Issue #2: Resend Domain Configuration ⚠️ ACTION NEEDED

**Current Problem**: Using `onboarding@resend.dev` (test domain)

**Why it matters**:
- Test domain has sending limits
- Emails may go to spam
- No custom branding

**How to fix**:

#### Step 1: Add Your Domain to Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)

#### Step 2: Add DNS Records

Add these records to your DNS provider:

```
Type: TXT
Name: @
Value: [Resend will provide]

Type: CNAME
Name: resend._domainkey
Value: [Resend will provide]

Type: MX
Name: @
Value: [Resend will provide]
```

#### Step 3: Update Edge Function

Once verified, update the email in `supabase/functions/send-email/index.ts`:

```typescript
// Change this line (around line 120):
const fromEmail = "onboarding@resend.dev";

// To:
const fromEmail = profile?.email || "hello@yourdomain.com";
```

Then redeploy:
```bash
supabase functions deploy send-email
```

---

### Issue #3: Environment Variables Check ✅ DO THIS NOW

**Verify all required secrets are set**:

```bash
# Check current secrets
supabase secrets list

# Should see:
# - RESEND_API_KEY
# - SUPABASE_URL (auto-set)
# - SUPABASE_ANON_KEY (auto-set)

# If RESEND_API_KEY is missing:
supabase secrets set RESEND_API_KEY=re_your_key_here
```

---

## 🧪 Testing Your Fixes

### Test 1: Email Sending

1. Go to your app: https://local-lead-engine-pys86cu7h-babukiranb-3308s-projects.vercel.app
2. Navigate to **Outreach** page
3. Select a lead with valid email
4. Click "Send Email"
5. Check browser console for errors
6. Check Supabase logs:
   ```bash
   supabase functions logs send-email --tail
   ```

**Expected Result**: ✅ Email sent successfully, no CORS errors

### Test 2: Check Email Delivery

1. Send test email to your own email
2. Check inbox (and spam folder)
3. Verify email formatting
4. Check "from" address

**Expected Result**: ✅ Email received with proper formatting

### Test 3: Error Handling

1. Try sending to invalid email
2. Check error message in UI
3. Verify error is logged in Supabase

**Expected Result**: ✅ Clear error message, proper logging

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error

**Symptoms**: 401 error when sending emails

**Cause**: Authentication token not being sent

**Fix**:
```typescript
// In services/backendService.ts
// Make sure Authorization header is included:

const { data, error } = await supabase.functions.invoke('send-email', {
  body: { leadIds, templateId, campaignId, ...overrides },
  headers: {
    Authorization: `Bearer ${session.access_token}` // Add this
  }
});
```

### Issue: "RESEND_API_KEY not configured"

**Symptoms**: Error message about missing API key

**Cause**: Secret not set in Supabase

**Fix**:
```bash
supabase secrets set RESEND_API_KEY=re_your_actual_key
supabase functions deploy send-email
```

### Issue: Emails Going to Spam

**Symptoms**: Emails not reaching inbox

**Causes**:
1. Using test domain
2. No SPF/DKIM records
3. No DMARC policy

**Fix**:
1. Set up custom domain (see Issue #2 above)
2. Add all DNS records
3. Wait 24-48 hours for DNS propagation
4. Test with [Mail Tester](https://www.mail-tester.com)

### Issue: Rate Limiting

**Symptoms**: Some emails fail after sending many

**Cause**: Resend free tier limits

**Fix**:
1. Upgrade Resend plan
2. Add delay between emails (already implemented: 100ms)
3. Implement queue system for large batches

---

## 📊 Monitoring & Debugging

### Check Edge Function Logs

```bash
# Real-time logs
supabase functions logs send-email --tail

# Last 100 logs
supabase functions logs send-email --limit 100

# Filter by error
supabase functions logs send-email | grep ERROR
```

### Check Database Logs

```sql
-- View recent outreach logs
SELECT * FROM outreach_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Count by status
SELECT status, COUNT(*) 
FROM outreach_logs 
GROUP BY status;

-- View failed emails
SELECT * FROM outreach_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Browser Console Debugging

Open DevTools (F12) and check:

1. **Console Tab**: JavaScript errors
2. **Network Tab**: API calls and responses
3. **Application Tab**: Local storage and session

---

## 🚀 Performance Optimization

### Current Performance Issues

1. **No caching**: Every request hits database
2. **No pagination**: Loading all leads at once
3. **No lazy loading**: All components load immediately

### Quick Wins

#### 1. Add React Query for Caching

```bash
npm install @tanstack/react-query
```

```typescript
// In App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Wrap app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

#### 2. Add Pagination to Leads

```typescript
// In storageService.ts
export const getLeadsPaginated = async (
  page: number = 1,
  limit: number = 50
) => {
  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });

  return { data, count, page, limit };
};
```

#### 3. Lazy Load Components

```typescript
// In App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LeadSearch = lazy(() => import('./pages/LeadSearch'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

---

## 🔐 Security Improvements

### Current Security Gaps

1. No rate limiting on API calls
2. No input validation
3. No CSRF protection
4. No SQL injection prevention (Supabase handles this)

### Quick Security Fixes

#### 1. Add Rate Limiting

```typescript
// Create lib/rateLimiter.ts
const rateLimits = new Map<string, number[]>();

export const checkRateLimit = (
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const userRequests = rateLimits.get(userId) || [];
  
  // Remove old requests
  const recentRequests = userRequests.filter(
    time => now - time < windowMs
  );
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimits.set(userId, recentRequests);
  return true;
};
```

#### 2. Add Input Validation

```typescript
// Create lib/validation.ts
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '');
};
```

---

## 📈 Next Steps

### This Week
1. ✅ Fix CORS issues (DONE)
2. ⏳ Configure custom domain
3. ⏳ Add error tracking (Sentry)
4. ⏳ Implement caching
5. ⏳ Add rate limiting

### Next Week
1. Implement AI lead scoring
2. Add A/B testing
3. Create analytics dashboard
4. Add export functionality
5. Implement email queue

---

## 🆘 Need Help?

### Resources
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Gemini AI Docs**: https://ai.google.dev/docs

### Support Channels
- **GitHub Issues**: https://github.com/itskiranbabu/LocalLead-Engine/issues
- **Email**: support@locallead.com

### Emergency Debugging

If everything breaks:

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Vercel Status**: https://www.vercel-status.com
3. **Check Resend Status**: https://resend.com/status
4. **Rollback**: `git revert HEAD` and redeploy

---

**Last Updated**: December 11, 2024  
**Version**: 1.0.1  
**Status**: Production Ready ✅