// =============================
// Documents API Endpoint - WITH SUPABASE STORAGE
// =============================

import { getSupabaseAdmin } from '../lib/supabase';

export default async function handler(req: any, res: any) {
  console.log('📥 Olumba Documents API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET documents for a project
    if (req.method === 'GET') {
      const { projectId } = req.query;
      
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required'
        });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      
      // Generate public URLs for each document
      const documentsWithUrls = data.map(doc => {
        const { data: urlData } = supabase.storage
          .from('olumba-documents')
          .getPublicUrl(doc.file_path);
        
        return {
          ...doc,
          url: urlData.publicUrl
        };
      });
      
      return res.status(200).json({
        success: true,
        data: documentsWithUrls,
        count: documentsWithUrls.length
      });
    }
    
    // POST - Create document record
    if (req.method === 'POST') {
      const { projectId, name, filePath, fileType, fileSize, uploadedBy } = req.body;
      
      if (!projectId || !name || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Project ID, name, and file path are required'
        });
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          project_id: projectId,
          name: name,
          file_path: filePath,
          file_type: fileType || 'application/octet-stream',
          file_size: fileSize || 0,
          uploaded_by: uploadedBy || 'Unknown User'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add public URL
      const { data: urlData } = supabase.storage
        .from('olumba-documents')
        .getPublicUrl(filePath);
      
      return res.status(201).json({
        success: true,
        data: {
          ...data,
          url: urlData.publicUrl
        },
        message: 'Document uploaded successfully'
      });
    }
    
    // DELETE document
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Document ID is required'
        });
      }
      
      // Get document to find file path
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('olumba-documents')
        .remove([doc.file_path]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
      }
      
      // Delete database record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error: any) {
    console.error('❌ Olumba Documents API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
