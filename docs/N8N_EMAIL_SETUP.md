# 📧 N8N Email Integration - Complete Setup Guide

## 🎯 **OVERVIEW**

This guide will help you set up **real email sending** for your LocalLead Engine using N8N automation.

**What you'll get:**
- ✅ Automated email sending via Gmail
- ✅ Email open tracking
- ✅ Click tracking
- ✅ Real-time status updates
- ✅ Bounce handling
- ✅ Campaign analytics

---

## 📋 **PREREQUISITES**

Before starting, make sure you have:

1. ✅ **N8N Instance** (Cloud or Self-hosted)
   - Cloud: https://n8n.io (Free tier available)
   - Self-hosted: https://docs.n8n.io/hosting/

2. ✅ **Gmail Account** (for sending emails)
   - Personal Gmail or Google Workspace
   - App passwords enabled (if using 2FA)

3. ✅ **LocalLead Engine** running locally

---

## 🚀 **STEP-BY-STEP SETUP**

### **Step 1: Import N8N Workflow**

1. **Open your N8N instance**
   - Go to https://app.n8n.cloud (or your self-hosted URL)
   - Log in to your account

2. **Create new workflow**
   - Click **"New Workflow"** button
   - Name it: **"LocalLead Email Campaign Sender"**

3. **Import workflow JSON**
   - Click the **"..."** menu (top right)
   - Select **"Import from File"**
   - Upload: `n8n-workflows/email-campaign-sender.json`
   - Click **"Import"**

4. **Verify workflow imported**
   - You should see multiple nodes:
     - Webhook - Receive Email Request
     - Check Action Type
     - Prepare Email Data
     - Send Email via Gmail
     - Update Status nodes
     - Track Open/Click webhooks

---

### **Step 2: Configure Gmail OAuth2**

1. **Create Google Cloud Project**
   
   a. Go to https://console.cloud.google.com
   
   b. Click **"Create Project"**
      - Name: "LocalLead Email Sender"
      - Click **"Create"**
   
   c. Enable Gmail API
      - Go to **"APIs & Services"** → **"Library"**
      - Search for **"Gmail API"**
      - Click **"Enable"**

2. **Create OAuth2 Credentials**
   
   a. Go to **"APIs & Services"** → **"Credentials"**
   
   b. Click **"Create Credentials"** → **"OAuth client ID"**
   
   c. Configure OAuth consent screen (if prompted)
      - User Type: **External**
      - App name: **"LocalLead Email Sender"**
      - User support email: Your email
      - Developer contact: Your email
      - Click **"Save and Continue"**
   
   d. Add scopes
      - Click **"Add or Remove Scopes"**
      - Add: `https://www.googleapis.com/auth/gmail.send`
      - Click **"Update"** → **"Save and Continue"**
   
   e. Add test users (for development)
      - Click **"Add Users"**
      - Add your Gmail address
      - Click **"Save and Continue"**
   
   f. Create OAuth client ID
      - Application type: **Web application**
      - Name: **"N8N Gmail Integration"**
      - Authorized redirect URIs:
        - For N8N Cloud: `https://app.n8n.cloud/rest/oauth2-credential/callback`
        - For Self-hosted: `https://your-n8n-domain.com/rest/oauth2-credential/callback`
      - Click **"Create"**
   
   g. **Save credentials**
      - Copy **Client ID**
      - Copy **Client Secret**
      - Click **"OK"**

3. **Add Gmail Credentials to N8N**
   
   a. In N8N, click **"Credentials"** (left sidebar)
   
   b. Click **"Add Credential"**
   
   c. Search for **"Gmail OAuth2"**
   
   d. Fill in details:
      - **Credential Name:** "Gmail account"
      - **Client ID:** Paste from Google Cloud
      - **Client Secret:** Paste from Google Cloud
   
   e. Click **"Connect my account"**
   
   f. Sign in with your Gmail account
   
   g. Grant permissions
   
   h. Click **"Save"**

4. **Link Credentials to Workflow**
   
   a. Open your workflow
   
   b. Click on **"Send Email via Gmail"** node
   
   c. Under **"Credential to connect with"**:
      - Select **"Gmail account"** (the one you just created)
   
   d. Click **"Save"** (top right)

---

### **Step 3: Activate Workflow**

