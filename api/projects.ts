// =============================
// Projects API Endpoint - SIMPLIFIED FOR DEBUGGING
// =============================

export default async function handler(req: any, res: any) {
  // Log everything at the start
  console.log('=== API PROJECTS START ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));
  
  // Set JSON response header immediately
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  // Wrap EVERYTHING in try-catch
  try {
    console.log('Inside try block');
    
    // Handle GET request - Return list of projects
    if (req.method === 'GET') {
      console.log('📋 Fetching projects list...');
      
      // TODO: Replace with actual database query
      // For now, return mock data
      const projects = [
        {
          id: '1',
          name: 'Office Renovation',
          description: 'Complete office renovation project',
          status: 'In Progress',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          budget: 150000,
          createdAt: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          name: 'New Building Construction',
          description: 'Construction of new commercial building',
          status: 'Planning',
          startDate: '2024-03-01',
          endDate: '2024-12-31',
          budget: 2500000,
          createdAt: '2024-02-01T10:00:00Z'
        },
        {
          id: '3',
          name: 'Bridge Repair',
          description: 'Structural repairs to main bridge',
          status: 'Active',
          startDate: '2024-02-01',
          endDate: '2024-05-15',
          budget: 500000,
          createdAt: '2024-01-20T10:00:00Z'
        }
      ];
      
      console.log('✅ Returning projects:', projects.length);
      
      return res.status(200).json({
        success: true,
        data: projects,
        count: projects.length
      });
    }
    
    // Handle POST request - Create new project
    if (req.method === 'POST') {
      console.log('📝 Creating new project...');
      
      // Log each step
      console.log('Step 1: Validating request body');
      const projectData = req.body;
      
      if (!projectData) {
        console.log('No request body');
        return res.status(400).json({
          success: false,
          error: 'Request body is required'
        });
      }
      
      console.log('Step 2: Checking required fields');
      if (!projectData.name) {
        console.log('Missing project name');
        return res.status(400).json({
          success: false,
          error: 'Project name is required'
        });
      }
      
      console.log('Step 3: Project data validated:', projectData);
      
      // TEMPORARY: Just return success without any database operations
      console.log('Step 4: Returning success response');
      const response = {
        success: true,
        message: 'Project received (basic implementation)',
        data: {
          id: `proj_${Date.now()}`,
          ...projectData,
          createdAt: new Date().toISOString()
        }
      };
      
      console.log('Response to send:', response);
      console.log('=== API PROJECTS END SUCCESS ===');
      
      return res.status(201).json(response);
    }
    
    // Method not allowed
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
    
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