# 🔧 N8N Webhook Troubleshooting

## 🚨 Current Issue: "Missing required fields"

You're getting this error even with the correct payload format. Let's debug step by step.

---

## ✅ Step 1: Activate Your N8N Workflow

**CRITICAL:** I noticed your workflow shows **"0 / 3 Active"** in the top right corner!

### **Fix:**
1. Open your N8N workflow: https://itskiranbabu1.app.n8n.cloud
2. Click the **"Active"** toggle switch in the top right (make it green)
3. Wait for it to say "Active" ✅
4. Try the cURL test again

**Inactive workflows won't respond to webhooks!**

---

## ✅ Step 2: Verify Webhook URL

### **Check Production URL:**

1. Click on the **Webhook Trigger** node
2. Click **"Production URL"** tab
3. Copy the exact URL shown

It should be:
```
https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2
```

If it's different, update your LocalLead settings with the correct URL.

---

## ✅ Step 3: Test with Minimal Payload

Try this super simple test first:

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected responses:**

- **404 Not Found** → Workflow is not active OR wrong URL
- **400 Bad Request** → Workflow is active but validation failed
- **200 OK** → Workflow is working!

---

## ✅ Step 4: Simplify Validation (Temporary)

To test if the workflow is working at all, temporarily remove the validation:

### **Option A: Disable Validation Node**

1. Click on the **"Validate Required Fields"** node
2. Click the **three dots** (⋮) in the top right
3. Select **"Disable"**
4. Save workflow
5. Try cURL test again

### **Option B: Make Fields Optional**

1. Click on **"Validate Required Fields"** node
2. For each condition, change **"is not empty"** to **"exists"**
3. Save workflow
4. Try cURL test again

---

## ✅ Step 5: Check Execution Logs

1. Go to **Executions** tab in N8N
2. Look for recent webhook executions
3. Click on the failed execution
4. Check what data the webhook received

**This will show you exactly what N8N is seeing!**

---

## 🧪 Step 6: Test Different Payload Formats

### **Test 1: Direct fields (no nesting)**

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "subject": "Test",
    "message": "Testing"
  }'
```

### **Test 2: Nested in body (current format)**

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "toEmail": "test@example.com",
      "subject": "Test",
      "message": "Testing"
    }
  }'
```

### **Test 3: Double nested**

```bash
curl -X POST https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "item": {
      "json": {
        "body": {
          "toEmail": "test@example.com",
          "subject": "Test",
          "message": "Testing"
        }
      }
    }
  }'
```

---

## 🔍 Step 7: Check Validation Expression

Your validation node checks:
```
{{ $('Webhook Trigger').item.json.body.toEmail }}
```

This means it's looking for: `request.body.toEmail`

But N8N webhooks automatically parse JSON, so the path might be different.

### **Try updating validation to:**

```
{{ $json.body.toEmail }}
```

Or even simpler:

```
{{ $json.toEmail }}
```

---

## 🎯 Most Likely Issues

### **Issue 1: Workflow Not Active** ⚠️
**Symptom:** 404 Not Found  
**Fix:** Toggle the "Active" switch in top right corner

### **Issue 2: Wrong Validation Path**
**Symptom:** 400 Bad Request - "Missing required fields"  
**Fix:** Update validation expressions to match actual data structure

### **Issue 3: Wrong Webhook URL**
**Symptom:** 404 Not Found  
**Fix:** Copy exact URL from webhook node's Production URL tab

---

## 📋 Quick Checklist

- [ ] Workflow is **Active** (green toggle in top right)
- [ ] Webhook path is `locallead-email-v2`
- [ ] Production URL is correct
- [ ] Validation expressions match data structure
- [ ] Gmail credentials are configured
- [ ] Test cURL returns 200 OK

---

## 🚀 After It Works

Once you get a successful response:

1. **Note the exact payload format that worked**
2. **Update emailSendingService.ts** to match that format
3. **Re-enable validation** if you disabled it
4. **Test from LocalLead app**

---

## 💡 Pro Tips

### **Enable Workflow Execution Logs:**
1. Settings → Workflow Settings
2. Enable "Save Execution Progress"
3. Enable "Save Manual Executions"
4. Now you can see exactly what each node receives!

### **Use N8N's Test Webhook:**
1. Click on Webhook node
2. Click "Listen for Test Event"
3. Send your cURL request
4. See the exact data structure N8N receives

---

## 🆘 Still Not Working?

Share a screenshot of:
1. N8N Executions tab (showing the failed execution)
2. The execution details (what data was received)
3. The validation node configuration

I'll help you fix it! 🚀
