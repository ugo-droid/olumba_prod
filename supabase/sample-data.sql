-- Sample Data for Olumba Supabase Database
-- Run this after setting up the schema to populate with demo data

-- Insert sample companies
INSERT INTO companies (id, name, logo_url, address, phone, website) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Architecture', NULL, '123 Design Street, San Francisco, CA 94105', '(555) 123-4567', 'https://acmearch.com'),
('550e8400-e29b-41d4-a716-446655440002', 'BuildRight Engineering', NULL, '456 Engineering Ave, Los Angeles, CA 90210', '(555) 987-6543', 'https://buildright.com'),
('550e8400-e29b-41d4-a716-446655440003', 'Urban Planning Co', NULL, '789 Planning Blvd, Seattle, WA 98101', '(555) 456-7890', 'https://urbanplanning.com');

-- Note: Users will be created through the authentication system
-- This is just for reference of the user structure
-- INSERT INTO users (id, email, full_name, role, company_id, phone, title) VALUES
-- ('user-id-from-auth', 'admin@acmearch.com', 'John Admin', 'admin', '550e8400-e29b-41d4-a716-446655440001', '(555) 123-4567', 'Principal Architect'),
-- ('user-id-from-auth', 'member@acmearch.com', 'Jane Member', 'member', '550e8400-e29b-41d4-a716-446655440001', '(555) 123-4568', 'Senior Architect'),
-- ('user-id-from-auth', 'consultant@buildright.com', 'Bob Consultant', 'consultant', '550e8400-e29b-41d4-a716-446655440002', '(555) 987-6544', 'Structural Engineer');

-- Insert sample projects
INSERT INTO projects (id, name, description, status, company_id, start_date, deadline, budget, address) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Downtown Office Complex', 'Modern 20-story office building with retail ground floor', 'active', '550e8400-e29b-41d4-a716-446655440001', '2024-01-15', '2025-12-31', 15000000.00, '100 Business District, San Francisco, CA'),
('650e8400-e29b-41d4-a716-446655440002', 'Residential Tower Phase 2', 'Luxury residential tower with 150 units', 'planning', '550e8400-e29b-41d4-a716-446655440001', '2024-06-01', '2026-03-15', 25000000.00, '200 Residential Way, San Francisco, CA'),
('650e8400-e29b-41d4-a716-446655440003', 'Community Center Renovation', 'Historic community center restoration and modernization', 'active', '550e8400-e29b-41d4-a716-446655440002', '2024-02-01', '2024-11-30', 3500000.00, '300 Community Street, Los Angeles, CA'),
('650e8400-e29b-41d4-a716-446655440004', 'Mixed-Use Development', 'Combined residential and commercial development', 'on_hold', '550e8400-e29b-41d4-a716-446655440003', '2024-08-01', '2026-06-30', 45000000.00, '400 Development Ave, Seattle, WA');

-- Note: Project members will be added when users are created through the auth system
-- INSERT INTO project_members (project_id, user_id, role) VALUES
-- ('650e8400-e29b-41d4-a716-446655440001', 'user-id-1', 'owner'),
-- ('650e8400-e29b-41d4-a716-446655440001', 'user-id-2', 'member'),
-- ('650e8400-e29b-41d4-a716-446655440001', 'user-id-3', 'consultant');

-- Insert sample tasks (using placeholder user IDs - these should be updated with real user IDs)
INSERT INTO tasks (id, project_id, name, description, status, priority, due_date, estimated_hours) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Complete structural drawings', 'Finalize all structural engineering drawings for floors 1-5', 'in_progress', 'high', '2024-03-15 17:00:00+00', 40),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'MEP coordination review', 'Review mechanical, electrical, and plumbing coordination', 'todo', 'medium', '2024-03-20 17:00:00+00', 16),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'Submit permit application', 'Submit building permit application to city planning department', 'todo', 'urgent', '2024-03-10 17:00:00+00', 8),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Site survey completion', 'Complete topographical and boundary survey', 'completed', 'high', '2024-02-28 17:00:00+00', 24),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'Historic preservation review', 'Coordinate with historic preservation committee', 'in_progress', 'medium', '2024-04-01 17:00:00+00', 12);

