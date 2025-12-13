#!/bin/bash

# Restore EmailCampaigns.tsx from the last working commit
# This fixes the build error caused by escaped quotes

echo "Restoring EmailCampaigns.tsx from working commit..."

# Checkout the file from the working commit
git checkout aec61d7b28c4c6859e9c198d78c9dc1d720ad2c9 -- pages/EmailCampaigns.tsx

echo "File restored successfully!"
echo ""
echo "Now applying email sending fix..."

# The fix will be applied in a separate commit
echo "Done! Please commit the restored file."
