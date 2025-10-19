# 🚀 Implémentation Vercel Function - Paymaster

## 📁 **Structure de fichiers à créer**

### **1. Vercel Function : `pages/api/paymaster-sponsor.ts`**
```typescript
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔧 Vercel Function: Received paymaster request')
    
    // Validation des variables d'environnement
    const apiKey = process.env.COINBASE_API_KEY
    const projectId = process.env.COINBASE_PROJECT_ID
    
    if (!apiKey || !projectId) {
      console.error('🔧 Vercel Function: Missing environment variables')
      return res.status(500).json({
        error: 'Missing Coinbase API credentials'
      })
    }

    // Headers pour l'API Coinbase
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Project-ID': projectId
    }

    console.log('🔧 Vercel Function: Forwarding to Coinbase API...')
    
    // Forward vers l'API Coinbase
    const response = await fetch('https://api.developer.coinbase.com/rpc/v1/base', {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    })

    const data = await response.json()
    
    console.log('🔧 Vercel Function: Coinbase response:', {
      status: response.status,
      success: response.ok
    })

    if (!response.ok) {
      console.error('🔧 Vercel Function: Coinbase API error:', data)
      return res.status(response.status).json(data)
    }

    res.status(200).json(data)

  } catch (error) {
    console.error('🔧 Vercel Function: Error:', error)
    res.status(500).json({
      error: 'Paymaster function error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
```

### **2. Configuration Vercel : `vercel.json`**
```json
{
  "functions": {
    "pages/api/paymaster-sponsor.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "COINBASE_API_KEY": "@coinbase-api-key",
    "COINBASE_PROJECT_ID": "@coinbase-project-id"
  }
}
```

### **3. Variables d'environnement Vercel**
```bash
# Via Vercel CLI
vercel env add COINBASE_API_KEY
vercel env add COINBASE_PROJECT_ID

# Ou via dashboard Vercel
# Project Settings → Environment Variables
```

## 🔧 **Modifications nécessaires**

### **Modifier `src/hooks/usePaymaster.ts`**
```typescript
// Ligne 230 - Changer l'URL du proxy
const proxyUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api/paymaster/sponsor'  // Dev avec serveur local
  : '/api/paymaster-sponsor'                       // Production avec Vercel Function
```

### **Ajouter variables d'environnement production dans `.env.production`**
```env
# .env.production
VITE_CHAIN_ID=8453
VITE_RPC_URL=https://mainnet.base.org
VITE_WALLETCONNECT_PROJECT_ID=b4kTm7Z6gzOyREswS8RoAWN603hNaWzX
VITE_ONCHAINKIT_API_KEY=b4kTm7Z6gzOyREswS8RoAWN603hNaWzX

# Variables Paymaster (seront définies sur Vercel)
# COINBASE_API_KEY et COINBASE_PROJECT_ID sont des secrets serveur
```

## 🚀 **Instructions de déploiement**

### **Étape 1: Créer les fichiers**
```bash
# Créer le dossier pages/api
mkdir -p pages/api

# Créer le fichier paymaster-sponsor.ts (copier le code ci-dessus)
# Créer vercel.json (copier la config ci-dessus)
```

### **Étape 2: Installer les dépendances Next.js**
```bash
npm install next @types/node
```

### **Étape 3: Configurer les variables Vercel**
```bash
# Login Vercel
vercel login

# Ajouter les secrets
vercel env add COINBASE_API_KEY
# Coller: ton_api_key_coinbase

vercel env add COINBASE_PROJECT_ID  
# Coller: ton_project_id_coinbase
```

### **Étape 4: Déployer**
```bash
# Déploiement production
vercel --prod
```

## 🎯 **Architecture finale**

### **Développement**
```
Frontend (Vite:8081) → Proxy Local (3001) → Coinbase API
```

### **Production**
```
Frontend (Vercel) → Vercel Function → Coinbase API
```

## ✅ **Avantages de cette solution**

- ✅ **Zéro serveur** à maintenir
- ✅ **Auto-scaling** Vercel
- ✅ **HTTPS natif**
- ✅ **Variables d'env sécurisées**
- ✅ **Coût minimal** (gratuit jusqu'à 100k requêtes/mois)
- ✅ **Deploy avec le frontend**

## 🧪 **Test de la fonction**

Une fois déployée, tu peux tester :
```bash
curl -X POST https://ton-app.vercel.app/api/paymaster-sponsor \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"pm_test"}'
```

**🚀 Cette solution élimine complètement le besoin d'un serveur dédié ! Veux-tu que je passe en mode Code pour créer ces fichiers ?**