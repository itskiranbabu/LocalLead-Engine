# 🔗 N8N Integration Quick Reference

## What is N8N Integration?

N8N integration allows LocalLead Engine to send emails through your own N8N workflow automation instance, giving you complete control over email sending logic, providers, and customization.

## Benefits

✅ **Flexibility**: Modify email logic without code changes  
✅ **Multiple Providers**: Switch between Gmail, SMTP, SendGrid, etc.  
✅ **Visual Workflow**: See and edit email flow visually  
✅ **Error Handling**: Built-in retry and error handling  
✅ **Cost Effective**: No third-party API costs  
✅ **Monitoring**: Visual execution logs  

## Quick Setup (5 Minutes)

### 1. Import Workflow
- Download `n8n-workflow.json` from repository
- Import into your N8N instance
- Activate workflow

### 2. Configure Gmail
- Set up Google OAuth in N8N
- Connect your Gmail account
- Test sending

### 3. Update Environment Variables
```env
VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/locallead-send-email
VITE_USE_N8N=true
```

### 4. Deploy
- Add variables to Vercel
- Redeploy application
- Test email sending

## Full Documentation

See [N8N_SETUP_GUIDE.md](../N8N_SETUP_GUIDE.md) for complete setup instructions.

## Fallback Behavior

If N8N is unavailable, the system automatically falls back to Supabase Edge Functions. No manual intervention required.

## Support

- N8N Docs: https://docs.n8n.io
- LocalLead Issues: https://github.com/itskiranbabu/LocalLead-Engine/issues