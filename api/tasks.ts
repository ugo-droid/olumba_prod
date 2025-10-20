// =============================
// Tasks API Endpoint - SIMPLIFIED (NO AUTH)
// =============================

export default async function handler(req: any, res: any) {
  // Log everything at the start
  console.log('=== API TASKS START ===');
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
  
  // Wrap EVERYTHING in try-catch
  try {
    console.log('Inside try block');
    
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }
    
    console.log('Method is POST, proceeding...');
    
    // Log each step
    console.log('Step 1: Validating request body');
    const taskData = req.body;
    
    if (!taskData) {
      console.log('No request body');
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }
    
    console.log('Step 2: Checking required fields');
    if (!taskData.title) {
      console.log('Missing task title');
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }
    
    console.log('Step 3: Task data validated:', taskData);
    
    // TEMPORARY: Just return success without any database operations
    console.log('Step 4: Returning success response');
    const response = {
      success: true,
      message: 'Task received (basic implementation)',
      data: {
        id: `task_${Date.now()}`,
        ...taskData,
        createdAt: new Date().toISOString()
      }
    };
    
    console.log('Response to send:', response);
    console.log('=== API TASKS END SUCCESS ===');
    
    return res.status(201).json(response);
    
  } catch (error: any) {
    // Maximum error logging
    console.error('=== ERROR CAUGHT ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error name:', error?.name);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('=== ERROR END ===');
    
    // ALWAYS return JSON for errors
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}