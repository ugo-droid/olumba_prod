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
      const { id, user_id, unread_only } = req.query;
      
      let query = supabase.from('notifications').select(`
        *,
        user:users(*),
        project:projects(*)
      `);
      
      if (id) {
        query = query.eq('id', id).single();
      } else if (user_id) {
        query = query.eq('user_id', user_id);
        
        if (unread_only === 'true') {
          query = query.eq('read', false);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Notification not found'
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
          error: 'Notification title is required'
        });
      }
      
      if (!bodyData.user_id) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          title: bodyData.title,
          message: bodyData.message || '',
          type: bodyData.type || 'info',
          user_id: bodyData.user_id,
          project_id: bodyData.project_id || null,
          read: false
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Notification created successfully'
      });
    }
    
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Notification ID required for update'
        });
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Notification updated successfully'
      });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Notification ID required for deletion'
        });
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    }
    
    // ALWAYS return 405 for unsupported methods
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    // ALWAYS log server errors
    console.error('Notifications API Error:', error);
    
    // ALWAYS return JSON for errors
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
