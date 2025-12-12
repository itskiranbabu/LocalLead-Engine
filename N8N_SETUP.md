# N8N Email Workflow Setup Guide

## 📧 Quick Setup (5 Minutes)

### Step 1: Import Workflow to N8N

1. **Open your N8N instance**
2. Click **"Add workflow"** → **"Import from File"**
3. **Copy and paste this JSON:**

```json
{
  "name": "LocalLead Email Sender - Simple",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "locallead-send-email",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "fromEmail": "={{ $json.body.fromEmail }}",
        "toEmail": "={{ $json.body.toEmail }}",
        "subject": "={{ $json.body.subject }}",
        "emailType": "html",
        "message": "={{ $json.body.message }}",
        "options": {}
      },
      "id": "send-email",
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2.1,
      "position": [460, 300],
      "credentials": {
        "smtp": {
          "id": "REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID",
          "name": "SMTP Account"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message\": \"Email sent successfully\", \"to\": $json.body.toEmail, \"timestamp\": $now } }}"
      },
      "id": "success",
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Send Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send Email": {
      "main": [
        [
          {
            "node": "Success Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 0,
  "updatedAt": "2025-12-12T15:00:00.000Z",
  "versionId": "1"
}
```

### Step 2: Configure SMTP Credentials in N8N

1. **Click on the "Send Email" node**
2. **Click "Create New Credential"** under SMTP
3. **Choose your email provider:**

#### For Gmail:
- **Host:** `smtp.gmail.com`
- **Port:** `587`
- **Security:** `TLS`
- **User:** `your-email@gmail.com`
- **Password:** `[App Password]` ← **NOT your regular password!**

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if not already)
3. Search for "App Passwords"
4. Generate password for "Mail"
5. Copy the 16-character password
6. Use this in N8N

#### For Outlook/Office365:
- **Host:** `smtp.office365.com`
- **Port:** `587`
- **Security:** `TLS`
- **User:** `your-email@outlook.com`
- **Password:** Your Outlook password

#### For Custom SMTP:
- Enter your SMTP server details
- Contact your email provider for SMTP settings

### Step 3: Activate Workflow

1. **Click the "Active" toggle** in the top right (should turn green)
2. **Copy the Production Webhook URL** - it will look like:
   ```
   https://your-n8n-instance.com/webhook/locallead-send-email
   ```
3. **Save this URL** - you'll need it in the next step

### Step 4: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these variables:**

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_N8N_WEBHOOK_URL` | `https://your-n8n.com/webhook/locallead-send-email` | Your N8N webhook URL from Step 3 |
| `VITE_USE_N8N` | `true` | Enable N8N email sending |

3. **Click "Save"**
4. **Redeploy your app** (Vercel will auto-deploy on next commit, or manually trigger)

### Step 5: Test the Integration

1. **In N8N:** Click "Execute Workflow" and use this test data:
```json
{
  "fromEmail": "your-email@example.com",
  "toEmail": "test@example.com",
  "subject": "Test Email from LocalLead",
  "message": "<h1>Hello!</h1><p>This is a test email from your LocalLead Engine.</p>"
}
```

2. **Check if email was sent successfully**

3. **In your LocalLead app:**
   - Go to **Outreach** page
   - Select a lead with an email
   - Write a message
   - Click **"Send Email"**
   - Check console for logs

## 🔧 Troubleshooting

### Error: "N8N webhook URL not configured"
- Make sure `VITE_N8N_WEBHOOK_URL` is set in Vercel
- Redeploy your app after adding the variable

### Error: "Failed to send email"
- Check N8N workflow execution logs
- Verify SMTP credentials are correct
- Test SMTP connection in N8N

### Error: "CORS policy"
- N8N webhooks should allow CORS by default
- If issues persist, add CORS headers in N8N response node

### Emails not sending
1. Check N8N execution history for errors
2. Verify SMTP credentials
3. Check spam folder
4. Try sending a test email directly from N8N

## 📊 Monitoring

### View Email Logs in N8N:
1. Go to **Executions** tab in N8N
2. See all email send attempts
3. Click on any execution to see details

### View Logs in LocalLead:
- Open browser console (F12)
- Look for logs starting with `📧`, `✅`, or `❌`

## 🚀 Advanced: Bulk Campaign Workflow

For bulk campaigns, you can create a more advanced N8N workflow that:
- Processes multiple leads
- Adds delays between emails
- Tracks success/failure
- Logs to database

Contact support or check N8N documentation for advanced workflows.

## 📝 Notes

- The app will automatically use N8N if `VITE_USE_N8N=true`
- If N8N fails, it will fallback to Supabase Edge Functions
- Single emails use the simple N8N workflow
- Bulk campaigns can use either simple or advanced workflows

## 🆘 Support

If you encounter issues:
1. Check N8N execution logs
2. Check browser console
3. Verify environment variables
4. Test SMTP connection separately

---

**Setup Complete!** 🎉

Your LocalLead Engine is now configured to send emails via N8N!
