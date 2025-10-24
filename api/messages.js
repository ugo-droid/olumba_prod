// =============================
// Messages API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  console.log('📥 Olumba Messages API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET - Fetch messages
    if (req.method === 'GET') {
      const { projectId, userId, id } = req.query;
      
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email, profile_photo),
          recipient:users!messages_recipient_id_fkey(id, full_name, email, profile_photo),
          project:projects(id, name)
        `);
      
      if (id) {
        query = query.eq('id', id).single();
      } else if (projectId) {
        query = query.eq('project_id', projectId);
      } else if (userId) {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log(`✅ Found ${Array.isArray(data) ? data.length : 1} messages`);
      
      return res.status(200).json({
        success: true,
        data: data || [],
        count: Array.isArray(data) ? data.length : 1
      });
    }
    
    // POST - Send message
    if (req.method === 'POST') {
      console.log('📝 Creating message');
      
      const messageData = req.body;
      
      if (!messageData.content) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        });
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: messageData.sender_id || null,
          recipient_id: messageData.recipient_id || null,
          project_id: messageData.project_id || null,
          content: messageData.content,
          read: false
        }])
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email, profile_photo),
          recipient:users!messages_recipient_id_fkey(id, full_name, email, profile_photo),
          project:projects(id, name)
        `)
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Message created:', data.id);
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Message sent successfully'
      });
    }
    
    // PUT - Mark as read
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }
      
      console.log('📝 Marking message as read:', id);
      
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('✅ Message marked as read');
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Message marked as read'
      });
    }
    
    // DELETE - Delete message
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }
      
      console.log('🗑️ Deleting message:', id);
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('✅ Message deleted');
      
      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ Olumba Messages API Error:', error);
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
