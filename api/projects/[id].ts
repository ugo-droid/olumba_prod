// =============================
// Single Project API Endpoint
// =============================

export default async function handler(req: any, res: any) {
  const { id } = req.query;
  
  console.log('📥 Single project API called:', req.method, 'ID:', id);
  
  // Set headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  try {
    // GET - Fetch single project by ID
    if (req.method === 'GET') {
      console.log('📋 Fetching project with ID:', id);
      
      // TODO: Replace with actual database query
      // For now, return mock data based on ID
      const mockProjects = {
        '1': {
          id: '1',
          name: 'Office Renovation',
          description: 'Complete office renovation project with modern design and energy-efficient systems',
          status: 'In Progress',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          budget: 150000,
          location: '123 Main St, New York, NY',
          client: 'Acme Corporation',
          projectManager: 'John Smith',
          team: ['Alice Johnson', 'Bob Wilson', 'Carol Davis'],
          progress: 65,
          notes: 'Project is progressing well. Currently on schedule with minor delays in electrical work.',
          address: '123 Main St, New York, NY',
          discipline: 'Architecture',
          start_date: '2024-01-15',
          deadline: '2024-06-30',
          total_tasks: 15,
          completed_tasks: 10,
          document_count: 8,
          members: [
            { user_id: '1', full_name: 'Alice Johnson', role: 'Architect' },
            { user_id: '2', full_name: 'Bob Wilson', role: 'Engineer' },
            { user_id: '3', full_name: 'Carol Davis', role: 'Project Manager' }
          ],
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-03-15T14:30:00Z'
        },
        '2': {
          id: '2',
          name: 'New Building Construction',
          description: 'Construction of new commercial building with sustainable features',
          status: 'Planning',
          startDate: '2024-03-01',
          endDate: '2024-12-31',
          budget: 2500000,
          location: '456 Oak Ave, Los Angeles, CA',
          client: 'City Development Corp',
          projectManager: 'Sarah Lee',
          team: ['David Brown', 'Emma White', 'Frank Green'],
          progress: 15,
          notes: 'In planning phase. Permits pending approval from city planning department.',
          address: '456 Oak Ave, Los Angeles, CA',
          discipline: 'Construction',
          start_date: '2024-03-01',
          deadline: '2024-12-31',
          total_tasks: 25,
          completed_tasks: 4,
          document_count: 12,
          members: [
            { user_id: '4', full_name: 'David Brown', role: 'Construction Manager' },
            { user_id: '5', full_name: 'Emma White', role: 'Structural Engineer' },
            { user_id: '6', full_name: 'Frank Green', role: 'Project Coordinator' }
          ],
          createdAt: '2024-02-01T10:00:00Z',
          updatedAt: '2024-02-20T09:15:00Z'
        },
        '3': {
          id: '3',
          name: 'Bridge Repair',
          description: 'Structural repairs to main bridge including deck replacement and seismic upgrades',
          status: 'Active',
          startDate: '2024-02-01',
          endDate: '2024-05-15',
          budget: 500000,
          location: 'Highway 101 Bridge',
          client: 'State Department of Transportation',
          projectManager: 'Mike Chen',
          team: ['Grace Taylor', 'Henry Martinez', 'Iris Anderson'],
          progress: 45,
          notes: 'Weather delays expected in March. Traffic management plan approved.',
          address: 'Highway 101 Bridge, California',
          discipline: 'Civil Engineering',
          start_date: '2024-02-01',
          deadline: '2024-05-15',
          total_tasks: 12,
          completed_tasks: 5,
          document_count: 6,
          members: [
            { user_id: '7', full_name: 'Grace Taylor', role: 'Civil Engineer' },
            { user_id: '8', full_name: 'Henry Martinez', role: 'Safety Coordinator' },
            { user_id: '9', full_name: 'Iris Anderson', role: 'Quality Inspector' }
          ],
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-03-01T11:20:00Z'
        }
      };
      
      const project = mockProjects[id as keyof typeof mockProjects];
      
      if (!project) {
        console.log('❌ Project not found:', id);
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      console.log('✅ Returning project:', project.name);
      
      return res.status(200).json({
        success: true,
        data: project
      });
    }
    
    // PUT - Update project
    if (req.method === 'PUT') {
      console.log('📝 Updating project:', id);
      
      const updates = req.body;
      
      // TODO: Update in database
      
      return res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { id, ...updates }
      });
    }
    
    // DELETE - Delete project
    if (req.method === 'DELETE') {
      console.log('🗑️ Deleting project:', id);
      
      // TODO: Delete from database
      
      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    }
    
    // Method not allowed
    console.log('Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
