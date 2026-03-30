#!/bin/bash

# Load environment variables
set -a
source /Users/kennyasooye/serviceai-app/backend/.env
set +a

# Check if required variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing Supabase URL or Anon Key in .env file"
    exit 1
fi

# Remove any whitespace from the values
SUPABASE_URL=$(echo $VITE_SUPABASE_URL | tr -d ' ')
SUPABASE_KEY=$(echo $VITE_SUPABASE_ANON_KEY | tr -d ' ')

echo "🔄 Testing Supabase connection to: $SUPABASE_URL"

# Test the connection using curl
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/")

if [ "$RESPONSE" -eq 200 ]; then
    echo "✅ Successfully connected to Supabase!"
    echo "   Status Code: $RESPONSE"
    echo "   You can now run your database migrations."
else
    echo "❌ Failed to connect to Supabase"
    echo "   Status Code: $RESPONSE"
    echo "   Please check your .env file and internet connection."
fi
