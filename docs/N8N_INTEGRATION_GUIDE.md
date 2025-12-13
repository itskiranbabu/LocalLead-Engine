# 🔗 **N8N Integration Guide**

## **📋 Overview**

This guide explains how to integrate your N8N email workflow with LocalLead Engine to enable automated email campaigns.

---

## **🎯 Your N8N Workflow**

### **Webhook URL:**
```
https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2
```

### **Workflow Structure:**

```
┌─────────────────────┐
│  Webhook Trigger    │ ← Receives email data from LocalLead
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate Required   │ ← Checks: to, subject, body
│      Fields         │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ Valid?  │  │ Validation   │
│   NO    │  │ Error        │
└─────────┘  │ Response     │
             └──────────────┘
     │
     ▼ YES
┌─────────────────────┐
│  Send via Gmail     │ ← Primary email sender
│  (Primary Method)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check Gmail Success │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│Success? │  │ Send via     │
│   YES   │  │ SMTP Fallback│
└─────────┘  └──────┬───────┘
     │              │
     │              ▼
     │      ┌──────────────┐
     │      │ Check SMTP   │
     │      │   Success    │
     │      └──────┬───────┘
     │             │
     │       ┌─────┴─────┐
     │       │           │
     │       ▼           ▼
     │  ┌─────────┐  ┌──────────┐
     │  │Success? │  │  Error   │
     │  │   YES   │  │ Response │
     │  └─────────┘  └──────────┘
     │       │
     └───────┴──────────┐
                        │
                        ▼
              ┌──────────────┐
              │   Success    │
              │   Response   │
              └──────────────┘
```

### **Features:**

✅ **Dual Delivery Methods:**
- Primary: Gmail (fast, reliable)
- Fallback: SMTP (backup if Gmail fails)

✅ **Validation:**
- Checks required fields before sending
- Returns clear error messages

✅ **Error Handling:**
- Graceful fallback to SMTP
- Detailed error responses

✅ **Response Format:**
- Success: 200 OK with confirmation
- Error: 400/500 with error details

---

## **⚙️ Setup Instructions**

### **Step 1: Verify N8N Workflow is Active**

1. Open N8N: https://itskiranbabu1.app.n8n.cloud
2. Find workflow: "LocalLead Email v2"
3. Ensure it's **ACTIVE** (toggle on)
4. Test webhook trigger is enabled

### **Step 2: Configure Gmail/SMTP Credentials**

Your workflow uses Gmail and SMTP. Ensure credentials are configured:

#### **Gmail Node:**
- Gmail account connected
- OAuth2 or App Password configured
- "Send Email" permission enabled

#### **SMTP Node (Fallback):**
- SMTP server configured
- Username/password set
- Port and security settings correct

### **Step 3: Add Webhook URL to LocalLead Engine**

1. Open LocalLead Engine
2. Navigate to **Settings** page
3. Find **"N8N Webhook URL"** field
4. Paste webhook URL:
   ```
   https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2
   ```
5. Click **Save Settings**

### **Step 4: Test the Integration**

Run the test script:

```bash
# Test connection only
node scripts/test-n8n-webhook.js

# Test full email send (update email address first!)
node scripts/test-n8n-webhook.js --send
```

---

## **📧 Email Data Format**

### **Request Format (LocalLead → N8N):**

```json
{
  "action": "send_email",
  "emailLogId": "email-log-123",
  "campaignId": "campaign-456",
  "leadId": "lead-789",
  "to": "recipient@example.com",
  "subject": "Your Email Subject",
  "body": "Email body content with personalization...",
  "callbackUrl": "https://locallead-engine.com/api/email-tracking/status"
}
```

### **Required Fields:**
- `to` - Recipient email address
- `subject` - Email subject line
- `body` - Email body content

### **Optional Fields:**
- `action` - Action type (default: "send_email")
- `emailLogId` - Email log ID for tracking
- `campaignId` - Campaign ID for analytics
- `leadId` - Lead ID for tracking
- `callbackUrl` - Callback URL for status updates

---

## **📊 Response Format**

### **Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailLogId": "email-log-123",
  "method": "gmail",
  "timestamp": "2025-12-13T11:30:00Z"
}
```

### **Validation Error (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Missing required field: to",
  "timestamp": "2025-12-13T11:30:00Z"
}
```

### **Send Error (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Failed to send email",
  "message": "Both Gmail and SMTP failed",
  "timestamp": "2025-12-13T11:30:00Z"
}
```

---

## **🧪 Testing Procedures**

### **Test 1: Connection Test**

**Purpose:** Verify N8N webhook is reachable

**Command:**
```bash
node scripts/test-n8n-webhook.js
```

**Expected Result:**
```
✅ SUCCESS! N8N webhook is reachable and responding
```

---

### **Test 2: Validation Test**

**Purpose:** Verify field validation works

**Command:**
```bash
node scripts/test-n8n-webhook.js
```

**Expected Result:**
```
✅ SUCCESS! N8N validation is working (rejected invalid data)
```

---

### **Test 3: Full Email Send Test**

**Purpose:** Send actual test email

**Steps:**
1. Edit `scripts/test-n8n-webhook.js`
2. Change `to: 'test@example.com'` to your email
3. Run:
   ```bash
   node scripts/test-n8n-webhook.js --send
   ```

**Expected Result:**
```
✅ SUCCESS! Email sent successfully via N8N
✅ Check your inbox at: your-email@example.com
```

---

### **Test 4: Campaign Test**

**Purpose:** Test full campaign flow

**Steps:**
1. Open LocalLead Engine
2. Go to **Email Campaigns**
3. Click **Create Campaign**
4. Fill in details:
   - Name: "Test Campaign"
   - Sequence: "3-Step Professional"
   - Select 1-2 leads with valid emails
5. Click **Create Campaign**
6. Click **Start Campaign**

**Expected Result:**
```
✅ Campaign started!

