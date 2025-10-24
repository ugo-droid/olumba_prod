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
      
      let query = supabase.from('documents').select(`
        *,
        project:projects(*),
        uploaded_by:users(*)
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
            error: 'Document not found'
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
      if (!bodyData.name) {
        return res.status(400).json({
          success: false,
          error: 'Document name is required'
        });
      }
      
      if (!bodyData.project_id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          name: bodyData.name,
          description: bodyData.description || '',
          file_path: bodyData.file_path || '',
          file_size: bodyData.file_size || 0,
          file_type: bodyData.file_type || '',
          project_id: bodyData.project_id,
          uploaded_by: bodyData.uploaded_by || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Document created successfully'
      });
    }
    
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Document ID required for update'
        });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Document updated successfully'
      });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Document ID required for deletion'
        });
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    }
    
    // ALWAYS return 405 for unsupported methods
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    // ALWAYS log server errors
    console.error('Documents API Error:', error);
    
    // ALWAYS return JSON for errors
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
