// =============================
// Tasks API Endpoint
// =============================

export default async function handler(req: any, res: any) {
  console.log('📥 Tasks API called:', req.method);
  
  // Set headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(200).end();
  }
  
  try {
    // GET - Fetch tasks (optionally filtered by projectId)
    if (req.method === 'GET') {
      const { projectId } = req.query;
      console.log('📋 Fetching tasks for project:', projectId);
      
      // TODO: Fetch from database
      // For now, return mock tasks
      const allTasks = [
        {
          id: '1',
          projectId: '1',
          title: 'Design floor plans',
          description: 'Create detailed floor plans for all levels',
          status: 'In Progress',
          priority: 'High',
          assignee: 'Alice Johnson',
          dueDate: '2024-04-15',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          projectId: '1',
          title: 'Order materials',
          description: 'Order construction materials from suppliers',
          status: 'To Do',
          priority: 'Medium',
          assignee: 'Bob Wilson',
          dueDate: '2024-04-20',
          createdAt: '2024-01-16T11:00:00Z'
        },
        {
          id: '3',
          projectId: '1',
          title: 'Schedule inspections',
          description: 'Coordinate building inspections with authorities',
          status: 'To Do',
          priority: 'Critical',
          assignee: 'Carol Davis',
          dueDate: '2024-04-10',
          createdAt: '2024-01-17T09:00:00Z'
        },
        {
          id: '4',
          projectId: '2',
          title: 'Site preparation',
          description: 'Prepare construction site for new building',
          status: 'Planning',
          priority: 'High',
          assignee: 'David Brown',
          dueDate: '2024-03-15',
          createdAt: '2024-02-01T08:00:00Z'
        },
        {
          id: '5',
          projectId: '3',
          title: 'Traffic management plan',
          description: 'Develop traffic management plan for bridge repair',
          status: 'In Progress',
          priority: 'Critical',
          assignee: 'Grace Taylor',
          dueDate: '2024-03-01',
          createdAt: '2024-01-25T14:00:00Z'
        }
      ];
      
      // Filter by project if projectId provided
      const tasks = projectId 
        ? allTasks.filter(t => t.projectId === projectId)
        : allTasks;
      
      console.log('✅ Returning tasks:', tasks.length);
      
      return res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length
      });
    }
    
    // POST - Create new task
    if (req.method === 'POST') {
      console.log('📝 Creating new task...');
      console.log('Request body:', req.body);
      
      const taskData = req.body;
      
      // Validate required fields
      console.log('Validating task data...');
      console.log('Title:', taskData.title);
      console.log('Name:', taskData.name);
      console.log('Title type:', typeof taskData.title);
      console.log('Name type:', typeof taskData.name);
      
      // Check both 'title' and 'name' fields (for compatibility)
      const title = taskData.title || taskData.name;
      
      if (!title) {
        console.error('❌ Missing title/name');
        return res.status(400).json({
          success: false,
          error: 'Task title is required'
        });
      }
      
      if (typeof title === 'string' && title.trim() === '') {
        console.error('❌ Empty title');
        return res.status(400).json({
          success: false,
          error: 'Task title cannot be empty'
        });
      }
      
      if (!taskData.project_id && !taskData.projectId) {
        console.error('❌ Missing project ID');
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      // Create new task
      const newTask = {
        id: `task_${Date.now()}`,
        projectId: taskData.project_id || taskData.projectId,
        title: title,
        description: taskData.description || '',
        status: taskData.status || 'To Do',
        priority: taskData.priority || 'Medium',
        assignee: taskData.assigned_to || taskData.assignee || null,
        dueDate: taskData.due_date || taskData.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Task created:', newTask);
      
      // TODO: Save to database
      
      return res.status(201).json({
        success: true,
        data: newTask,
        message: 'Task created successfully'
      });
    }
    
    // Method not allowed
    console.log('Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
    
  } catch (error: any) {
    console.error('❌ Tasks API Error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}