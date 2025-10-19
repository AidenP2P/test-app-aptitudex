# 🚀 Options de Déploiement Paymaster - Production

## 🎯 **Problème :**
Éviter de maintenir un serveur dédié juste pour le proxy Paymaster.

## 📋 **Solutions Recommandées**

### **Option 1: Vercel Functions (Recommandée) ⭐**
```typescript
// api/paymaster-sponsor.ts (Vercel Function)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch('https://api.developer.coinbase.com/rpc/v1/base', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COINBASE_API_KEY}`,
        'X-Project-ID': process.env.COINBASE_PROJECT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    return NextResponse.json({ error: 'Paymaster error' }, { status: 500 })
  }
}
```

**Avantages :**
- ✅ Pas de serveur à maintenir
- ✅ Auto-scaling
- ✅ Gratuit jusqu'à 100k requêtes/mois
- ✅ HTTPS natif

### **Option 2: Netlify Functions**
```javascript
// netlify/functions/paymaster-sponsor.js
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    
    const response = await fetch('https://api.developer.coinbase.com/rpc/v1/base', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COINBASE_API_KEY}`,
        'X-Project-ID': process.env.COINBASE_PROJECT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Paymaster error' })
    }
  }
}
```

### **Option 3: Désactiver Paymaster (Simple)**
```typescript
// En production, désactiver complètement le Paymaster
const ENABLE_PAYMASTER = process.env.NODE_ENV === 'development'

// Dans usePaymaster.ts
static isPaymasterConfigured(): boolean {
  if (!ENABLE_PAYMASTER) return false
  return Boolean(
    PAYMASTER_CONFIG.rpcUrl &&
    PAYMASTER_CONFIG.apiKey &&
    PAYMASTER_CONFIG.projectId
  )
}
```

## 🎯 **Recommandation de Déploiement**

### **Phase 1: Vercel Functions (Immédiat)**
```bash
# Structure du projet
├── pages/api/paymaster-sponsor.ts  # Fonction serverless
├── src/hooks/usePaymaster.ts       # Modifié pour utiliser /api/
└── vercel.json                     # Configuration
```

### **Phase 2: Configuration Environnement**
```bash
# Variables Vercel
COINBASE_API_KEY=your_api_key
COINBASE_PROJECT_ID=your_project_id
```

### **Phase 3: Modifier l'URL dans usePaymaster**
```typescript
// usePaymaster.ts - Production
const proxyUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api/paymaster/sponsor'  // Dev
  : '/api/paymaster-sponsor'                       // Production
```

## 🏗️ **Architecture de Déploiement**

### **Développement**
```
Frontend (Vite) → Serveur Proxy Local → Coinbase API
```

### **Production**
```
Frontend (Vercel) → Vercel Function → Coinbase API
```

## ⚡ **Migration Simple**

### **Étape 1: Créer la Vercel Function**
```bash
mkdir -p pages/api
# Copier le code de la fonction ci-dessus
```

### **Étape 2: Modifier usePaymaster.ts**
```typescript
const proxyUrl = `/api/paymaster-sponsor`
```

### **Étape 3: Déployer sur Vercel**
```bash
vercel --prod
```

## 🎯 **Solution Recommandée : Vercel Functions**

**Pourquoi ?**
- ✅ **Zéro maintenance** serveur
- ✅ **Coût minimal** (gratuit pour most use cases)
- ✅ **Déploiement simple** avec le frontend
- ✅ **Auto-scaling**
- ✅ **HTTPS natif**

**🚀 Veux-tu que je crée la Vercel Function maintenant ? C'est la solution la plus simple pour la production !**