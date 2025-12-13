# 🔍 N8N Webhook Debugging Guide

## Current Issue

Getting **400 Bad Request - "Missing required fields"** from N8N webhook.

---

## ✅ What We're Sending

```json
{
  "to": "business@example.com",
  "subject": "Quick question about Gym Name",
  "body": "Hey Gym Name team! 👋\n\nKiran from Content Spark here...",
  "from_name": "Kiran Babu",
  "campaignId": "campaign_123",
  "leadId": "lead_456",
  "emailLogId": "log_789"
}
```

---

## 🔧 How to Fix Your N8N Workflow

### **Step 1: Check Your Webhook Node**

1. Open your N8N workflow: `locallead-email-v2`
2. Click on the **Webhook** node (first node)
3. Check what fields it's expecting

### **Step 2: Update Webhook to Accept Our Format**

Your webhook should accept these fields:
- `to` (required) - Recipient email
- `subject` (required) - Email subject
- `body` (required) - Email body/message
- `from_name` (optional) - Sender name
- `campaignId` (optional) - For tracking
- `leadId` (optional) - For tracking
- `emailLogId` (optional) - For tracking

### **Step 3: Simple N8N Workflow Setup**

Here's a minimal working workflow:

#### **Node 1: Webhook Trigger**
- **Path:** `locallead-email-v2`
- **Method:** POST
- **Response Mode:** "Respond to Webhook"

#### **Node 2: Send Email (Gmail/SMTP)**
- **To:** `{{ $json.to }}`
- **Subject:** `{{ $json.subject }}`
- **Message:** `{{ $json.body }}`
- **From Name:** `{{ $json.from_name || 'LocalLead Engine' }}`

#### **Node 3: Respond to Webhook**
- **Response Body:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

---

## 🧪 Test Your N8N Workflow

### **Option 1: Test in Postman/Insomnia**

```bash
POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2
Content-Type: application/json

{
  "to": "your-email@gmail.com",
  "subject": "Test Email",
  "body": "This is a test email from LocalLead Engine!",
  "from_name": "Kiran Babu"
}
```

### **Option 2: Test with cURL**

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test Email",
    "body": "This is a test!",
    "from_name": "Kiran Babu"
  }'
```

### **Option 3: Test in N8N**

1. Open your workflow
2. Click **Execute Workflow** (top right)
3. Click on Webhook node
4. Click **Listen for Test Event**
5. Send a test request from Postman
6. Check if it works!

---

## 🚨 Common Issues & Fixes

### **Issue 1: "Missing required fields"**

**Cause:** N8N workflow has validation that requires certain fields

**Fix:** 
1. Go to your N8N workflow
2. Find any **IF** or **Switch** nodes that check for fields
3. Remove field validation OR update to match our payload
4. Make sure no nodes require fields we're not sending

### **Issue 2: "action field required"**

**Cause:** Workflow expects `{ "action": "send_email", ... }`

**Fix:** Update the emailSendingService to include action field:

```typescript
const emailData = {
  action: 'send_email', // ADD THIS
  to: emailLog.to,
  subject: emailLog.subject,
  body: emailLog.body,
  from_name: settings.userName || 'LocalLead Engine',
};
```

### **Issue 3: "Nested body.* fields required"**

**Cause:** Workflow expects `{ "body": { "to": "...", ... } }`

**Fix:** Wrap payload in body:

```typescript
const emailData = {
  body: {
    to: emailLog.to,
    subject: emailLog.subject,
    body: emailLog.body,
    from_name: settings.userName || 'LocalLead Engine',
  }
};
```

---

## 📋 Checklist

After fixing your N8N workflow:

- [ ] Webhook accepts POST requests
- [ ] Webhook doesn't require extra fields
- [ ] Email node uses `{{ $json.to }}`, `{{ $json.subject }}`, `{{ $json.body }}`
- [ ] Workflow responds with success message
- [ ] Test request from Postman works
- [ ] Test from LocalLead app works

---

## 🎯 Next Steps

1. **Test your N8N workflow** with Postman/cURL
2. **Identify what fields it actually needs**
3. **Update this document** with the correct format
4. **Update emailSendingService.ts** if needed
5. **Test from LocalLead app**

---

## 💡 Pro Tip

Enable **Workflow Execution Logs** in N8N:
1. Go to Settings → Workflow Settings
2. Enable "Save Execution Progress"
3. Enable "Save Manual Executions"
4. Now you can see exactly what data each node receives!

---

**Need help?** Share a screenshot of your N8N workflow and I'll help you fix it!
