// =============================
// Tasks API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../lib/supabase';

export default async function handler(req: any, res: any) {
  console.log('📥 Olumba Tasks API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET tasks
    if (req.method === 'GET') {
      const { projectId } = req.query;
      
      let query = supabase.from('tasks').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }
    
    // POST - Create task
    if (req.method === 'POST') {
      const taskData = req.body;
      
      if (!taskData.title || taskData.title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Task title is required'
        });
      }
      
      if (!taskData.projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          project_id: taskData.projectId,
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status || 'To Do',
          priority: taskData.priority || 'Medium',
          assignee: taskData.assignee || null,
          due_date: taskData.dueDate || null,
          completed: false
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
    
    // PUT - Update task
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required'
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
    
    // DELETE task
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required'
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
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error: any) {
    console.error('❌ Olumba Tasks API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}