#!/data/data/com.termux/files/usr/bin/bash

echo "=== Forge GUI Diagnostic ==="
echo

echo "[1] Current directory:"
pwd
echo

echo "[2] Files:"
ls -la
echo

echo "[3] Supabase config:"
grep -n "SUPABASE" app.js
echo

echo "[4] Authorization header:"
grep -n "Authorization" app.js
echo

echo "[5] JWT placeholder check:"
grep -n "YOUR_SUPABASE_ANON_KEY" app.js

if [ $? -eq 0 ]; then
  echo
  echo "❌ Placeholder key detected!"
else
  echo
  echo "✅ No placeholder found."
fi

echo
echo "[6] Testing Edge Function..."

curl --max-time 15 -s -L -X POST \
  'https://rgcolnioakzrdtsxwscp.supabase.co/functions/v1/semantic-extract' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"note":"Forge diagnostic test"}' \
  | jq '.function_version'
