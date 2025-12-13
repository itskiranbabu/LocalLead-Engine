-- Add N8N webhook URLs and API keys to profiles table
-- Run this migration in your Supabase SQL Editor

-- Add n8n_webhook_url column for email sending
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;

-- Add n8n_enrichment_webhook column for lead enrichment
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS n8n_enrichment_webhook TEXT;

-- Add hunter_api_key column for email discovery
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hunter_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.n8n_webhook_url IS 'N8N workflow webhook URL for sending emails via SMTP';
COMMENT ON COLUMN profiles.n8n_enrichment_webhook IS 'N8N workflow webhook URL for automated lead enrichment';
COMMENT ON COLUMN profiles.hunter_api_key IS 'Hunter.io API key for email address discovery';
