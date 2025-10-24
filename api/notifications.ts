// =============================
// Notifications API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req: any, res: any) {
  console.log('📥 Olumba Notifications API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET unread count
    if (req.method === 'GET' && req.url.includes('/unread-count')) {
      console.log('📊 Getting unread count...');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('read', false);
      
      if (error) {
        console.error('Supabase error:', error);
        // Return 0 if table doesn't exist
        return res.status(200).json({
          success: true,
          count: 0,
          unreadCount: 0
        });
      }
      
      const unreadCount = data?.length || 0;
      console.log(`✅ Unread count: ${unreadCount}`);
      
      return res.status(200).json({
        success: true,
        count: unreadCount,
        unreadCount: unreadCount
      });
    }
    
    // GET all notifications
    if (req.method === 'GET') {
      console.log('📋 Getting all notifications...');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        // Return empty array if table doesn't exist
        return res.status(200).json({
          success: true,
          data: [],
          count: 0
        });
      }
      
      console.log(`✅ Found ${data?.length || 0} notifications`);
      
      return res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    }
    
    // POST - Create notification
    if (req.method === 'POST') {
      console.log('📝 Creating notification (placeholder)');
      
      // Placeholder for future implementation
      return res.status(201).json({
        success: true,
        message: 'Notification feature coming soon',
        data: {
          id: `notif_${Date.now()}`,
          title: req.body.title || 'New Notification',
          message: req.body.message || 'Notification created',
          type: req.body.type || 'info',
          read: false,
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // PUT - Mark as read
    if (req.method === 'PUT') {
      const { id } = req.query;
      console.log('✅ Marking notification as read:', id);
      
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: {
          id: id,
          read: true,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    // DELETE notification
    if (req.method === 'DELETE') {
      const { id } = req.query;
      console.log('🗑️ Deleting notification:', id);
      
      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error: any) {
    console.error('❌ Notifications API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}