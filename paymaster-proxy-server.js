// 🔧 Backend Proxy Simple pour Coinbase Paymaster
// Résout les problèmes CORS en proxifiant les requêtes vers l'API Coinbase

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Configuration Coinbase API
const COINBASE_CONFIG = {
  rpcUrl: 'https://api.developer.coinbase.com/rpc/v1/base',
  apiKey: process.env.VITE_COINBASE_API_KEY,
  projectId: process.env.VITE_COINBASE_PROJECT_ID
};

// Endpoint proxy pour le Paymaster
app.post('/api/paymaster/sponsor', async (req, res) => {
  try {
    console.log('🔧 Proxy: Received paymaster request:', req.body);
    
    // Validation des clés API
    if (!COINBASE_CONFIG.apiKey || !COINBASE_CONFIG.projectId) {
      return res.status(400).json({
        error: 'Missing Coinbase API credentials'
      });
    }

    // Headers pour l'API Coinbase
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${COINBASE_CONFIG.apiKey}`,
      'X-Project-ID': COINBASE_CONFIG.projectId
    };

    console.log('🔧 Proxy: Forwarding to Coinbase API...');
    
    // Forwarding vers l'API Coinbase
    const response = await fetch(COINBASE_CONFIG.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    console.log('🔧 Proxy: Coinbase response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (error) {
    console.error('🔧 Proxy: Error:', error);
    res.status(500).json({
      error: 'Paymaster proxy error',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    paymaster: 'Ready',
    config: {
      hasApiKey: !!COINBASE_CONFIG.apiKey,
      hasProjectId: !!COINBASE_CONFIG.projectId
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Paymaster Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API Key configured: ${!!COINBASE_CONFIG.apiKey}`);
  console.log(`🔧 Project ID configured: ${!!COINBASE_CONFIG.projectId}`);
});