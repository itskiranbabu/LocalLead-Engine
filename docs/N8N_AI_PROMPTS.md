# 🤖 N8N AI Prompts for LocalLead Engine

## 📧 **EMAIL CAMPAIGN SENDER WORKFLOW**

### **AI Prompt for N8N:**

```
Create an N8N workflow for sending email campaigns with the following requirements:

WORKFLOW NAME: LocalLead Email Campaign Sender

TRIGGER:
- Webhook trigger
- HTTP Method: POST
- Path: /locallead-send-email
- Accept JSON payload

INPUT DATA STRUCTURE:
{
  "action": "send_email",
  "emailLogId": "unique-id",
  "campaignId": "campaign-id",
  "leadId": "lead-id",
  "to": "recipient@email.com",
  "subject": "Email subject",
  "body": "Email body content (HTML supported)",
  "callbackUrl": "http://localhost:5173/api/email-tracking/status"
}

WORKFLOW STEPS:

1. WEBHOOK TRIGGER
   - Receive email data
   - Validate required fields (to, subject, body)

2. CHECK ACTION TYPE
   - Use IF node
   - Check if action === "send_email"
   - If not, return error

3. PREPARE EMAIL DATA
   - Use Code/Function node
   - Add tracking pixel to body:
     <img src="https://your-n8n.com/webhook/track-open/{{emailLogId}}" width="1" height="1" />
   - Replace links with tracking links:
     https://your-n8n.com/webhook/track-click/{{emailLogId}}?url=ORIGINAL_URL
   - Extract recipient email

4. SEND EMAIL VIA GMAIL
   - Use Gmail node
   - Send To: {{to}}
   - Subject: {{subject}}
   - Body: {{bodyWithTracking}} (HTML format)
   - Use Gmail OAuth2 credentials

5. UPDATE STATUS - SUCCESS
   - Use HTTP Request node
   - POST to {{callbackUrl}}
   - Body:
     {
       "emailLogId": "{{emailLogId}}",
       "status": "sent",
       "sentAt": "{{current_timestamp}}",
       "messageId": "{{gmail_message_id}}"
     }

6. RESPOND SUCCESS
   - Use Respond to Webhook node
   - Return JSON:
     {
       "success": true,
       "message": "Email sent successfully",
       "emailLogId": "{{emailLogId}}"
     }

7. ERROR HANDLING
   - On Gmail send failure:
     - POST to {{callbackUrl}}
     - Body:
       {
         "emailLogId": "{{emailLogId}}",
         "status": "failed",
         "error": "{{error_message}}"
       }
   - Respond with error:
     {
       "success": false,
       "message": "Email sending failed",
       "error": "{{error_message}}"
     }

ADDITIONAL WEBHOOKS FOR TRACKING:

8. TRACK EMAIL OPENS
   - Webhook trigger
   - Path: /track-open/:emailLogId
   - Method: GET
   - On trigger:
     - POST to callback URL with open event
     - Return 1x1 transparent GIF

9. TRACK EMAIL CLICKS
   - Webhook trigger
   - Path: /track-click/:emailLogId
   - Method: GET
   - Query param: url (original URL)
   - On trigger:
     - POST to callback URL with click event
     - Redirect to original URL

CREDENTIALS NEEDED:
- Gmail OAuth2 (for sending emails)

ERROR HANDLING:
- Validate all required fields
- Handle Gmail API errors
- Handle network errors
- Return proper error messages

RESPONSE FORMAT:
- Always return JSON
- Include success/failure status
- Include error details if failed
```

---

## 🔍 **LEAD ENRICHMENT WORKFLOW**

### **AI Prompt for N8N:**

