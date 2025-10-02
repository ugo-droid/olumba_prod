-- Row Level Security Policies for Olumba
-- Run this after creating the schema

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_approvals ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is project member
CREATE OR REPLACE FUNCTION is_project_member(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = project_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Admins can manage companies" ON companies
    FOR ALL USING (is_admin());

-- Users policies
CREATE POLICY "Users can view other users in same company or project" ON users
    FOR SELECT USING (
        id = auth.uid() -- Own profile
        OR company_id = (SELECT company_id FROM users WHERE id = auth.uid()) -- Same company
        OR is_admin() -- Admins can see all
        OR EXISTS ( -- Users in same projects
            SELECT 1 FROM project_members pm1
            JOIN project_members pm2 ON pm1.project_id = pm2.project_id
            WHERE pm1.user_id = auth.uid() AND pm2.user_id = users.id
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (is_admin());

-- Projects policies
CREATE POLICY "Users can view projects they're members of" ON projects
    FOR SELECT USING (
        is_project_member(id)
        OR is_admin()
        OR company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Company members can create projects" ON projects
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Project members and admins can update projects" ON projects
    FOR UPDATE USING (
        is_project_member(id)
        OR is_admin()
        OR company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Admins and project owners can delete projects" ON projects
    FOR DELETE USING (
        is_admin()
        OR created_by = auth.uid()
    );

-- Project members policies
CREATE POLICY "Users can view project members for their projects" ON project_members
    FOR SELECT USING (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Project admins can manage project members" ON project_members
    FOR ALL USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id 
            AND pm.user_id = auth.uid() 
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Tasks policies
CREATE POLICY "Users can view tasks in their projects" ON tasks
    FOR SELECT USING (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Project members can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Task assignees and project members can update tasks" ON tasks
    FOR UPDATE USING (
        assigned_to = auth.uid()
        OR is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Task creators and project admins can delete tasks" ON tasks
    FOR DELETE USING (
        created_by = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = tasks.project_id 
            AND pm.user_id = auth.uid() 
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Documents policies
CREATE POLICY "Users can view documents in their projects" ON documents
    FOR SELECT USING (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Project members can upload documents" ON documents
    FOR INSERT WITH CHECK (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Document uploaders and project members can update documents" ON documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Document uploaders and project admins can delete documents" ON documents
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM project_members pm
            JOIN documents d ON d.project_id = pm.project_id
            WHERE d.id = documents.id 
            AND pm.user_id = auth.uid() 
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Document versions policies
CREATE POLICY "Users can view document versions for accessible documents" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_versions.document_id
            AND (is_project_member(d.project_id) OR is_admin())
        )
    );

CREATE POLICY "Users can create document versions for accessible documents" ON document_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_versions.document_id
            AND (is_project_member(d.project_id) OR is_admin())
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages in their projects" ON messages
    FOR SELECT USING (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Project members can post messages" ON messages
    FOR INSERT WITH CHECK (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Message authors can update their messages" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY "Message authors and project admins can delete messages" ON messages
    FOR DELETE USING (
        sender_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = messages.project_id 
            AND pm.user_id = auth.uid() 
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users" ON notifications
    FOR INSERT WITH CHECK (true); -- This will be handled by server-side code

-- Activity log policies
CREATE POLICY "Users can view activity for their projects" ON activity_log
    FOR SELECT USING (
        user_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id::text = entity_id::text
            AND is_project_member(p.id)
        )
    );

CREATE POLICY "System can create activity logs" ON activity_log
    FOR INSERT WITH CHECK (true); -- This will be handled by server-side code

-- City approvals policies
CREATE POLICY "Users can view city approvals for their projects" ON city_approvals
    FOR SELECT USING (
        is_project_member(project_id)
        OR is_admin()
    );

CREATE POLICY "Project members can manage city approvals" ON city_approvals
    FOR ALL USING (
        is_project_member(project_id)
        OR is_admin()
    );
