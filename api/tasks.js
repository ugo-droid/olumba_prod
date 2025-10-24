import { getSupabaseAdmin } from '../lib/supabase.js';

export default async function handler(req, res) {
  // ALWAYS set these headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // ALWAYS handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // Method handling with proper validation
    if (req.method === 'GET') {
      const { id, project_id } = req.query;
      
      let query = supabase.from('tasks').select(`
        *,
        project:projects(*),
        assigned_to:users(*),
        created_by:users(*)
      `);
      
      if (id) {
        query = query.eq('id', id).single();
      } else if (project_id) {
        query = query.eq('project_id', project_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Task not found'
          });
        }
        throw error;
      }
      
      return res.status(200).json({
        success: true,
        data: data,
        count: Array.isArray(data) ? data.length : 1
      });
    }
    
    if (req.method === 'POST') {
      const bodyData = req.body;
      
      // ALWAYS validate required fields
      if (!bodyData.title) {
        return res.status(400).json({
          success: false,
          error: 'Task title is required'
        });
      }
      
      if (!bodyData.project_id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: bodyData.title,
          description: bodyData.description || '',
          status: bodyData.status || 'pending',
          priority: bodyData.priority || 'medium',
          due_date: bodyData.due_date || null,
          project_id: bodyData.project_id,
          assigned_to: bodyData.assigned_to || null,
          created_by: bodyData.created_by || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Task created successfully'
      });
    }
    
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID required for update'
        });
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Task updated successfully'
      });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID required for deletion'
        });
      }
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    }
    
    // ALWAYS return 405 for unsupported methods
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    // ALWAYS log server errors
    console.error('Tasks API Error:', error);
    
    // ALWAYS return JSON for errors
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
