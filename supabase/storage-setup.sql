-- Storage Setup for Olumba
-- Run this in Supabase SQL Editor after creating the schema

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('documents', 'documents', false, 104857600, ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'application/zip', 'application/x-zip-compressed']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents in their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND (
            -- Check if user has access to the project
            EXISTS (
                SELECT 1 FROM documents d
                JOIN project_members pm ON d.project_id = pm.project_id
                WHERE d.file_path = storage.objects.name
                AND pm.user_id = auth.uid()
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );

CREATE POLICY "Project members can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND (
            -- This will be validated on the application side
            auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Document owners can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND (
            EXISTS (
                SELECT 1 FROM documents d
                WHERE d.file_path = storage.objects.name
                AND d.uploaded_by = auth.uid()
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );

CREATE POLICY "Document owners and admins can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND (
            EXISTS (
                SELECT 1 FROM documents d
                WHERE d.file_path = storage.objects.name
                AND d.uploaded_by = auth.uid()
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for company logos bucket
CREATE POLICY "Anyone can view company logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Company members can upload company logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-logos' AND (
            EXISTS (
                SELECT 1 FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.id = auth.uid()
                AND c.id::text = (storage.foldername(name))[1]
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );

CREATE POLICY "Company members can update company logos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'company-logos' AND (
            EXISTS (
                SELECT 1 FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.id = auth.uid()
                AND c.id::text = (storage.foldername(name))[1]
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );

CREATE POLICY "Company members can delete company logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'company-logos' AND (
            EXISTS (
                SELECT 1 FROM users u
                JOIN companies c ON u.company_id = c.id
                WHERE u.id = auth.uid()
                AND c.id::text = (storage.foldername(name))[1]
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
        )
    );
