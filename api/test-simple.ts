// =============================
// Simple Test API Endpoint
// =============================

export default async function handler(req: any, res: any) {
  console.log('=== SIMPLE TEST API START ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));
  
  // Set JSON response header immediately
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  try {
    console.log('Inside try block');
    
    const response = {
      success: true,
      message: 'Simple test works',
      timestamp: new Date().toISOString(),
      method: req.method,
      hasBody: !!req.body
    };
    
    console.log('Response to send:', response);
    console.log('=== SIMPLE TEST API END SUCCESS ===');
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error('=== ERROR CAUGHT ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error name:', error?.name);
    console.error('Error stack:', error?.stack);
    console.error('=== ERROR END ===');
    
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
}