```
Create an N8N workflow for enriching leads with email addresses using Hunter.io:

WORKFLOW NAME: LocalLead Engine - Lead Enrichment Pipeline

TRIGGER:
- Webhook trigger
- HTTP Method: POST
- Path: /enrich-lead
- Accept JSON payload

INPUT DATA STRUCTURE:
{
  "leadId": "unique-id",
  "name": "Business Name",
  "website": "https://business.com",
  "category": "Gyms",
  "city": "Pune"
}

WORKFLOW STEPS:

1. WEBHOOK TRIGGER
   - Receive lead data
   - Extract website URL

2. CHECK WEBSITE EXISTS
   - Use IF node
   - Check if website field is not empty
   - If empty, return error

3. HUNTER.IO - DOMAIN SEARCH
   - Use Hunter.io node
   - Operation: Domain Search
   - Domain: {{website}}
   - Limit: 10 results
   - Use Hunter.io API credentials

4. HUNTER.IO - EMAIL VERIFIER (Optional)
   - Use Hunter.io node
   - Operation: Email Verifier
   - Email: {{best_email_from_search}}
   - Verify deliverability

5. PROCESS ENRICHMENT DATA
   - Use Code/Function node
   - Extract best email (highest confidence)
   - Calculate email score
   - Prepare response data:
     {
       "leadId": "{{leadId}}",
       "email": "{{best_email}}",
       "emailConfidence": {{confidence_score}},
       "enrichmentSource": "hunter.io",
       "enrichedAt": "{{current_timestamp}}"
     }

6. RESPOND TO WEBHOOK
   - Use Respond to Webhook node
   - Return enriched lead data

ERROR HANDLING:
- If no website: Return error
- If Hunter.io fails: Return original lead
- If no email found: Return lead with null email

CREDENTIALS NEEDED:
- Hunter.io API key

RESPONSE FORMAT:
{
  "leadId": "unique-id",
  "name": "Business Name",
  "website": "https://business.com",
  "email": "contact@business.com",
  "emailConfidence": 95,
  "enrichmentSource": "hunter.io",
  "enrichedAt": "2025-12-13T08:00:00Z"
}
```

---

## 📊 **EMAIL TRACKING WORKFLOW**

### **AI Prompt for N8N:**

```
Create an N8N workflow for tracking email opens and clicks:

WORKFLOW NAME: LocalLead Email Tracking

WEBHOOKS NEEDED:

1. TRACK EMAIL OPEN
   - Webhook trigger
   - Path: /track-open/:emailLogId
   - Method: GET
   - Steps:
     a. Extract emailLogId from URL params
     b. POST to LocalLead callback:
        URL: http://localhost:5173/api/email-tracking/open
        Body: {
          "emailLogId": "{{emailLogId}}",
          "openedAt": "{{current_timestamp}}",
          "userAgent": "{{request_user_agent}}",
          "ipAddress": "{{request_ip}}"
        }
     c. Return 1x1 transparent GIF:
        Content-Type: image/gif
        Body: data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7

2. TRACK EMAIL CLICK
   - Webhook trigger
   - Path: /track-click/:emailLogId
   - Method: GET
   - Query params: url (original URL)
   - Steps:
     a. Extract emailLogId from URL params
     b. Extract original URL from query params
     c. POST to LocalLead callback:
        URL: http://localhost:5173/api/email-tracking/click
        Body: {
          "emailLogId": "{{emailLogId}}",
          "clickedAt": "{{current_timestamp}}",
          "url": "{{original_url}}",
          "userAgent": "{{request_user_agent}}",
          "ipAddress": "{{request_ip}}"
        }
     d. Redirect to original URL (302 redirect)

ERROR HANDLING:
- If callback fails, still return pixel/redirect
- Log errors for debugging
- Don't break user experience

RESPONSE FORMATS:
- Open tracking: 1x1 transparent GIF
- Click tracking: 302 redirect to original URL
```

---

## 🔧 **COMBINED WORKFLOW (All-in-One)**

### **AI Prompt for N8N:**

```
Create a comprehensive N8N workflow for LocalLead Engine that handles:
1. Email sending via Gmail
2. Email tracking (opens and clicks)
3. Status updates back to LocalLead

WORKFLOW NAME: LocalLead Complete Email System

WEBHOOKS:

1. SEND EMAIL
   - Path: /locallead-send-email
   - Method: POST
   - Input: {action, emailLogId, to, subject, body, callbackUrl}
   - Process:
     a. Add tracking pixel to body
     b. Replace links with tracking links
     c. Send via Gmail
     d. Update status via callback
     e. Return success/error

2. TRACK OPEN
   - Path: /track-open/:emailLogId
   - Method: GET
   - Process:
     a. Log open event
     b. POST to callback URL
     c. Return 1x1 GIF

3. TRACK CLICK
   - Path: /track-click/:emailLogId
   - Method: GET
   - Query: url
   - Process:
     a. Log click event
     b. POST to callback URL
     c. Redirect to original URL

CREDENTIALS:
- Gmail OAuth2

ERROR HANDLING:
- Validate all inputs
- Handle Gmail errors
- Handle callback errors
- Return proper responses

TRACKING IMPLEMENTATION:
- Pixel: <img src="https://n8n.com/webhook/track-open/{{id}}" width="1" height="1" />
- Links: https://n8n.com/webhook/track-click/{{id}}?url={{original}}
```

