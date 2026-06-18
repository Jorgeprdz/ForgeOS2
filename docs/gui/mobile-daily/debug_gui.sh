#!/data/data/com.termux/files/usr/bin/bash

echo "===================================="
echo "      FORGE GUI DIAGNOSTIC"
echo "===================================="
echo

echo "[1] Directory"
pwd
echo

echo "[2] Files"
ls -la
echo

echo "[3] Supabase Config"
grep -n "SUPABASE" app.js
echo

echo "[4] Authorization Header"
grep -n "Authorization" app.js
echo

echo "[5] API Key Header"
grep -n "apikey" app.js
echo

echo "[6] Search for hardcoded JWT errors"
grep -n "Invalid JWT" app.js index.html
echo

echo "[7] Search for error rendering"
grep -n "error.textContent" app.js
grep -n "innerText.*error" app.js
grep -n "innerHTML.*error" app.js
echo

echo "[8] Search for fetch"
grep -n "fetch(" app.js
echo

echo "[9] Check placeholder"
grep -n "YOUR_SUPABASE_ANON_KEY" app.js

if [ $? -eq 0 ]; then
    echo "❌ Placeholder detected"
else
    echo "✅ No placeholder found"
fi

echo
echo "[10] Test Edge Function"

curl --max-time 15 -s -L -X POST \
  'https://rgcolnioakzrdtsxwscp.supabase.co/functions/v1/semantic-extract' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  --data '{"note":"Forge diagnostic"}' \
  | jq '.function_version'

echo
echo "===================================="
echo "Diagnostic complete."
echo "===================================="
