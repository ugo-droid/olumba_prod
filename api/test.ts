// =============================
// Test API Endpoint
// =============================
// Simple test endpoint to verify API functionality

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🧪 Test API endpoint called');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    const response = {
      success: true,
      message: 'Test API endpoint is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer ***' : 'None'
      }
    };
    
    console.log('✅ Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Test API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
