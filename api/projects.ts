// =============================
// Projects API Endpoint - WITH FALLBACK TO MOCK DATA
// =============================

// Mock data fallback when Supabase is not configured
const mockProjects = [
  {
    id: '1',
    name: 'Office Renovation',
    description: 'Complete office renovation project',
    status: 'In Progress',
    start_date: '2024-01-15',
    end_date: '2024-06-30',
    deadline: '2024-06-30',
    budget: 150000,
    address: '123 Main Street, City, State',
    discipline: 'Architecture',
    project_manager: 'John Smith',
    client: 'ABC Corporation',
    location: 'Downtown',
    notes: 'High priority project with tight deadline',
    progress: 45,
    total_tasks: 12,
    completed_tasks: 5,
    document_count: 8,
    members: [
      { user_id: 'user1', full_name: 'John Smith', role: 'Project Manager' },
      { user_id: 'user2', full_name: 'Jane Doe', role: 'Architect' }
    ],
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'New Building Construction',
    description: 'Construction of new commercial building',
    status: 'Planning',
    start_date: '2024-03-01',
    end_date: '2024-12-31',
    deadline: '2024-12-31',
    budget: 2500000,
    address: '456 Business Ave, City, State',
    discipline: 'Construction',
    project_manager: 'Mike Johnson',
    client: 'XYZ Development',
    location: 'Business District',
    notes: 'Large scale construction project',
    progress: 15,
    total_tasks: 25,
    completed_tasks: 3,
    document_count: 15,
    members: [
      { user_id: 'user3', full_name: 'Mike Johnson', role: 'Project Manager' },
      { user_id: 'user4', full_name: 'Sarah Wilson', role: 'Engineer' }
    ],
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-05T09:15:00Z'
  },
  {
    id: '3',
    name: 'Bridge Repair',
    description: 'Structural repairs to main bridge',
    status: 'Active',
    start_date: '2024-02-01',
    end_date: '2024-05-15',
    deadline: '2024-05-15',
    budget: 500000,
    address: '789 River Road, City, State',
    discipline: 'Civil Engineering',
    project_manager: 'Lisa Brown',
    client: 'City Government',
    location: 'River District',
    notes: 'Critical infrastructure repair',
    progress: 60,
    total_tasks: 18,
    completed_tasks: 11,
    document_count: 22,
    members: [
      { user_id: 'user5', full_name: 'Lisa Brown', role: 'Project Manager' },
      { user_id: 'user6', full_name: 'Tom Davis', role: 'Civil Engineer' }
    ],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-25T16:45:00Z'
  }
];

export default async function handler(req: any, res: any) {
  console.log('📥 Olumba Projects API:', req.method, req.url);
  console.log('Query params:', req.query);
  console.log('Request URL:', req.url);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET single project by ID (query parameter or path parameter)
    if (req.method === 'GET' && (req.query.id || req.url.includes('/api/projects/') && req.url !== '/api/projects')) {
      let projectId = req.query.id;
      
      // If no query param, try to extract from URL path
      if (!projectId && req.url.includes('/api/projects/')) {
        const urlParts = req.url.split('/');
        projectId = urlParts[urlParts.length - 1];
        console.log('📋 Extracted project ID from URL path:', projectId);
      }
      
      console.log('📋 Fetching single project by ID:', projectId);
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      try {
        const { getSupabaseAdmin } = await import('../lib/supabase');
        const supabase = getSupabaseAdmin();
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (error) {
          console.error('Supabase error:', error);
          
          if (error.code === 'PGRST116') {
            console.log('❌ Project not found');
            return res.status(404).json({
              success: false,
              error: 'Project not found'
            });
          }
          throw error;
        }
        
        console.log('✅ Project found:', data.name);
        
        return res.status(200).json({
          success: true,
          data: data
        });
        
      } catch (supabaseError) {
        console.log('⚠️ Supabase not available, using mock data:', supabaseError.message);
        
        // Fallback to mock data
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }
        
        return res.status(200).json({
          success: true,
          data: project
        });
      }
    }
    
    // GET all projects
    if (req.method === 'GET') {
      console.log('📋 Fetching projects list...');
      
      // Try Supabase first, fallback to mock data
      try {
        const { getSupabaseAdmin } = await import('../lib/supabase');
        const supabase = getSupabaseAdmin();
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('✅ Using Supabase data:', data.length, 'projects');
        
        return res.status(200).json({
          success: true,
          data: data,
          count: data.length
        });
        
      } catch (supabaseError) {
        console.log('⚠️ Supabase not available, using mock data:', supabaseError.message);
        
        return res.status(200).json({
          success: true,
          data: mockProjects,
          count: mockProjects.length
        });
      }
    }
    
    // POST - Create new project
    if (req.method === 'POST') {
      const projectData = req.body;
      
      if (!projectData.name || projectData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Project name is required'
        });
      }
      
      try {
        const { getSupabaseAdmin } = await import('../lib/supabase');
        const supabase = getSupabaseAdmin();
        
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status || 'Planning',
            start_date: projectData.startDate || projectData.start_date || null,
            end_date: projectData.endDate || projectData.deadline || null,
            budget: projectData.budget || 0,
            location: projectData.location || projectData.address || null,
            client: projectData.client || null,
            project_manager: projectData.projectManager || null,
            notes: projectData.notes || null,
            progress: projectData.progress || 0
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        return res.status(201).json({
          success: true,
          data: data,
          message: 'Project created successfully'
        });
        
      } catch (supabaseError) {
        // Fallback: create mock project
        const newProject = {
          id: `proj_${Date.now()}`,
          name: projectData.name,
          description: projectData.description || '',
          status: projectData.status || 'Planning',
          startDate: projectData.startDate || projectData.start_date || null,
          endDate: projectData.endDate || projectData.deadline || null,
          budget: projectData.budget || 0,
          location: projectData.location || projectData.address || null,
          client: projectData.client || null,
          projectManager: projectData.projectManager || null,
          createdAt: new Date().toISOString()
        };
        
        // Add to mock projects array (in-memory only)
        mockProjects.unshift(newProject);
        
        return res.status(201).json({
          success: true,
          data: newProject,
          message: 'Project created successfully (mock data)'
        });
      }
    }
    
    // PUT - Update project
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      try {
        const { getSupabaseAdmin } = await import('../lib/supabase');
        const supabase = getSupabaseAdmin();
        
        const { data, error } = await supabase
          .from('projects')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        return res.status(200).json({
          success: true,
          data: data,
          message: 'Project updated successfully'
        });
        
      } catch (supabaseError) {
        // Fallback: update mock project
        const projectIndex = mockProjects.findIndex(p => p.id === id);
        if (projectIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }
        
        mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...req.body };
        
        return res.status(200).json({
          success: true,
          data: mockProjects[projectIndex],
          message: 'Project updated successfully (mock data)'
        });
      }
    }
    
    // DELETE - Delete project
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      try {
        const { getSupabaseAdmin } = await import('../lib/supabase');
        const supabase = getSupabaseAdmin();
        
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        return res.status(200).json({
          success: true,
          message: 'Project deleted successfully'
        });
        
      } catch (supabaseError) {
        // Fallback: delete from mock projects
        const projectIndex = mockProjects.findIndex(p => p.id === id);
        if (projectIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
          });
        }
        
        mockProjects.splice(projectIndex, 1);
        
        return res.status(200).json({
          success: true,
          message: 'Project deleted successfully (mock data)'
        });
      }
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error: any) {
    console.error('❌ Olumba Projects API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}