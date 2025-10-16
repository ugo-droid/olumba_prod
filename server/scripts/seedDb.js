import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { dbHelpers } from '../database/db.js';

dotenv.config();

console.log('🌱 Seeding Olumba database with demo data...');

async function seedDatabase() {
    const password = await bcrypt.hash('password123', 10);
    
    // Create demo companies
    const companies = [
        { id: uuidv4(), name: 'Stellar Structures Inc.', website: 'https://stellarstructures.com', address: '123 Innovation Drive, Metropolis, 12345' },
        { id: uuidv4(), name: 'BuildStream Co.', website: 'https://buildstream.com', address: '456 Main Street, Metropolis, 12345' },
        { id: uuidv4(), name: 'GreenTech Solutions', website: 'https://greentech.com', address: '789 Eco Lane, Metropolis, 12345' }
    ];
    
    const insertCompany = db.prepare('INSERT INTO companies (id, name, website, address) VALUES (?, ?, ?, ?)');
    companies.forEach(company => {
        insertCompany.run(company.id, company.name, company.website, company.address);
    });
    
    console.log('✅ Created', companies.length, 'companies');
    
    // Create demo users
    const users = [
        { id: uuidv4(), email: 'admin@stellar.com', full_name: 'Alex Harper', job_title: 'CEO', discipline: 'Architecture', role: 'admin', company_id: companies[0].id },
        { id: uuidv4(), email: 'sarah@stellar.com', full_name: 'Sarah Chen', job_title: 'Project Manager', discipline: 'Architecture', role: 'member', company_id: companies[0].id },
        { id: uuidv4(), email: 'david@stellar.com', full_name: 'David Lee', job_title: 'Architect', discipline: 'Architecture', role: 'member', company_id: companies[0].id },
        { id: uuidv4(), email: 'emily@stellar.com', full_name: 'Emily Wong', job_title: 'Engineer', discipline: 'Structural Engineering', role: 'member', company_id: companies[0].id },
        { id: uuidv4(), email: 'consultant@greentech.com', full_name: 'Michael Brown', job_title: 'MEP Consultant', discipline: 'MEP Engineering', role: 'consultant', company_id: companies[2].id },
        { id: uuidv4(), email: 'client@buildstream.com', full_name: 'Sophia Carter', job_title: 'Property Developer', discipline: null, role: 'client', company_id: companies[1].id }
    ];
    
    const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, full_name, job_title, discipline, role, company_id, email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, \'active\')');
    users.forEach(user => {
        insertUser.run(user.id, user.email, password, user.full_name, user.job_title, user.discipline, user.role, user.company_id);
    });
    
    console.log('✅ Created', users.length, 'users (all with password: password123)');
    
    // Create demo projects
    const projects = [
        {
            id: uuidv4(),
            name: 'Grandview Residences',
            description: 'Luxury residential development with 50 units',
            address: '100 Grandview Ave, Metropolis',
            company_id: companies[0].id,
            status: 'in_progress',
            discipline: 'Architecture',
            start_date: '2024-01-15',
            deadline: '2024-12-31',
            budget: 5000000,
            created_by: users[0].id
        },
        {
            id: uuidv4(),
            name: 'Lakeside Commercial',
            description: 'Mixed-use commercial and retail space',
            address: '200 Lakeside Blvd, Metropolis',
            company_id: companies[0].id,
            status: 'completed',
            discipline: 'Commercial',
            start_date: '2023-06-01',
            deadline: '2024-07-20',
            budget: 8000000,
            created_by: users[0].id
        },
        {
            id: uuidv4(),
            name: 'Mountain View Estates',
            description: 'Sustainable hillside residential community',
            address: '300 Mountain View Rd, Metropolis',
            company_id: companies[0].id,
            status: 'on_hold',
            discipline: 'Architecture',
            start_date: '2024-03-01',
            deadline: '2025-09-30',
            budget: 12000000,
            created_by: users[0].id
        }
    ];
    
    const insertProject = db.prepare('INSERT INTO projects (id, name, description, address, company_id, status, discipline, start_date, deadline, budget, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    projects.forEach(project => {
        insertProject.run(project.id, project.name, project.description, project.address, project.company_id, project.status, project.discipline, project.start_date, project.deadline, project.budget, project.created_by);
    });
    
    console.log('✅ Created', projects.length, 'projects');
    
    // Add project members
    const projectMembers = [
        { id: uuidv4(), project_id: projects[0].id, user_id: users[1].id, role: 'manager' },
        { id: uuidv4(), project_id: projects[0].id, user_id: users[2].id, role: 'architect' },
        { id: uuidv4(), project_id: projects[0].id, user_id: users[3].id, role: 'engineer' },
        { id: uuidv4(), project_id: projects[0].id, user_id: users[4].id, role: 'consultant' },
        { id: uuidv4(), project_id: projects[0].id, user_id: users[5].id, role: 'client' }
    ];
    
    const insertProjectMember = db.prepare('INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)');
    projectMembers.forEach(member => {
        insertProjectMember.run(member.id, member.project_id, member.user_id, member.role);
    });
    
    console.log('✅ Created', projectMembers.length, 'project member assignments');
    
    // Create demo tasks
    const tasks = [
        {
            id: uuidv4(),
            project_id: projects[0].id,
            name: 'Finalize structural drawings',
            description: 'Complete and review all structural engineering drawings',
            assigned_to: users[2].id,
            due_date: '2024-10-25',
            status: 'overdue',
            priority: 'high',
            created_by: users[1].id
        },
        {
            id: uuidv4(),
            project_id: projects[0].id,
            name: 'Submit permit application',
            description: 'Prepare and submit all required permits to the city',
            assigned_to: users[1].id,
            due_date: '2024-11-05',
            status: 'pending',
            priority: 'high',
            created_by: users[1].id
        },
        {
            id: uuidv4(),
            project_id: projects[0].id,
            name: 'Review electrical plans',
            description: 'Review and approve MEP electrical drawings',
            assigned_to: users[3].id,
            due_date: '2024-11-10',
            status: 'completed',
            priority: 'medium',
            created_by: users[1].id
        }
    ];
    
    const insertTask = db.prepare('INSERT INTO tasks (id, project_id, name, description, assigned_to, due_date, status, priority, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    tasks.forEach(task => {
        insertTask.run(task.id, task.project_id, task.name, task.description, task.assigned_to, task.due_date, task.status, task.priority, task.created_by);
    });
    
    console.log('✅ Created', tasks.length, 'tasks');
    
    // Create notification preferences for all users
    const insertNotificationPrefs = db.prepare('INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)');
    users.forEach(user => {
        insertNotificationPrefs.run(uuidv4(), user.id);
    });
    
    console.log('✅ Created notification preferences for all users');
    
    console.log('\n📊 Database seeded successfully!');
    console.log('\n🔑 Demo Credentials:');
    console.log('   Admin: admin@stellar.com / password123');
    console.log('   User: sarah@stellar.com / password123');
    console.log('   Consultant: consultant@greentech.com / password123');
    console.log('   Client: client@buildstream.com / password123');
}

try {
    seedDatabase();
    process.exit(0);
} catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
}
