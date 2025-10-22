// =============================
// Project Members API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  console.log('📥 Olumba Project Members API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET project members
    if (req.method === 'GET') {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      console.log('📋 Fetching project members for project:', projectId);
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users(id, full_name, email, profile_photo, role, title)
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data.length} project members`);
      
      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }
    
    // POST - Add member to project
    if (req.method === 'POST') {
      console.log('👥 Adding member to project');
      
      const { projectId, userId, role, permissions } = req.body;
      
      if (!projectId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID and User ID are required'
        });
      }
      
      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      
      if (existingMember) {
        return res.status(400).json({
          success: false,
          error: 'User is already a member of this project'
        });
      }
      
      const { data, error } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: userId,
          role: role || 'member',
          permissions: permissions || {}
        }])
        .select(`
          *,
          user:users(id, full_name, email, profile_photo, role, title)
        `)
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Member added to project:', data.user?.full_name);
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Member added to project successfully'
      });
    }
    
    // DELETE - Remove member from project
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Member ID is required'
        });
      }
      
      console.log('🗑️ Removing member from project:', id);
      
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('✅ Member removed from project');
      
      return res.status(200).json({
        success: true,
        message: 'Member removed from project successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ Olumba Project Members API Error:', error);
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
