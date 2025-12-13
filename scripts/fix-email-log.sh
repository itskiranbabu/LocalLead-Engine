#!/bin/bash

# Script to add 'to' field to EmailLog interface and scheduleEmails function

FILE="services/emailCampaignService.ts"

echo "Fixing EmailLog interface and scheduleEmails function..."

# Backup original file
cp "$FILE" "$FILE.backup"

# Fix 1: Add 'to' field to EmailLog interface (after sequenceStepId line)
sed -i '/sequenceStepId: string;/a\  to: string; // Recipient email address' "$FILE"

# Fix 2: Add 'to: lead.email,' to createEmailLog call (after leadId line)
sed -i '/leadId: lead.id,/a\          to: lead.email,' "$FILE"

echo "✅ Fixed! Changes made:"
echo "  1. Added 'to' field to EmailLog interface"
echo "  2. Added 'to: lead.email' to scheduleEmails function"
echo ""
echo "Backup saved to: $FILE.backup"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff $FILE"
echo "  2. Commit: git add $FILE && git commit -m 'fix: Add recipient email to EmailLog'"
echo "  3. Push: git push origin main"