1. **Get Webhook URLs**
   
   a. Click on **"Webhook - Receive Email Request"** node
   
   b. Copy the **Production URL**
      - Example: `https://app.n8n.cloud/webhook/abc123/locallead-send-email`
      - **Save this URL** - you'll need it for LocalLead Engine
   
   c. Click on **"Webhook - Track Open"** node
      - Note the path: `/track-open/:emailLogId`
   
   d. Click on **"Webhook - Track Click"** node
      - Note the path: `/track-click/:emailLogId`

2. **Activate the workflow**
   - Toggle the **"Active"** switch (top right)
   - Status should change to **"Active"**

3. **Test the workflow**
   - Click **"Execute Workflow"** button
   - Should show: "Waiting for webhook call..."

---

### **Step 4: Configure LocalLead Engine**

1. **Open LocalLead Engine**
   ```bash
   npm run dev
   ```

2. **Go to Settings Page**
   - Click **"Settings"** in sidebar
   - Scroll to **"N8N Email Integration"** section

3. **Enter Webhook URL**
   - Paste the Production URL from Step 3
   - Example: `https://app.n8n.cloud/webhook/abc123/locallead-send-email`

4. **Test Connection**
   - Click **"Test Connection"** button
   - Should show: ✅ "N8N connection successful!"

5. **Enable Email Sending**
   - Check the **"Enable N8N Email Sending"** checkbox
   - Click **"Save Settings"**

---

### **Step 5: Test Email Sending**

1. **Create Test Campaign**
   
   a. Go to **"Email Campaigns"** page
   
   b. Click **"Create Campaign"**
   
   c. Fill in details:
      - Name: "Test Campaign"
      - Sequence: "3-Step Cold Outreach"
      - Select 1-2 leads with valid emails
   
   d. Click **"Create Campaign"**

2. **Start Campaign**
   - Click **"Start Campaign"** button
   - Emails will be scheduled

3. **Check N8N Execution**
   
   a. Go to N8N
   
   b. Click **"Executions"** (left sidebar)
   
   c. You should see successful executions
   
   d. Click on an execution to see details

4. **Verify Email Sent**
   - Check the recipient's inbox
   - Email should be delivered
   - Check spam folder if not in inbox

5. **Test Tracking**
   
   a. Open the email
      - Should trigger open tracking
   
   b. Click a link in the email
      - Should trigger click tracking
   
   c. Go to LocalLead Engine → Email Campaigns
   
   d. Click **"Analytics"** on your campaign
      - Should show: 1 sent, 1 opened, 1 clicked

---

## 📊 **HOW IT WORKS**

### **Email Sending Flow:**

```
LocalLead Engine
    ↓
    ↓ (Scheduled email)
    ↓
N8N Webhook (Receive Email Request)
    ↓
    ↓ (Prepare email with tracking)
    ↓
Gmail API (Send email)
    ↓
    ↓ (Update status)
    ↓
LocalLead Engine (Status: Sent)
```

### **Email Tracking Flow:**

```
Recipient Opens Email
    ↓
    ↓ (Loads tracking pixel)
    ↓
N8N Webhook (Track Open)
    ↓
    ↓ (Update status)
    ↓
LocalLead Engine (Status: Opened)
```

```
Recipient Clicks Link
    ↓
    ↓ (Redirects through tracking URL)
    ↓
N8N Webhook (Track Click)
    ↓
    ↓ (Update status + redirect)
    ↓
LocalLead Engine (Status: Clicked)
    ↓
Original URL (User sees destination)
```

---

## 🔧 **ADVANCED CONFIGURATION**

### **Custom Tracking Domain (Optional)**

For better deliverability, use a custom domain for tracking:

1. **Add custom domain to N8N**
   - N8N Cloud: Settings → Custom Domains
   - Self-hosted: Configure reverse proxy

2. **Update tracking URLs**
   - Edit workflow
   - Replace `your-n8n-instance.com` with your domain
   - Save workflow

### **Email Rate Limiting**

To avoid Gmail rate limits:

1. **Edit workflow**
   - Click on **"Prepare Email Data"** node

2. **Add delay**
   - Add **"Wait"** node after Gmail node
   - Set delay: 1-2 seconds

3. **Batch sending**
   - LocalLead Engine automatically adds 1-second delay
   - Gmail limit: 500 emails/day (free), 2000/day (Workspace)

