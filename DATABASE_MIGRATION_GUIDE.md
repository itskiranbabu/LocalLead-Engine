# 🗄️ Database Migration Guide

## Problem

The N8N webhook URLs and Hunter API key are not being saved because the database is missing the required columns.

## Solution

Run the SQL migration to add the missing columns to your Supabase `profiles` table.

---

## 📋 Step-by-Step Instructions

### **Option 1: Supabase Dashboard (Recommended)**

1. **Go to your Supabase project dashboard**
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and paste this SQL:**

```sql
-- Add N8N webhook URLs and API keys to profiles table

-- Add n8n_webhook_url column for email sending
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;

-- Add n8n_enrichment_webhook column for lead enrichment
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS n8n_enrichment_webhook TEXT;

-- Add hunter_api_key column for email discovery
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hunter_api_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.n8n_webhook_url IS 'N8N workflow webhook URL for sending emails via SMTP';
COMMENT ON COLUMN profiles.n8n_enrichment_webhook IS 'N8N workflow webhook URL for automated lead enrichment';
COMMENT ON COLUMN profiles.hunter_api_key IS 'Hunter.io API key for email address discovery';
```

4. **Run the query**
   - Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - You should see: "Success. No rows returned"

5. **Verify the columns were added**
   - Go to **Table Editor** in the left sidebar
   - Select the **profiles** table
   - You should see the new columns: `n8n_webhook_url`, `n8n_enrichment_webhook`, `hunter_api_key`

---

### **Option 2: Supabase CLI**

If you have the Supabase CLI installed:

```bash
# Navigate to your project
cd LocalLead-Engine

# Run the migration
supabase db push

# Or apply the migration file directly
supabase db execute -f supabase/migrations/add_n8n_webhook_columns.sql
```

---

## ✅ Verification

After running the migration:

1. **Go to your app's Settings page**
2. **Enter your N8N webhook URL:**
   ```
   https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2
   ```
3. **Click Save**
4. **Refresh the page**
5. **The webhook URL should still be there!** ✨

---

## 🔍 What Changed?

### **Code Changes:**

1. **`services/repositories/profileRepository.ts`**
   - Now saves `n8nWebhookUrl`, `n8nEnrichmentWebhook`, and `hunterApiKey` to database
   - Retrieves these fields when loading settings

### **Database Changes:**

Added 3 new columns to the `profiles` table:
- `n8n_webhook_url` (TEXT) - Email sending webhook
- `n8n_enrichment_webhook` (TEXT) - Lead enrichment webhook  
- `hunter_api_key` (TEXT) - Hunter.io API key

---

## 🚨 Troubleshooting

### **Error: "column already exists"**

This is fine! It means the columns were already added. The migration uses `IF NOT EXISTS` to prevent errors.

### **Error: "permission denied"**

Make sure you're logged in to Supabase and have admin access to the project.

### **Settings still not saving**

1. Check browser console for errors (F12 → Console tab)
2. Verify you're logged in (check top-right corner of Settings page)
3. Try logging out and back in
4. Clear browser cache and reload

---

## 📝 Next Steps

Once the migration is complete:

1. ✅ Add your N8N webhook URL in Settings
2. ✅ Add your Hunter.io API key in Settings  
3. ✅ Test email sending by starting a campaign
4. ✅ Verify emails are being sent via N8N

---

## 🎯 Quick Test

To verify everything works:

1. Go to **Email Campaigns**
2. Create a test campaign with 1-2 leads
3. Click **Start Campaign**
4. Check N8N workflow execution logs
5. Verify emails were sent

---

**Need help?** Check the N8N logs or browser console for detailed error messages.
