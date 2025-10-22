// =============================
// Global Search API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const { q } = req.query;
  
  console.log('🔍 Olumba Search API:', q);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query too short (minimum 2 characters)'
    });
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    const searchTerm = `%${q}%`;
    
    console.log('🔍 Searching for:', q);
    
    // Search projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, status')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5);
    
    if (projectsError) {
      console.error('Projects search error:', projectsError);
    }
    
    // Search tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, name, title, description, status, project_id')
      .or(`name.ilike.${searchTerm},title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5);
    
    if (tasksError) {
      console.error('Tasks search error:', tasksError);
    }
    
    // Search documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, name, mime_type, file_path')
      .ilike('name', searchTerm)
      .limit(5);
    
    if (documentsError) {
      console.error('Documents search error:', documentsError);
    }
    
    // Search clients (if table exists)
    let clients = [];
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, contact_person')
        .or(`name.ilike.${searchTerm},contact_person.ilike.${searchTerm}`)
        .limit(5);
      
      if (!clientsError) {
        clients = clientsData || [];
      }
    } catch (error) {
      console.log('Clients table not available, skipping client search');
    }
    
    // Generate public URLs for documents
    const documentsWithUrls = (documents || []).map(doc => {
      const { data: urlData } = supabase.storage
        .from('olumba-documents')
        .getPublicUrl(doc.file_path);
      
      return {
        ...doc,
        url: urlData.publicUrl
      };
    });
    
    const results = {
      projects: projects || [],
      tasks: tasks || [],
      documents: documentsWithUrls,
      clients: clients
    };
    
    console.log(`✅ Search completed: ${results.projects.length} projects, ${results.tasks.length} tasks, ${results.documents.length} documents, ${results.clients.length} clients`);
    
    return res.status(200).json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Olumba Search API Error:', error);
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
