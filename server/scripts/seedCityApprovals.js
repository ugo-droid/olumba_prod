import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import db, { dbHelpers, initializeDatabase } from '../database/db.js';

dotenv.config();

console.log('🏛️ Adding city approval demo data...');

async function seedCityApprovals() {
    try {
        // Initialize database first
        await initializeDatabase();
        
        // Get existing projects and users
        const projects = dbHelpers.all('SELECT * FROM projects LIMIT 3');
        const users = dbHelpers.all('SELECT * FROM users WHERE role IN ("admin", "member") LIMIT 3');
        
        if (projects.length === 0) {
            console.log('No projects found. Please create projects first.');
            process.exit(1);
        }
        
        // Create city approvals
        const approvals = [
            {
                id: uuidv4(),
                project_id: projects[0].id,
                submittal_name: 'Building Permit Application',
                submission_date: '2024-07-15',
                status: 'submitted',
                city_official: 'Emily Carter',
                deadline: '2024-08-15',
                notes: 'Initial permit application for residential development',
                created_by: users[0]?.id || projects[0].created_by
            },
            {
                id: uuidv4(),
                project_id: projects[0].id,
                submittal_name: 'Structural Plan Review',
                submission_date: '2024-07-20',
                status: 'under_review',
                city_official: 'David Lee',
                deadline: '2024-08-20',
                notes: 'Structural engineering plans for main building',
                created_by: users[0]?.id || projects[0].created_by
            },
            {
                id: uuidv4(),
                project_id: projects.length > 1 ? projects[1].id : projects[0].id,
                submittal_name: 'Environmental Impact Study',
                submission_date: '2024-07-25',
                status: 'corrections_required',
                city_official: 'Sarah Jones',
                deadline: '2024-08-25',
                notes: 'Environmental review required additional documentation',
                created_by: users[0]?.id || projects[0].created_by
            },
            {
                id: uuidv4(),
                project_id: projects.length > 2 ? projects[2].id : projects[0].id,
                submittal_name: 'Fire Safety Plan',
                submission_date: '2024-08-01',
                status: 'approved',
                city_official: 'Michael Brown',
                deadline: '2024-09-01',
                notes: 'Fire safety and emergency exit plans',
                created_by: users[0]?.id || projects[0].created_by
            }
        ];
        
        approvals.forEach(approval => {
            dbHelpers.run(
                `INSERT INTO city_approvals (id, project_id, submittal_name, submission_date, status, city_official, deadline, notes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [approval.id, approval.project_id, approval.submittal_name, approval.submission_date, approval.status, approval.city_official, approval.deadline, approval.notes, approval.created_by]
            );
        });
        
        console.log('✅ Created', approvals.length, 'city approvals');
        
        // Add corrections to the "corrections_required" approval
        const correctionsApproval = approvals.find(a => a.status === 'corrections_required');
        
        if (correctionsApproval && users.length > 0) {
            const corrections = [
                {
                    id: uuidv4(),
                    approval_id: correctionsApproval.id,
                    description: 'Update drainage calculations on pages 15-17',
                    status: 'pending',
                    assigned_to: users[1]?.id || users[0].id,
                    due_date: '2024-08-10'
                },
                {
                    id: uuidv4(),
                    approval_id: correctionsApproval.id,
                    description: 'Provide additional noise impact data',
                    status: 'in_progress',
                    assigned_to: users[2]?.id || users[0].id,
                    due_date: '2024-08-12'
                },
                {
                    id: uuidv4(),
                    approval_id: correctionsApproval.id,
                    description: 'Submit updated traffic study',
                    status: 'resolved',
                    assigned_to: users[0].id,
                    due_date: '2024-08-08'
                }
            ];
            
            corrections.forEach(corr => {
                dbHelpers.run(
                    `INSERT INTO corrections (id, approval_id, description, status, assigned_to, due_date)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [corr.id, corr.approval_id, corr.description, corr.status, corr.assigned_to, corr.due_date]
                );
            });
            
            console.log('✅ Created', corrections.length, 'corrections');
        }
        
        // Save database
        db.save();
        
        console.log('\n✅ City approval demo data created successfully!');
        console.log('📍 View at: http://localhost:3000/city-approvals.html');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding city approvals:', error);
        process.exit(1);
    }
}

seedCityApprovals();
