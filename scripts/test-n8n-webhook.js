/**
 * N8N Webhook Test Script
 * 
 * Tests the N8N email sending webhook to ensure it's working correctly
 * before integrating with LocalLead Engine.
 * 
 * Usage:
 *   node scripts/test-n8n-webhook.js
 */

const WEBHOOK_URL = 'https://itskiranbabu1.app.n8n.cloud/webhook/locallead-email-v2';

// Test data
const testEmail = {
  action: 'send_email',
  emailLogId: 'test-' + Date.now(),
  campaignId: 'test-campaign-123',
  leadId: 'test-lead-456',
  to: 'test@example.com', // Change this to your test email
  subject: 'Test Email from LocalLead Engine',
  body: `
Hello,

This is a test email from LocalLead Engine to verify the N8N webhook integration.

If you receive this email, the integration is working correctly!

Best regards,
LocalLead Engine

---
Test ID: ${Date.now()}
Campaign ID: test-campaign-123
Lead ID: test-lead-456
  `.trim(),
  callbackUrl: 'https://locallead-engine.com/api/email-tracking/status',
};

async function testWebhook() {
  console.log('🧪 Testing N8N Webhook...\n');
  console.log('📍 Webhook URL:', WEBHOOK_URL);
  console.log('📧 Test Email Data:', JSON.stringify(testEmail, null, 2));
  console.log('\n⏳ Sending request...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail),
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('\n📄 Response Body (raw):', responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log('\n✅ Response Data (parsed):', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('\n⚠️  Response is not JSON');
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS! Email sent successfully via N8N');
      console.log('✅ Check your inbox at:', testEmail.to);
    } else {
      console.log('\n❌ FAILED! N8N returned error status:', response.status);
    }
  } catch (error) {
    console.error('\n❌ ERROR! Failed to connect to N8N webhook:');
    console.error(error.message);
    console.error('\nPossible issues:');
    console.error('1. N8N workflow is not active');
    console.error('2. Webhook URL is incorrect');
    console.error('3. Network connectivity issues');
    console.error('4. CORS or firewall blocking request');
  }
}

async function testConnectionOnly() {
  console.log('🔌 Testing N8N Connection...\n');
  console.log('📍 Webhook URL:', WEBHOOK_URL);
  console.log('\n⏳ Sending test connection request...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_connection',
        test: true,
        message: 'Connection test from LocalLead Engine',
        timestamp: new Date().toISOString(),
      }),
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (response.ok) {
      console.log('\n✅ SUCCESS! N8N webhook is reachable and responding');
    } else {
      console.log('\n⚠️  N8N webhook responded but with error status:', response.status);
    }
  } catch (error) {
    console.error('\n❌ ERROR! Cannot connect to N8N webhook:');
    console.error(error.message);
  }
}

async function testValidation() {
  console.log('🔍 Testing N8N Validation...\n');
  console.log('📍 Webhook URL:', WEBHOOK_URL);
  console.log('\n⏳ Sending invalid data (missing required fields)...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_email',
        // Missing: to, subject, body
      }),
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('\n📄 Response Body:', responseText);

    if (response.status === 400 || response.status === 422) {
      console.log('\n✅ SUCCESS! N8N validation is working (rejected invalid data)');
    } else {
      console.log('\n⚠️  Unexpected response. Expected 400/422 for invalid data.');
    }
  } catch (error) {
    console.error('\n❌ ERROR!', error.message);
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  N8N WEBHOOK TEST SUITE');
  console.log('  LocalLead Engine Email Integration');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Connection
  await testConnectionOnly();
  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 2: Validation
  await testValidation();
  console.log('\n' + '─'.repeat(60) + '\n');

  // Test 3: Full email send
  console.log('⚠️  IMPORTANT: Update testEmail.to with your email address before running full test!\n');
  
  const shouldSendEmail = process.argv.includes('--send');
  
  if (shouldSendEmail) {
    await testWebhook();
  } else {
    console.log('ℹ️  Skipping full email send test.');
    console.log('ℹ️  To test actual email sending, run:');
    console.log('   node scripts/test-n8n-webhook.js --send');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

main();
