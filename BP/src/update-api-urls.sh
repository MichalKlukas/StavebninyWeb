#!/bin/bash

# Vytvořit konfigurační soubor
mkdir -p config
cat > config/api.js << 'EOL'
// config/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;
EOL

# Seznam souborů k aktualizaci
FILES=(
  "./views/registrace.vue"
  "./views/upravitProfil.vue"
  "./views/overeniMailu.vue"
  "./views/prihlaseni.vue"
  "./views/Poptávka.vue"
  "./views/mateDotaz.vue"
  "./views/zmenaHesla.vue"
)

# Přidat import do každého souboru
for file in "${FILES[@]}"; do
  if grep -q "import API_URL from '@/config/api.js'" "$file"; then
    echo "Import již existuje v $file"
  else
    sed -i '1s/^/import API_URL from '"'"'@\/config\/api.js'"'"';\n/' "$file"
  fi
  
  # Nahradit všechny výskyty localhost:5000
  sed -i "s|http://localhost:5000|`${API_URL}`|g" "$file"
done

echo "Dokončeno!"
