// =============================
// Clients API Endpoint - WITH SUPABASE DATABASE
// =============================

import { getSupabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  console.log('📥 Olumba Clients API:', req.method);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET all clients or single client
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        console.log('📋 Fetching single client:', id);
        
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Supabase error:', error);
          
          if (error.code === 'PGRST116') {
            return res.status(404).json({
              success: false,
              error: 'Client not found'
            });
          }
          throw error;
        }
        
        console.log('✅ Client found:', data.name);
        
        return res.status(200).json({
          success: true,
          data: data
        });
      } else {
        console.log('📋 Fetching all clients');
        
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log(`✅ Found ${data.length} clients`);
        
        return res.status(200).json({
          success: true,
          data: data,
          count: data.length
        });
      }
    }
    
    // POST - Create client
    if (req.method === 'POST') {
      console.log('📝 Creating new client');
      
      const clientData = req.body;
      
      if (!clientData.name || clientData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Client name is required'
        });
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          address: clientData.address || null,
          contact_person: clientData.contact_person || null,
          contact_title: clientData.contact_title || null,
          notes: clientData.notes || null,
          company_id: clientData.company_id || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Client created:', data.name);
      
      return res.status(201).json({
        success: true,
        data: data,
        message: 'Client created successfully'
      });
    }
    
    // PUT - Update client
    if (req.method === 'PUT') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Client ID is required'
        });
      }
      
      console.log('📝 Updating client:', id);
      
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('✅ Client updated:', data.name);
      
      return res.status(200).json({
        success: true,
        data: data,
        message: 'Client updated successfully'
      });
    }
    
    // DELETE - Delete client
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Client ID is required'
        });
      }
      
      console.log('🗑️ Deleting client:', id);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('✅ Client deleted');
      
      return res.status(200).json({
        success: true,
        message: 'Client deleted successfully'
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('❌ Olumba Clients API Error:', error);
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
