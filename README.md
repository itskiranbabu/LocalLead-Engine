# 🚀 LocalLead Engine

**Production-ready SaaS platform for local business lead generation and automated outreach.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itskiranbabu/LocalLead-Engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Features
- 🔍 **Lead Discovery**: Search and discover local businesses using Google Places API
- 📊 **Lead Management**: Organize, tag, and track leads with custom fields
- ✉️ **Email Campaigns**: Send personalized cold emails at scale
- 📝 **Template System**: Create reusable email templates with variables
- 📈 **Analytics Dashboard**: Track open rates, responses, and conversions
- 🤖 **AI-Powered**: Gemini AI for content generation and personalization

### Advanced Features (New!)
- 🎯 **AI Lead Scoring**: Automatically score leads based on multiple factors
- 💬 **Sentiment Analysis**: Analyze email replies with AI
- 🔄 **Follow-up Sequences**: Auto-generate multi-step email sequences
- 📧 **Hyper-Personalization**: AI-powered email customization
- 📊 **Deep Research**: AI-driven lead enrichment and insights

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Email**: Resend API
- **AI**: Google Gemini Pro
- **Deployment**: Vercel
- **Styling**: Tailwind CSS + Lucide Icons

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for email sending)
- Google Cloud account (for Gemini AI)

### 1. Clone the Repository

```bash
git clone https://github.com/itskiranbabu/LocalLead-Engine.git
cd LocalLead-Engine
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 4. Set Up Supabase

#### A. Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  category TEXT,
  business_type TEXT,
  rating NUMERIC,
  review_count INTEGER,
  status TEXT DEFAULT 'new',
  campaign_id UUID,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach logs table
CREATE TABLE outreach_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  lead_id UUID REFERENCES leads,
  campaign_id UUID REFERENCES campaigns,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  provider_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own templates" ON email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON email_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON outreach_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON outreach_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### B. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Deploy function
supabase functions deploy send-email
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configuration

### Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get your API key
4. Add to Supabase secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxx
   ```

### Google Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Connect Repository**
   ```bash
   vercel
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_APP_URL`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Post-Deployment Checklist

- ✅ Test authentication
- ✅ Test lead search
- ✅ Test email sending
- ✅ Verify CORS settings
- ✅ Check error logging
- ✅ Monitor performance

---

## 📖 Usage Guide

### 1. Create Your Profile

1. Sign up with email/password
2. Complete your profile (name, company)
3. Configure email settings

### 2. Search for Leads

1. Go to **Lead Search**
2. Enter city and business category
3. Review results
4. Save leads to your database

### 3. Create Email Templates

1. Go to **Templates**
2. Click **"New Template"**
3. Use variables: `{{contact_name}}`, `{{business_name}}`, `{{city}}`
4. Save template

### 4. Launch Campaign

1. Go to **Outreach**
2. Select leads
3. Choose template
4. Customize if needed
5. Send emails

### 5. Track Performance

1. Go to **Dashboard**
2. View analytics
3. Monitor responses
4. Adjust strategy

---

## 🔧 Troubleshooting

### Email Sending Fails

**Problem**: CORS error or email not sending

**Solution**:
1. Check Resend API key in Supabase secrets
2. Verify domain in Resend dashboard
3. Check Edge Function logs:
   ```bash
   supabase functions logs send-email
   ```

### Authentication Issues

**Problem**: Can't log in

**Solution**:
1. Check Supabase URL and keys
2. Verify email confirmation settings
3. Check browser console for errors

### AI Features Not Working

**Problem**: Gemini API errors

**Solution**:
1. Verify API key is correct
2. Check API quota limits
3. Review error messages in console

---

## 📊 API Documentation

### Edge Function: send-email

**Endpoint**: `https://your-project.supabase.co/functions/v1/send-email`

**Method**: POST

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "leadIds": ["uuid1", "uuid2"],
  "templateId": "uuid",
  "campaignId": "uuid",
  "customSubject": "Optional custom subject",
  "customBody": "Optional custom body"
}
```

**Response**:
```json
{
  "success": true,
  "total": 2,
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "id": "uuid1",
      "email": "contact@business.com",
      "status": "sent",
      "provider_id": "resend_id"
    }
  ]
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend infrastructure
- [Resend](https://resend.com) for email delivery
- [Google Gemini](https://ai.google.dev) for AI capabilities
- [Vercel](https://vercel.com) for hosting

---

## 📞 Support

- **Documentation**: [View Enhancement Plan](ENHANCEMENT_PLAN.md)
- **Issues**: [GitHub Issues](https://github.com/itskiranbabu/LocalLead-Engine/issues)
- **Email**: support@locallead.com

---

## 🗺️ Roadmap

See [ENHANCEMENT_PLAN.md](ENHANCEMENT_PLAN.md) for detailed roadmap.

**Coming Soon**:
- ✅ AI Lead Scoring (DONE)
- ✅ Sentiment Analysis (DONE)
- 🔄 Multi-channel outreach (WhatsApp, LinkedIn)
- 🔄 Advanced analytics dashboard
- 🔄 Team collaboration features
- 🔄 Mobile app

---

**Built with ❤️ by [Kiran Babu](https://github.com/itskiranbabu)**

**Star ⭐ this repo if you find it helpful!**