---

## 🎯 **TESTING PROMPTS**

### **Test Email Sending:**

```bash
curl -X POST https://your-n8n.com/webhook/locallead-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_email",
    "emailLogId": "test-123",
    "campaignId": "campaign-1",
    "leadId": "lead-1",
    "to": "your-email@gmail.com",
    "subject": "Test Email from LocalLead",
    "body": "<p>This is a test email!</p><p>Check out: <a href=\"https://tr.ee/itskiranbabu\">tr.ee/itskiranbabu</a></p>",
    "callbackUrl": "http://localhost:5173/api/email-tracking/status"
  }'
```

### **Test Email Open Tracking:**

```bash
# Open this URL in browser:
https://your-n8n.com/webhook/track-open/test-123

# Should return 1x1 transparent GIF
```

### **Test Email Click Tracking:**

```bash
# Open this URL in browser:
https://your-n8n.com/webhook/track-click/test-123?url=https://tr.ee/itskiranbabu

# Should redirect to tr.ee/itskiranbabu
```

---

## 📝 **WORKFLOW SPECIFICATIONS**

### **Email Campaign Sender:**

**Nodes Required:**
1. Webhook Trigger (POST /locallead-send-email)
2. IF Node (Check action type)
3. Code Node (Prepare email with tracking)
4. Gmail Node (Send email)
5. HTTP Request Node (Update status - success)
6. HTTP Request Node (Update status - failed)
7. Respond to Webhook (Success)
8. Respond to Webhook (Error)

**Connections:**
```
Webhook → IF → Code → Gmail → HTTP (Success) → Respond (Success)
                  ↓
              Error → HTTP (Failed) → Respond (Error)
```

---

### **Email Tracking:**

**Nodes Required:**
1. Webhook Trigger (GET /track-open/:emailLogId)
2. HTTP Request Node (POST to callback)
3. Respond to Webhook (Return GIF)
4. Webhook Trigger (GET /track-click/:emailLogId)
5. HTTP Request Node (POST to callback)
6. Respond to Webhook (Redirect)

**Connections:**
```
Webhook (Open) → HTTP Request → Respond (GIF)
Webhook (Click) → HTTP Request → Respond (Redirect)
```

---

## 🚀 **QUICK START**

### **Option 1: Use Existing Workflows**
```bash
# Import these files into N8N:
1. n8n-workflows/email-campaign-sender.json
2. n8n-workflows/lead-enrichment-pipeline.json

# Configure credentials:
1. Gmail OAuth2
2. Hunter.io API key

# Activate workflows
```

### **Option 2: Create with AI**
```bash
# Use the prompts above in N8N AI
# Or copy-paste into ChatGPT/Claude
# Then import generated workflow
```

---

## 📚 **ADDITIONAL RESOURCES**

**N8N Documentation:**
- Gmail Node: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/
- Webhook Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

**LocalLead Documentation:**
- `docs/N8N_INTEGRATION_ANALYSIS.md` - Integration analysis
- `docs/N8N_EMAIL_SETUP.md` - Setup guide
- `docs/USER_GUIDE.md` - User guide

---

## 🎉 **SUMMARY**

**You have 3 options:**

1. ✅ **Use existing workflows** (Recommended)
   - Import JSON files
   - Configure credentials
   - Start sending!

2. ✅ **Modify existing workflows**
   - Use AI prompts above
   - Customize for your needs
   - Import and test

3. ✅ **Create from scratch**
   - Use AI prompts above
   - Build in N8N
   - Test thoroughly

**Recommended:** Use existing workflows! They're ready to go! 🚀
