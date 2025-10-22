// =============================
// Single Task API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;
  
  console.log('📥 Olumba Task Detail API:', req.method, 'Task ID:', id);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Task ID is required'
    });
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET single task with project and user info
    if (req.method === 'GET') {
      console.log('📋 Fetching single task:', id);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name, status, description),
          assigned_user:users!tasks_assigned_to_fkey(id, full_name, email, profile_photo, role)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('❌ Task not found');
          return res.status(404).json({
            success: false,
            error: 'Task not found'
          });
        }
        throw error;
      }
      
      console.log('✅ Task found:', data.name || data.title);
      
      return res.status(200).json({
        success: true,
        data: data
      });
    }
    
    // PUT - Update task
    if (req.method === 'PUT') {
      console.log('📝 Updating task:', id);
      
      const updateData = req.body;
      
      // Validate required fields
      if (updateData.title && updateData.title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Task title cannot be empty'
        });
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          project:projects(id, name, status, description),
          assigned_user:users!tasks_assigned_to_fkey(id, full_name, email, profile_photo, role)
        `)
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('✅ Task updated successfully');
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Task updated successfully'
      });
    }
    
    // DELETE - Delete task
    if (req.method === 'DELETE') {
      console.log('🗑️ Deleting task:', id);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('✅ Task deleted successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ Olumba Task Detail API Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