-- Insert sample documents (without file paths since files need to be uploaded through the system)
INSERT INTO documents (id, project_id, name, description, discipline, current_version, tags) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Architectural Plans - Ground Floor', 'Ground floor architectural drawings and specifications', 'Architectural', 2, ARRAY['plans', 'ground-floor', 'architectural']),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Structural Analysis Report', 'Comprehensive structural analysis and calculations', 'Structural', 1, ARRAY['analysis', 'structural', 'calculations']),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'MEP Drawings - HVAC', 'HVAC system drawings and specifications', 'Mechanical', 1, ARRAY['mep', 'hvac', 'mechanical']),
('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Site Plan', 'Overall site plan with landscaping and utilities', 'Civil', 3, ARRAY['site-plan', 'civil', 'landscaping']),
('850e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'Historic Preservation Guidelines', 'Guidelines and requirements for historic preservation', 'General', 1, ARRAY['historic', 'preservation', 'guidelines']);

-- Insert sample city approvals
INSERT INTO city_approvals (id, project_id, submission_type, status, submitted_date, review_date, reviewer_name, reviewer_email, notes) VALUES
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Building Permit', 'under_review', '2024-02-15', '2024-02-20', 'Sarah Johnson', 'sarah.johnson@sf.gov', 'Initial review completed. Waiting for structural review.'),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Zoning Compliance', 'approved', '2024-01-20', '2024-01-25', 'Mike Chen', 'mike.chen@sf.gov', 'Approved with standard conditions.'),
('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'Environmental Impact', 'not_submitted', NULL, NULL, NULL, NULL, 'Pending completion of environmental assessment.'),
('950e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', 'Historic Preservation', 'corrections_required', '2024-02-01', '2024-02-10', 'Lisa Rodriguez', 'lisa.rodriguez@la.gov', 'Minor corrections needed for facade restoration plan.');

-- Insert sample activity log entries
INSERT INTO activity_log (id, entity_type, entity_id, action, description, metadata) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'project', '650e8400-e29b-41d4-a716-446655440001', 'created', 'Project created', '{"project_name": "Downtown Office Complex"}'),
('a50e8400-e29b-41d4-a716-446655440002', 'task', '750e8400-e29b-41d4-a716-446655440001', 'created', 'Task created', '{"task_name": "Complete structural drawings"}'),
('a50e8400-e29b-41d4-a716-446655440003', 'task', '750e8400-e29b-41d4-a716-446655440004', 'completed', 'Task completed', '{"task_name": "Site survey completion"}'),
('a50e8400-e29b-41d4-a716-446655440004', 'document', '850e8400-e29b-41d4-a716-446655440001', 'uploaded', 'Document uploaded', '{"document_name": "Architectural Plans - Ground Floor"}'),
('a50e8400-e29b-41d4-a716-446655440005', 'city_approval', '950e8400-e29b-41d4-a716-446655440002', 'approved', 'City approval received', '{"approval_type": "Zoning Compliance"});

-- Create some sample notification types (these would normally be created by the system)
-- Note: These will need real user IDs when users are created
-- INSERT INTO notifications (id, user_id, type, title, message, link, is_read) VALUES
-- ('b50e8400-e29b-41d4-a716-446655440001', 'user-id-1', 'task_assigned', 'New Task Assigned', 'You have been assigned to "Complete structural drawings"', '/task-detail.html?id=750e8400-e29b-41d4-a716-446655440001', false),
-- ('b50e8400-e29b-41d4-a716-446655440002', 'user-id-2', 'city_approval_update', 'City Approval Update', 'Zoning compliance has been approved', '/city-approvals.html', false),
-- ('b50e8400-e29b-41d4-a716-446655440003', 'user-id-3', 'document_shared', 'New Document Shared', 'Architectural Plans - Ground Floor has been uploaded', '/project-detail.html?id=650e8400-e29b-41d4-a716-446655440001', true);

-- Update sequences to avoid conflicts with sample data
-- This ensures new records don't conflict with the sample data IDs
SELECT setval(pg_get_serial_sequence('companies', 'id'), (SELECT MAX(id) FROM companies) + 1);
SELECT setval(pg_get_serial_sequence('projects', 'id'), (SELECT MAX(id) FROM projects) + 1);
SELECT setval(pg_get_serial_sequence('tasks', 'id'), (SELECT MAX(id) FROM tasks) + 1);
SELECT setval(pg_get_serial_sequence('documents', 'id'), (SELECT MAX(id) FROM documents) + 1);
SELECT setval(pg_get_serial_sequence('city_approvals', 'id'), (SELECT MAX(id) FROM city_approvals) + 1);
SELECT setval(pg_get_serial_sequence('activity_log', 'id'), (SELECT MAX(id) FROM activity_log) + 1);

-- Display summary of inserted data
SELECT 
    'Companies' as table_name, 
    COUNT(*) as record_count 
FROM companies
UNION ALL
SELECT 
    'Projects' as table_name, 
    COUNT(*) as record_count 
FROM projects
UNION ALL
SELECT 
    'Tasks' as table_name, 
    COUNT(*) as record_count 
FROM tasks
UNION ALL
SELECT 
    'Documents' as table_name, 
    COUNT(*) as record_count 
FROM documents
UNION ALL
SELECT 
    'City Approvals' as table_name, 
    COUNT(*) as record_count 
FROM city_approvals
UNION ALL
SELECT 
    'Activity Log' as table_name, 
    COUNT(*) as record_count 
FROM activity_log
ORDER BY table_name;
