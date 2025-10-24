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
      const { id } = req.query;
      
      let query = supabase.from('projects').select(`
        *,
        company:companies(*),
        tasks:tasks(*),
        documents:documents(*)
      `);
      
      if (id) {
        query = query.eq('id', id).single();
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Project not found'
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
          error: 'Project name is required'
        });
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: bodyData.name,
          description: bodyData.description || '',
          status: bodyData.status || 'active',
          start_date: bodyData.start_date || null,
          end_date: bodyData.end_date || null,
          budget: bodyData.budget || null,
          company_id: bodyData.company_id || null,
          created_by: bodyData.created_by || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Project created successfully'
      });
    }
    
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID required for update'
        });
      }
      
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
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Project ID required for deletion'
        });
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    }
    
    // ALWAYS return 405 for unsupported methods
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    // ALWAYS log server errors
    console.error('Projects API Error:', error);
    
    // ALWAYS return JSON for errors
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
