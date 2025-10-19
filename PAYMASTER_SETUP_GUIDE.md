# 🚀 Guide Complet - Configuration Paymaster Coinbase

## 🎯 **Problème identifié : CORS**
L'API Coinbase CDP bloque les requêtes directes depuis le frontend à cause des restrictions CORS. **Solution** : Serveur proxy backend.

## 📋 **Instructions Étape par Étape**

### **Étape 1: Préparer le Serveur Proxy**
```bash
# Dans un nouveau terminal, dans le dossier du projet
cp proxy-package.json package-proxy.json

# Installer les dépendances du proxy
npm install --prefix . express cors node-fetch@2 dotenv
```

### **Étape 2: Lancer le Serveur Proxy**
```bash
# Terminal 3 (nouveau terminal)
node paymaster-proxy-server.js
```

Tu devrais voir :
```
🚀 Paymaster Proxy Server running on port 3001
📡 Health check: http://localhost:3001/health
🔧 API Key configured: true
🔧 Project ID configured: true
```

### **Étape 3: Vérifier le Health Check**
```bash
# Dans un autre terminal
curl http://localhost:3001/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "paymaster": "Ready", 
  "config": {
    "hasApiKey": true,
    "hasProjectId": true
  }
}
```

### **Étape 4: Tester le Paymaster**
1. **Frontend** : `http://localhost:8081` (déjà en cours)
2. **Proxy** : `http://localhost:3001` (nouvellement lancé)
3. **Aller sur** `/claim` et tester un daily claim
4. **Ouvrir la console** (F12) pour voir les logs détaillés

## 🔍 **Logs à Observer**

### **Console Frontend (F12)**
```
🔧 Paymaster: Tentative de sponsoring transaction...
🔧 Paymaster: API Key: Present
🔧 Paymaster: Project ID: Present
🔧 Paymaster: Using proxy URL: http://localhost:3001/api/paymaster/sponsor
🔧 Paymaster: Attempting proxy API call...
```

### **Console Backend (Terminal 3)**
```
🔧 Proxy: Received paymaster request: {...}
🔧 Proxy: Forwarding to Coinbase API...
🔧 Proxy: Coinbase response: { status: 200, data: {...} }
```

## ⚡ **Architecture Finale**
```
Frontend (8081) → Proxy (3001) → Coinbase API
     ↓              ↓               ↓
  usePaymaster  paymaster-proxy  CDP API
```

## 🎯 **Résultats Attendus**

### **Si Paymaster fonctionne :**
- ✅ Toast : "Daily claim successful! (Gas-free)"
- ✅ Console : "🔧 Paymaster: Simulation du succès pour les tests"

### **Si Paymaster échoue :**
- ⚠️ Toast : "Gas-free failed, proceeding with normal transaction"  
- ✅ MetaMask s'ouvre pour transaction normale

## 🚨 **Troubleshooting**

### **Erreur "EADDRINUSE" (Port 3001 occupé)**
```bash
# Trouver le processus qui utilise le port
lsof -i :3001

# Tuer le processus
kill -9 [PID]

# Ou utiliser un autre port
PORT=3002 node paymaster-proxy-server.js
```

### **Erreur "Missing API credentials"**
Vérifier que les variables dans `.env` sont bien configurées :
```env
VITE_COINBASE_API_KEY=ton_api_key_reel
VITE_COINBASE_PROJECT_ID=ton_project_id_reel
```

## 🎯 **Lancement Complet du Système**

### **Terminal 1: Frontend**
```bash
npm run dev  # Déjà en cours
```

### **Terminal 2: Vide** 
(Disponible pour commandes)

### **Terminal 3: Proxy Paymaster**
```bash
node paymaster-proxy-server.js
```

**🚀 Lance maintenant le proxy et teste ! Le Paymaster devrait enfin fonctionner ! 🎉**