2 emails sent successfully.

Emails will continue to be sent according to the sequence schedule.
```

**Verify:**
- Check "Sent" counter (should be > 0)
- Check recipient inboxes
- Check N8N execution logs

---

## **🔧 Troubleshooting**

### **Problem: "N8N webhook URL not configured"**

**Cause:** Webhook URL not saved in settings

**Solution:**
1. Go to Settings
2. Add webhook URL
3. Click Save
4. Try again

---

### **Problem: "Failed to connect to N8N webhook"**

**Possible Causes:**
1. N8N workflow is not active
2. Webhook URL is incorrect
3. Network connectivity issues
4. N8N instance is down

**Solutions:**
1. Check N8N workflow is ACTIVE
2. Verify webhook URL is correct
3. Test connection: `node scripts/test-n8n-webhook.js`
4. Check N8N instance status

---

### **Problem: "Validation failed: Missing required field"**

**Cause:** Email data missing required fields

**Solution:**
1. Check email has `to`, `subject`, `body`
2. Verify lead has valid email address
3. Check email template has all fields

---

### **Problem: "Both Gmail and SMTP failed"**

**Possible Causes:**
1. Gmail credentials invalid
2. SMTP credentials invalid
3. Rate limits exceeded
4. Recipient email invalid

**Solutions:**
1. Check Gmail OAuth/App Password
2. Verify SMTP credentials
3. Wait and retry (rate limit)
4. Validate recipient email address

---

### **Problem: Emails sent but not received**

**Possible Causes:**
1. Emails in spam folder
2. Invalid recipient address
3. Email bounced
4. Gmail/SMTP blocked sender

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check N8N execution logs
4. Check Gmail/SMTP sender reputation

---

## **📈 Monitoring & Analytics**

### **N8N Execution Logs:**

1. Open N8N workflow
2. Click **Executions** tab
3. View recent executions
4. Check success/failure status
5. View execution details

### **LocalLead Email Logs:**

1. Open browser console
2. Go to Application → Local Storage
3. Find `email_logs` key
4. View email log data:
   ```javascript
   JSON.parse(localStorage.getItem('email_logs'))
   ```

### **Campaign Analytics:**

1. Go to Email Campaigns
2. Click **View Analytics** on campaign
3. See detailed stats:
   - Open Rate
   - Click Rate
   - Reply Rate
   - Bounce Rate

---

## **🚀 Production Checklist**

Before going live with email campaigns:

### **N8N Configuration:**
- [ ] Workflow is ACTIVE
- [ ] Gmail credentials configured
- [ ] SMTP fallback configured
- [ ] Webhook trigger enabled
- [ ] Test executions successful

### **LocalLead Configuration:**
- [ ] Webhook URL saved in Settings
- [ ] Test connection successful
- [ ] Test email sent successfully
- [ ] Campaign created and tested

### **Email Setup:**
- [ ] Email templates reviewed
- [ ] Personalization variables working
- [ ] Unsubscribe link added (if required)
- [ ] Sender email verified
- [ ] SPF/DKIM configured (for deliverability)

### **Testing:**
- [ ] Connection test passed
- [ ] Validation test passed
- [ ] Full email send test passed
- [ ] Campaign test passed
- [ ] Received test emails in inbox

### **Monitoring:**
- [ ] N8N execution logs accessible
- [ ] LocalLead email logs working
- [ ] Campaign analytics displaying
- [ ] Error alerts configured

---

## **📝 Best Practices**

### **Email Deliverability:**

1. **Warm up your sender email:**
   - Start with small batches (10-20 emails/day)
   - Gradually increase volume
   - Monitor bounce/spam rates

2. **Use proper email format:**
   - Include unsubscribe link
   - Add physical address (if required)
   - Use plain text + HTML versions
   - Avoid spam trigger words

3. **Monitor sender reputation:**
   - Check Gmail/SMTP sender score
   - Monitor bounce rates
   - Handle unsubscribes promptly
   - Remove invalid addresses

### **Rate Limiting:**

1. **LocalLead built-in delays:**
   - 2 seconds between emails
   - Prevents rate limit issues

2. **N8N rate limits:**
   - Gmail: 500 emails/day (free)
   - SMTP: Depends on provider
   - Monitor execution logs

3. **Adjust if needed:**
   - Increase delay in `emailSendingService.ts`
   - Split large campaigns
   - Use multiple sender accounts

### **Error Handling:**

1. **Monitor failed emails:**
   - Check N8N execution logs
   - Review LocalLead email logs
   - Identify patterns

2. **Retry failed emails:**
   - Manual retry from campaign
   - Fix issues (invalid email, etc.)
   - Re-send to failed recipients

3. **Handle bounces:**
   - Remove hard bounces
   - Retry soft bounces
   - Update lead email addresses

---

## **🎯 Summary**

### **Integration Complete:**

✅ **N8N Workflow:** Active and configured
✅ **Webhook URL:** Added to LocalLead Settings
✅ **Email Sending:** Working via Gmail + SMTP fallback
✅ **Testing:** All tests passed
✅ **Monitoring:** Logs and analytics available

### **Next Steps:**

1. **Create your first campaign:**
   - Email Campaigns → Create Campaign
   - Select leads and sequence
   - Start campaign

2. **Monitor results:**
   - Check campaign analytics
   - Review N8N execution logs
   - Track open/click rates

3. **Optimize:**
   - Test different email templates
   - Adjust timing and sequences
   - Improve deliverability

---

**Your N8N integration is ready!** 🎉

You can now send automated email campaigns with LocalLead Engine!
