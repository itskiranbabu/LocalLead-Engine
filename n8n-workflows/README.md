# N8N Integration for LocalLead Engine

## 🚀 Overview

This directory contains N8N workflows that automate various aspects of LocalLead Engine, including email sending and lead enrichment.

## 📋 Available Workflows

### 1. **Lead Enrichment Pipeline** (`lead-enrichment-pipeline.json`)

Automatically enriches lead data by finding email addresses, verifying them, and returning enriched information.

**Features:**
- ✅ Finds email addresses using Hunter.io
- ✅ Verifies email deliverability
- ✅ Returns confidence scores
- ✅ Error handling and fallbacks
- ✅ Webhook-based integration

---

## 🛠️ Setup Instructions

### Prerequisites

1. **N8N Instance** - Self-hosted or cloud (n8n.cloud)
2. **Hunter.io API Key** - Get from [hunter.io/api-keys](https://hunter.io/api-keys)
3. **LocalLead Engine** - Running instance with Settings configured

### Step 1: Import Workflow into N8N

1. Open your N8N instance
2. Click **"Workflows"** → **"Import from File"**
3. Select `lead-enrichment-pipeline.json`
4. Click **"Import"**

### Step 2: Configure Hunter.io Credentials

1. In N8N, go to **"Credentials"** → **"Add Credential"**
2. Select **"Hunter.io API"**
3. Enter your Hunter.io API key
4. Save the credential
5. In the workflow, connect the Hunter.io nodes to your credential

### Step 3: Activate Webhook

1. Open the imported workflow
2. Click on the **"Webhook Trigger"** node
3. Copy the **Production Webhook URL**
4. It should look like: `https://your-n8n-instance.com/webhook/enrich-lead`

### Step 4: Configure LocalLead Engine

1. Open LocalLead Engine
2. Go to **Settings**
3. Scroll to **"N8N Automation Webhooks"**
4. Paste the webhook URL in **"Lead Enrichment Webhook"**
5. Add your Hunter.io API key in **"Email Enrichment API Keys"**
6. Click **"Save Settings"**

### Step 5: Test the Integration

1. Go to **Leads Manager** in LocalLead Engine
2. Select a lead with a website
3. Click the **"Enrich"** button (sparkles icon)
4. Check N8N execution logs to verify it's working

---

## 🔧 How It Works

### Lead Enrichment Flow

```
LocalLead Engine → N8N Webhook → Hunter.io API → Process Data → Return to LocalLead
```

1. **Trigger**: LocalLead Engine sends lead data to N8N webhook
2. **Validation**: N8N checks if website exists
3. **Email Discovery**: Hunter.io searches for email addresses
4. **Processing**: Best email is selected based on confidence score
5. **Response**: Enriched data is returned to LocalLead Engine
6. **Update**: Lead record is updated with new information

### Data Flow

**Input (from LocalLead Engine):**
```json
{
  "leadId": "abc123",
  "name": "Adinath PG",
  "website": "https://adinathpg.com",
  "email": null,
  "city": "Kharadi",
  "category": "PG"
}
```

**Output (to LocalLead Engine):**
```json
{
  "leadId": "abc123",
  "email": "contact@adinathpg.com",
  "emailConfidence": 95,
  "enrichmentSource": "hunter.io",
  "enrichedAt": "2025-12-12T17:50:00.000Z"
}
```

---

## 🎯 Future Automation Possibilities

### 1. **AI-Powered Follow-up Sequences**
- Automatically send follow-up emails based on lead behavior
- Personalize messages using AI
- Track engagement and adjust timing

### 2. **Lead Scoring & Qualification**
- Score leads based on website quality, social presence, reviews
- Automatically prioritize high-value leads
- Trigger notifications for hot leads

### 3. **Multi-Source Enrichment**
- Combine Hunter.io, Clearbit, Apollo data
- Find social media profiles
- Get company size, revenue, tech stack

### 4. **Automated Reporting**
- Daily/weekly email reports
- Campaign performance analytics
- Lead conversion tracking

### 5. **CRM Integration**
- Sync leads to HubSpot, Salesforce, Pipedrive
- Two-way data synchronization
- Automated deal creation

### 6. **Social Media Automation**
- Auto-follow leads on LinkedIn
- Send connection requests
- Engage with their content

---

## 🐛 Troubleshooting

### Webhook Not Responding

**Problem**: N8N workflow not triggering
**Solution**:
1. Check if workflow is **activated** (toggle in top-right)
2. Verify webhook URL is correct in LocalLead Settings
3. Check N8N execution logs for errors

### Hunter.io API Errors

**Problem**: "API key invalid" or "Rate limit exceeded"
**Solution**:
1. Verify API key is correct in N8N credentials
2. Check Hunter.io account limits
3. Add rate limiting delays in workflow

### No Email Found

**Problem**: Enrichment returns no email
**Solution**:
1. Verify lead has a valid website
2. Check if website domain is correct
3. Try manual search on Hunter.io to verify data exists

### Enrichment Taking Too Long

**Problem**: Workflow times out
**Solution**:
1. Increase webhook timeout in N8N settings
2. Add error handling nodes
3. Implement retry logic

---

## 📊 Monitoring & Analytics

### N8N Execution Logs

View workflow executions:
1. Go to **"Executions"** in N8N
2. Filter by workflow name
3. Check success/failure rates
4. Review error messages

### LocalLead Engine Logs

Check browser console:
```javascript
// Look for these log messages
[N8N Enrichment] Starting enrichment for {lead_name}...
[N8N Enrichment] Success: {result}
[N8N Enrichment] Error: {error}
```

---

## 🔐 Security Best Practices

1. **API Keys**: Never commit API keys to Git
2. **Webhook URLs**: Use HTTPS only
3. **Rate Limiting**: Implement delays to avoid API bans
4. **Error Handling**: Always handle failures gracefully
5. **Logging**: Log enrichment attempts for debugging

---

## 📚 Resources

- [N8N Documentation](https://docs.n8n.io/)
- [Hunter.io API Docs](https://hunter.io/api-documentation)
- [LocalLead Engine GitHub](https://github.com/itskiranbabu/LocalLead-Engine)

---

## 🤝 Contributing

Have ideas for new N8N workflows? Submit a PR with:
1. Workflow JSON file
2. Documentation
3. Setup instructions
4. Use case examples

---

## 📝 License

MIT License - See main repository for details

---

**Need Help?** Open an issue on GitHub or contact support.