### **Custom Email Templates**

To customize email HTML:

1. **Edit workflow**
   - Click on **"Prepare Email Data"** node

2. **Modify function code**
   - Add HTML wrapper
   - Add custom styling
   - Add unsubscribe link

---

## 🐛 **TROUBLESHOOTING**

### **Problem: "N8N connection failed"**

**Solutions:**
1. Check webhook URL is correct
2. Verify workflow is **Active**
3. Check N8N instance is running
4. Test webhook URL in browser (should return error, but confirms it's accessible)

### **Problem: "Gmail authentication failed"**

**Solutions:**
1. Re-authenticate Gmail in N8N credentials
2. Check OAuth2 scopes include `gmail.send`
3. Verify test users include your Gmail address
4. Try creating new OAuth2 credentials

### **Problem: "Emails not sending"**

**Solutions:**
1. Check N8N executions for errors
2. Verify Gmail credentials are valid
3. Check Gmail sending limits (500/day for free)
4. Verify email addresses are valid
5. Check spam folder

### **Problem: "Tracking not working"**

**Solutions:**
1. Verify tracking webhooks are active
2. Check tracking URLs are accessible
3. Test tracking pixel URL in browser
4. Check LocalLead Engine is running

### **Problem: "High bounce rate"**

**Solutions:**
1. Verify email addresses are valid
2. Use email enrichment to get better emails
3. Check email content for spam triggers
4. Warm up Gmail account (start with small batches)

---

## 💡 **BEST PRACTICES**

### **1. Warm Up Your Gmail Account**

Start slow to build sender reputation:

**Week 1:** 10 emails/day
**Week 2:** 25 emails/day
**Week 3:** 50 emails/day
**Week 4:** 100 emails/day
**Week 5+:** Up to 500 emails/day

### **2. Improve Deliverability**

- ✅ Use professional email address
- ✅ Personalize every email
- ✅ Include unsubscribe link
- ✅ Avoid spam trigger words
- ✅ Keep email short and focused
- ✅ Test emails before sending

### **3. Monitor Metrics**

Track these key metrics:

- **Bounce Rate:** Should be <5%
- **Open Rate:** Should be >20%
- **Reply Rate:** Should be >5%
- **Spam Complaints:** Should be <0.1%

### **4. Handle Bounces**

- Hard bounces: Remove from list immediately
- Soft bounces: Retry 2-3 times, then remove
- Update email enrichment data

### **5. Respect Recipients**

- ✅ Honor unsubscribe requests immediately
- ✅ Only email businesses (B2B)
- ✅ Follow CAN-SPAM Act
- ✅ Respect GDPR if applicable
- ✅ Don't buy email lists

---

## 📈 **SCALING UP**

### **For High Volume (1000+ emails/day):**

1. **Use Google Workspace**
   - Higher sending limits (2000/day)
   - Better deliverability
   - Professional email address

2. **Use Email Service Provider**
   - SendGrid (100 emails/day free)
   - Mailgun (5000 emails/month free)
   - Amazon SES (62,000 emails/month free)

3. **Multiple Sending Accounts**
   - Rotate between multiple Gmail accounts
   - Distribute sending load
   - Better deliverability

4. **Dedicated IP Address**
   - For very high volume (10,000+/day)
   - Better sender reputation
   - More control

---

## 🎉 **YOU'RE DONE!**

Your LocalLead Engine is now sending **real emails** via N8N!

**Next steps:**
1. ✅ Create your first real campaign
2. ✅ Monitor analytics
3. ✅ Optimize templates based on results
4. ✅ Scale up gradually

---

## 💬 **SUPPORT**

**Need help?**
- Check N8N documentation: https://docs.n8n.io
- Check Gmail API docs: https://developers.google.com/gmail/api
- Review workflow executions in N8N
- Check browser console for errors

**Common issues:**
- See Troubleshooting section above
- Check N8N community forum
- Review workflow execution logs

---

## 📚 **ADDITIONAL RESOURCES**

- **N8N Documentation:** https://docs.n8n.io
- **Gmail API Guide:** https://developers.google.com/gmail/api/guides
- **OAuth2 Setup:** https://developers.google.com/identity/protocols/oauth2
- **Email Best Practices:** https://sendgrid.com/blog/email-best-practices/

---

**Happy emailing!** 📧🚀
