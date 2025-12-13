# 📱 LocalLead Engine - Complete App Flow Guide

## 🎯 **FROM LEAD SEARCH TO EMAIL SENDING**

---

## 📊 **COMPLETE USER JOURNEY**

```
Step 1: Search Leads
   ↓
Step 2: Save Leads
   ↓
Step 3: View Leads in Leads Manager
   ↓
Step 4: Enrich Leads with Emails
   ↓
Step 5: Create Email Campaign
   ↓
Step 6: Start Campaign & Send Emails
   ↓
Step 7: Track Results in Analytics
```

---

## 🔍 **STEP 1: SEARCH LEADS**

### **Page:** Lead Search (Home Page)

**Location:** Click "Lead Search" in left sidebar (or it's the home page)

**What to do:**
1. Enter **City** (e.g., "Kharadi, Pune")
2. Enter **Niche** (e.g., "Gyms", "Restaurants", "Salons")
3. Click **"Search Leads"**

**What happens:**
- App searches Google Places API
- Finds businesses matching your criteria
- Shows results in a table

**Result:**
```
Found 20 Gyms in Kharadi, Pune
┌─────────────────────────────────────────────┐
│ Name          | Address      | Rating | ... │
├─────────────────────────────────────────────┤
│ Gold's Gym    | Kharadi      | 4.5    | ... │
│ Fitness First | Kharadi      | 4.3    | ... │
│ ...           | ...          | ...    | ... │
└─────────────────────────────────────────────┘
```

---

## 💾 **STEP 2: SAVE LEADS**

### **Page:** Lead Search (same page)

**What to do:**
1. Review the search results
2. Click **"Import All Leads"** button (top right)
   OR
   Select specific leads and import

**What happens:**
- Leads are saved to localStorage
- Each lead gets a unique ID
- Status set to "new"

**Result:**
```
✅ Successfully imported 20 leads!
```

---

## 📋 **STEP 3: VIEW LEADS IN LEADS MANAGER**

### **Page:** Leads Manager

**Location:** Click **"Leads Manager"** in left sidebar

**What you see:**
```
┌─────────────────────────────────────────────────────────────┐
│ LEADS MANAGER                                               │
├─────────────────────────────────────────────────────────────┤
│ Total Leads: 20 | New: 20 | Contacted: 0 | Replied: 0      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Gold's Gym                                    ✨ 📧 │   │
│ │ Kharadi, Pune                                       │   │
│ │ Rating: 4.5 ⭐ | Phone: +91-XXX | Website: ...      │   │
│ │ Status: New | Email: ❌ Not enriched                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Fitness First                                 ✨ 📧 │   │
│ │ Kharadi, Pune                                       │   │
│ │ Rating: 4.3 ⭐ | Phone: +91-XXX | Website: ...      │   │
│ │ Status: New | Email: ❌ Not enriched                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **✨ Icon** = Enrich email (find email address)
- **📧 Icon** = Send email (only shows if email exists)
- **Status dropdown** = Change lead status
- **Notes** = Add notes about the lead

---

## ✨ **STEP 4: ENRICH LEADS WITH EMAILS**

### **Page:** Leads Manager (same page)

**What to do:**
1. Find a lead without email (shows "❌ Not enriched")
2. Click the **✨ sparkles icon** next to the lead

**What happens:**
- App sends request to N8N Lead Enrichment workflow
- N8N uses Hunter.io to find email addresses
- Email is added to the lead

**Result:**
```
Before:
Email: ❌ Not enriched

After:
Email: ✅ contact@goldsgym.com (Confidence: 95%)
```

**Important:**
- ✅ **FREE:** 25 email enrichments per month (Hunter.io free tier)
- ✅ Works with your existing N8N workflow
- ✅ Automatic email verification

---

## 📧 **STEP 5: CREATE EMAIL CAMPAIGN**

### **Page:** Email Campaigns

**Location:** Click **"Email Campaigns"** in left sidebar

**What you see:**
```
┌─────────────────────────────────────────────────────────────┐
│ EMAIL CAMPAIGNS                                             │
├─────────────────────────────────────────────────────────────┤
│ [+ Create Campaign]                                         │
├─────────────────────────────────────────────────────────────┤
│ No campaigns yet. Create your first campaign!               │
└─────────────────────────────────────────────────────────────┘
```

**What to do:**

### **5.1: Click "Create Campaign"**

Modal opens:
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE EMAIL CAMPAIGN                                       │
├─────────────────────────────────────────────────────────────┤
│ Campaign Name: [Gym Outreach - Kharadi]                    │
│                                                             │
│ Select Email Sequence:                                      │
│ ○ 3-Step Cold Outreach (Professional)                      │
│ ○ 4-Step Value-First Sequence                              │
│ ○ 5-Step Comprehensive Outreach                            │
│                                                             │
│ Select Leads (Only leads with emails):                      │
│ ☑ Gold's Gym (contact@goldsgym.com)                        │
│ ☑ Fitness First (info@fitnessfirst.com)                    │
│ ☑ Anytime Fitness (hello@anytimefitness.com)               │
│ ...                                                         │
│                                                             │
│ [Select All] [Deselect All]                                │
│                                                             │
│ [Cancel] [Create Campaign]                                 │
└─────────────────────────────────────────────────────────────┘
```

### **5.2: Fill in Details**

1. **Campaign Name:** "Gym Outreach - Kharadi"
2. **Select Sequence:** Choose "3-Step Cold Outreach (Professional)"
3. **Select Leads:** Check the leads you want to email

**What each sequence does:**

**3-Step Professional:**
- Email 1: Introduction (Day 0)
- Email 2: Follow-up (Day 3)
- Email 3: Final touch (Day 7)

**4-Step Value-First:**
- Email 1: Value offer (Day 0)
- Email 2: Case study (Day 3)
- Email 3: Social proof (Day 7)
- Email 4: Final CTA (Day 10)

**5-Step Comprehensive:**
- Email 1: Introduction (Day 0)
- Email 2: Value proposition (Day 2)
- Email 3: Case study (Day 5)
- Email 4: Testimonials (Day 8)
- Email 5: Final offer (Day 12)

### **5.3: Click "Create Campaign"**

**What happens:**
- Campaign is created
- Emails are scheduled for each lead
- Each email is personalized with lead data
- All emails include your tr.ee/itskiranbabu link

**Result:**
```
✅ Campaign created successfully!
✅ Scheduled 9 emails (3 leads × 3 emails each)
```

---

## 🚀 **STEP 6: START CAMPAIGN & SEND EMAILS**

### **Page:** Email Campaigns (same page)

**What you see:**
```
┌─────────────────────────────────────────────────────────────┐
│ EMAIL CAMPAIGNS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Gym Outreach - Kharadi                              │   │
│ │ Status: Draft | Leads: 3 | Emails: 9                │   │
│ │                                                       │   │
│ │ [▶ Start Campaign] [👁 Preview] [📊 Analytics] [🗑]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What to do:**

### **6.1: Preview Emails (Optional)**

Click **"👁 Preview"** to see how emails look:
```
┌─────────────────────────────────────────────────────────────┐
│ EMAIL PREVIEW                                               │
├─────────────────────────────────────────────────────────────┤
│ To: contact@goldsgym.com                                    │
│ Subject: Quick question about Gold's Gym                    │
│                                                             │
│ Hi Gold's Gym team,                                         │
│                                                             │
│ I noticed you're doing great work in Kharadi with a 4.5    │
│ rating! I help gyms like yours [your offering].            │
│                                                             │
│ Would you be open to a quick chat?                          │
│                                                             │
│ Best regards,                                               │
│ [Your Name]                                                 │
│ [Your Company]                                              │
│                                                             │
│ Learn more: https://tr.ee/itskiranbabu                      │
└─────────────────────────────────────────────────────────────┘
```

### **6.2: Start Campaign**

Click **"▶ Start Campaign"**

**What happens:**

**IF N8N CONFIGURED (Production Mode):**
```
✅ Campaign started!
✅ Sending emails via N8N...
✅ Email 1/9 sent to contact@goldsgym.com
✅ Email 2/9 sent to info@fitnessfirst.com
✅ Email 3/9 sent to hello@anytimefitness.com
✅ Remaining emails scheduled for later dates
```

**IF N8N NOT CONFIGURED (Demo Mode):**
```
⚠️ Demo Mode Active
✅ Campaign started!
✅ Emails scheduled but NOT sent
ℹ️ Configure N8N in Settings to send real emails
```

**Email Sending Schedule:**
- **Day 0:** Email 1 sent immediately (or scheduled for next available time)
- **Day 3:** Email 2 sent automatically
- **Day 7:** Email 3 sent automatically

---

## 📊 **STEP 7: TRACK RESULTS IN ANALYTICS**

### **Page:** Email Campaigns (same page)

**What to do:**
Click **"📊 Analytics"** on your campaign

**What you see:**
```
┌─────────────────────────────────────────────────────────────┐
│ CAMPAIGN ANALYTICS - Gym Outreach - Kharadi                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 OVERVIEW                                                 │
│ ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│ │ Scheduled: 9 │ Sent: 3      │ Opened: 2    │ Clicked: 1│ │
│ └──────────────┴──────────────┴──────────────┴───────────┘ │
│                                                             │
│ 📈 PERFORMANCE                                              │
│ Open Rate: 66.7% (2/3)                                      │
│ Click Rate: 33.3% (1/3)                                     │
│ Reply Rate: 0% (0/3)                                        │
│                                                             │
│ 📧 EMAIL LOGS                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ To: contact@goldsgym.com                            │   │
│ │ Subject: Quick question about Gold's Gym            │   │
│ │ Status: ✅ Opened | Sent: 2 hours ago               │   │
│ │ Opens: 2 | Clicks: 1                                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ To: info@fitnessfirst.com                           │   │
│ │ Subject: Quick question about Fitness First         │   │
│ │ Status: ✅ Opened | Sent: 2 hours ago               │   │
│ │ Opens: 1 | Clicks: 0                                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ To: hello@anytimefitness.com                        │   │
│ │ Subject: Quick question about Anytime Fitness       │   │
│ │ Status: ⏰ Sent | Sent: 2 hours ago                 │   │
│ │ Opens: 0 | Clicks: 0                                │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Status Meanings:**
- **⏰ Scheduled** = Email scheduled, not sent yet
- **📤 Sent** = Email sent, not opened yet
- **✅ Opened** = Recipient opened the email
- **🖱 Clicked** = Recipient clicked a link
- **💬 Replied** = Recipient replied (manual update)
- **❌ Failed** = Email failed to send

---

## 🗺️ **VISUAL APP FLOW**

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCALLEAD ENGINE                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. LEAD SEARCH (Home Page)                                  │
│    • Enter city & niche                                     │
│    • Search Google Places                                   │
│    • Import leads                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. LEADS MANAGER                                            │
│    • View all saved leads                                   │
│    • Click ✨ to enrich emails (N8N + Hunter.io)           │
│    • Update lead status                                     │
│    • Add notes                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. EMAIL CAMPAIGNS                                          │
│    • Create campaign                                        │
│    • Select email sequence (3/4/5-step)                     │
│    • Select leads with emails                               │
│    • Preview emails                                         │
│    • Start campaign                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. N8N WORKFLOW (Background)                                │
│    • Receives email data                                    │
│    • Sends via Gmail                                        │
│    • Tracks opens & clicks                                  │
│    • Updates status                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ANALYTICS (Email Campaigns Page)                         │
│    • View campaign performance                              │
│    • Track opens, clicks, replies                           │
│    • Monitor email status                                   │
│    • Optimize campaigns                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 **WHERE TO FIND EVERYTHING**

### **Left Sidebar Navigation:**

```
┌─────────────────────┐
│ 🔍 Lead Search      │ ← Search & import leads
├─────────────────────┤
│ 📋 Leads Manager    │ ← View leads, enrich emails
├─────────────────────┤
│ 📧 Email Campaigns  │ ← Create campaigns, send emails
├─────────────────────┤
│ 📊 Analytics        │ ← (Future: Overall analytics)
├─────────────────────┤
│ ⚙️ Settings         │ ← Configure N8N, user info
└─────────────────────┘
```

---

## 🎯 **QUICK REFERENCE**

### **To Search Leads:**
→ Go to **Lead Search** → Enter city & niche → Click Search → Import

### **To View Saved Leads:**
→ Go to **Leads Manager** → See all imported leads

### **To Get Email Addresses:**
→ Go to **Leads Manager** → Click **✨** icon on each lead

### **To Send Emails:**
→ Go to **Email Campaigns** → Create Campaign → Select leads → Start

### **To Track Results:**
→ Go to **Email Campaigns** → Click **📊 Analytics** on campaign

---

## 💡 **PRO TIPS**

### **1. Enrich Emails First**
Before creating campaigns, enrich all leads with emails:
- Go to Leads Manager
- Click ✨ on each lead
- Wait for email to be found
- Then create campaign

### **2. Start Small**
For your first campaign:
- Select only 3-5 leads
- Use 3-Step sequence
- Test and optimize
- Then scale up

### **3. Monitor Analytics**
Check analytics daily:
- See who opened emails
- See who clicked links
- Follow up with interested leads
- Adjust templates based on performance

### **4. Use Filters**
In Leads Manager:
- Filter by status (New, Contacted, etc.)
- Filter by email (Has email / No email)
- Sort by rating
- Focus on high-quality leads

---

## 🔄 **COMPLETE WORKFLOW EXAMPLE**

### **Scenario: Finding gym clients in Kharadi**

**Day 1:**
1. ✅ Lead Search → "Kharadi, Pune" + "Gyms" → Import 20 leads
2. ✅ Leads Manager → Click ✨ on all 20 leads → Get emails for 15 leads
3. ✅ Email Campaigns → Create "Gym Outreach" campaign
4. ✅ Select 3-Step sequence
5. ✅ Select 10 leads with emails
6. ✅ Start campaign → 10 emails sent immediately

**Day 3:**
- ✅ Automatic: 10 follow-up emails sent

**Day 7:**
- ✅ Automatic: 10 final emails sent

**Day 8:**
- ✅ Check Analytics → 7 opened, 3 clicked, 1 replied
- ✅ Follow up with interested leads
- ✅ Create new campaign for remaining 5 leads

---

## ❓ **COMMON QUESTIONS**

### **Q: Where are my saved leads?**
**A:** Leads Manager page (left sidebar)

### **Q: How do I get email addresses?**
**A:** Leads Manager → Click ✨ icon (uses N8N + Hunter.io)

### **Q: Where do I send emails?**
**A:** Email Campaigns page → Create Campaign → Start

### **Q: Can I send emails from Leads Manager?**
**A:** No, use Email Campaigns page for sending

### **Q: How do I track email performance?**
**A:** Email Campaigns → Click 📊 Analytics on campaign

### **Q: What if lead doesn't have email?**
**A:** Click ✨ in Leads Manager to find email automatically

### **Q: Can I edit email templates?**
**A:** Currently no, but templates are pre-optimized with tr.ee link

### **Q: How many emails can I send?**
**A:** Gmail limit: 500/day. Start with 10-20 per campaign.

---

## 🎉 **SUMMARY**

**Complete Flow:**
1. **Lead Search** → Search & import leads
2. **Leads Manager** → View leads, enrich emails (✨)
3. **Email Campaigns** → Create campaign, send emails
4. **Analytics** → Track performance

**Key Pages:**
- 🔍 **Lead Search** = Find leads
- 📋 **Leads Manager** = Manage leads, get emails
- 📧 **Email Campaigns** = Send emails, track results

**That's it!** Simple 3-page workflow! 🚀
