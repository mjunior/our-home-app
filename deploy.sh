#!/bin/bash

# Script de deploy automático
# Realiza uma chamada para o webhook de deploy

URL="http://72.60.27.137:3000/api/deploy/65e4269a4d5c04f704d2b85ab3e11a373d34760220aaabf2"

echo "🚀 Iniciando deploy..."
curl -X POST "$URL"
echo -e "\n✅ Deploy disparado com sucesso!"
