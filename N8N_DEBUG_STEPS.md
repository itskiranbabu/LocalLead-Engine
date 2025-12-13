# 🔍 N8N Webhook Debugging - Step by Step

## 🚨 Current Error Analysis

You're getting:
```json
{
  "success": false,
  "error": "Missing required fields",
  "timestamp": "2025-12-13T19:02:16.194+05:30"
}
```

**This is NOT a standard N8N error format!** N8N errors look different. This suggests:

1. The request might not be reaching N8N at all
2. There's a proxy/middleware intercepting it
3. The workflow has a custom error response node

---

## ✅ Step 1: Verify Workflow is Actually Active

1. Go to N8N: https://itskiranbabu1.app.n8n.cloud
2. Look at the workflow list
3. Your workflow should have a **GREEN dot** next to it
4. If it's gray/inactive, click on it and toggle "Active" ON

**Screenshot this and confirm it's green!**

---

## ✅ Step 2: Use N8N's Test Mode

This is the BEST way to debug:

1. **Open your workflow** in N8N
2. **Click on the Webhook node** (first node)
3. **Click "Listen for Test Event"** button
4. **Keep that window open**
5. **In a new terminal, run:**

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{"body":{"toEmail":"test@example.com","subject":"Test","message":"Testing"}}'
```

6. **Go back to N8N** - you should see the data appear!
7. **Click "Execute Workflow"**

This will show you EXACTLY what data N8N receives and where it fails.

---

## ✅ Step 3: Check the Webhook URL

### **In N8N:**

1. Click on **Webhook Trigger** node
2. Look at the **Production URL** tab
3. Copy the EXACT URL shown

### **Common Issues:**

- URL might be different than expected
- Might need `/webhook-test/` instead of `/webhook/`
- Might have additional path segments

**Share the exact URL you see in N8N!**

---

## ✅ Step 4: Simplify the Workflow

Let's create a minimal test workflow:

### **Create New Test Workflow:**

1. **New Workflow** in N8N
2. **Add Webhook node:**
   - Path: `test-email`
   - Method: POST
   - Response: "Respond to Webhook"

3. **Add Respond to Webhook node:**
   - Response Body: `{{ $json }}`

4. **Activate workflow**

5. **Test:**
```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/test-email \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**Expected:** Should return `{"test":"data"}`

If this works, the issue is with your main workflow's validation.

---

## ✅ Step 5: Check Validation Node Configuration

The validation node is checking:
```javascript
{{ $('Webhook Trigger').item.json.body.toEmail }}
```

But this might be wrong! When N8N receives webhook data, it's usually at:
```javascript
{{ $json.body.toEmail }}
```

### **Fix the Validation:**

1. Click on **"Validate Required Fields"** node
2. For the first condition, change:
   - FROM: `{{ $('Webhook Trigger').item.json.body.toEmail }}`
   - TO: `{{ $json.body.toEmail }}`

3. Do the same for `subject` and `message`
4. Save workflow
5. Test again

---

## ✅ Step 6: Temporarily Remove Validation

To test if validation is the issue:

1. **Right-click** on the connection between "Webhook Trigger" and "Validate Required Fields"
2. **Delete** the connection
3. **Connect** "Webhook Trigger" directly to "Send via Gmail"
4. **Update Gmail node** to use:
   - To: `{{ $json.body.toEmail }}`
   - Subject: `{{ $json.body.subject }}`
   - Message: `{{ $json.body.message }}`
5. **Save and test**

---

## ✅ Step 7: Check N8N Execution Logs

1. Go to **Executions** tab in N8N
2. Look for recent executions (should show your test attempts)
3. Click on a failed execution
4. Check:
   - What data did the webhook receive?
   - Which node failed?
   - What was the error?

**Screenshot the execution details!**

---

## 🧪 Alternative Test Payloads

Try these different formats:

### **Format 1: Current (nested in body)**
```bash
curl -v -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{"body":{"toEmail":"test@example.com","subject":"Test","message":"Testing"}}'
```

### **Format 2: Direct (no nesting)**
```bash
curl -v -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{"toEmail":"test@example.com","subject":"Test","message":"Testing"}'
```

### **Format 3: Original field names**
```bash
curl -v -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Testing"}'
```

**Note the `-v` flag - this shows full request/response headers!**

---

## 🔍 What That Error Tells Us

The error format:
```json
{
  "success": false,
  "error": "Missing required fields",
  "timestamp": "2025-12-13T19:02:16.194+05:30"
}
```

This looks like it's coming from:
1. **Your validation node** (if you customized the error response)
2. **A proxy/API gateway** in front of N8N
3. **N8N Cloud's validation layer**

---

## 📋 Information Needed

Please share:

1. **Screenshot of workflow list** showing the workflow is active (green dot)
2. **Screenshot of Webhook node** showing the Production URL
3. **Screenshot of Executions tab** showing recent failed attempts
4. **Screenshot of a failed execution's details** (what data was received)
5. **Result of the "Listen for Test Event" test** (Step 2 above)

With this info, I can give you the exact fix! 🎯

---

## 💡 Quick Win

The fastest way to fix this:

1. **Disable the validation node** (right-click → Disable)
2. **Test again**
3. **Check execution logs** to see what data format N8N actually receives
4. **Update validation** to match that format
5. **Re-enable validation**

This will at least get emails sending while we fix the validation! 🚀
