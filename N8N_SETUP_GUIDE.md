# 🚀 N8N Email Integration Setup Guide

## Overview

This guide will help you set up N8N for email sending in LocalLead Engine. N8N provides a flexible, visual workflow automation platform that gives you complete control over your email sending logic.

---

## Prerequisites

- N8N instance (cloud or self-hosted)
- Gmail account (or SMTP server)
- LocalLead Engine deployed on Vercel
- Supabase project configured

---

## STEP 1: Import N8N Workflow

### 1.1 Access Your N8N Instance

Go to your N8N dashboard: `https://your-n8n-instance.com`

### 1.2 Import Workflow

1. Click **"Workflows"** in the left sidebar
2. Click **"Add Workflow"** → **"Import from File"**
3. Upload the `n8n-workflow.json` file from your repository
4. Click **"Import"**

The workflow will be imported with all nodes configured.

---

## STEP 2: Configure Gmail Integration

### 2.1 Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to **"APIs & Services"** → **"Library"**
   - Search for "Gmail API"
   - Click **"Enable"**

### 2.2 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Configure consent screen if prompted
4. Application type: **"Web application"**
5. Add authorized redirect URI:
   ```
   https://your-n8n-instance.com/rest/oauth2-credential/callback
   ```
6. Click **"Create"**
7. Copy **Client ID** and **Client Secret**

### 2.3 Configure N8N Gmail Credential

1. In N8N workflow, click on **"Gmail"** node
2. Click **"Create New Credential"**
3. Select **"Gmail OAuth2"**
4. Enter:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click **"Connect my account"**
6. Authorize with your Gmail account
7. Click **"Save"**

---

## STEP 3: Activate Workflow

### 3.1 Enable Workflow

1. In the workflow editor, toggle **"Active"** in the top right
2. The workflow is now listening for webhook requests

### 3.2 Get Webhook URL

1. Click on the **"Webhook"** node
2. Copy the **"Production URL"**
3. It should look like:
   ```
   https://your-n8n-instance.com/webhook/locallead-send-email
   ```

---

## STEP 4: Configure LocalLead Engine

### 4.1 Update Environment Variables

Add these to your `.env.local` file:

```env
# N8N Configuration
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/locallead-send-email
VITE_USE_N8N=true
```

### 4.2 Deploy to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **"Settings"** → **"Environment Variables"**
3. Add:
   - **Name**: `VITE_N8N_WEBHOOK_URL`
   - **Value**: Your N8N webhook URL
   - **Name**: `VITE_USE_N8N`
   - **Value**: `true`
4. Click **"Save"**
5. Redeploy your application

---

## STEP 5: Test the Integration

### 5.1 Test with Curl

```bash
curl -X POST https://your-n8n-instance.com/webhook/locallead-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [{
      "id": "test-123",
      "name": "Test Business",
      "email": "your-test-email@gmail.com",
      "city": "Test City",
      "business_type": "Restaurant"
    }],
    "template": {
      "subject": "Hello {{business_name}}",
      "body": "Hi {{contact_name}},\n\nI noticed your {{business_name}} in {{city}}.\n\nBest,\n{{your_name}}"
    },
    "profile": {
      "full_name": "Your Name",
      "company_name": "Your Company",
      "email": "your@email.com"
    }
  }'
```

### 5.2 Test from LocalLead App

1. Log into your LocalLead Engine app
2. Go to **"Outreach"** page
3. Select a lead with a valid email
4. Choose a template
5. Click **"Send Email"**
6. Check the browser console for logs
7. Verify email was received

---

## STEP 6: Monitor and Debug

### 6.1 View N8N Execution Logs

1. In N8N, go to **"Executions"**
2. Click on any execution to see details
3. Review each node's input/output
4. Check for errors

### 6.2 Check Browser Console

Open DevTools (F12) and look for:
- `📧 Starting N8N email campaign...`
- `📤 Sending to N8N...`
- `✅ N8N response:`

### 6.3 Check Supabase Logs

```sql
SELECT * FROM outreach_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## Troubleshooting

### Issue: "N8N webhook URL not configured"

**Solution**: Make sure `VITE_N8N_WEBHOOK_URL` is set in your environment variables and the app is redeployed.

### Issue: "Gmail authentication failed"

**Solution**: 
1. Re-authorize Gmail in N8N credentials
2. Check OAuth consent screen is configured
3. Verify redirect URI is correct

### Issue: "CORS error"

**Solution**: N8N webhooks should automatically handle CORS. If issues persist, check N8N settings.

### Issue: Emails not sending

**Solution**:
1. Check N8N execution logs
2. Verify Gmail credential is connected
3. Check Gmail sending limits (500/day for free accounts)
4. Verify lead has valid email address

### Issue: Fallback to Supabase

**Solution**: This is normal if N8N is unavailable. Check:
1. N8N instance is running
2. Webhook URL is correct
3. Workflow is active

---

## Advanced Configuration

### Using SMTP Instead of Gmail

1. Add **"Send Email"** node to workflow
2. Configure SMTP credentials:
   - Host: `smtp.gmail.com` (or your SMTP server)
   - Port: `587`
   - Username: Your email
   - Password: App password
   - Secure: Yes
3. Connect node after "Filter Valid"

### Adding Email Tracking

1. Add **"HTTP Request"** node after "Gmail"
2. Configure to call your tracking API
3. Pass email ID and recipient

### Rate Limiting

1. Add **"Wait"** node between "Gmail" and "Mark Sent"
2. Set delay (e.g., 1 second between emails)

---

## Production Checklist

- [ ] N8N workflow imported and active
- [ ] Gmail OAuth configured and authorized
- [ ] Webhook URL added to Vercel environment variables
- [ ] `VITE_USE_N8N=true` set in Vercel
- [ ] Test email sent successfully
- [ ] Execution logs reviewed
- [ ] Supabase outreach_logs populated
- [ ] Error handling tested
- [ ] Fallback to Supabase verified

---

## Support

- **N8N Docs**: https://docs.n8n.io
- **Gmail API**: https://developers.google.com/gmail/api
- **LocalLead Issues**: https://github.com/itskiranbabu/LocalLead-Engine/issues

---

**Last Updated**: December 12, 2024  
**Version**: 1.0.0