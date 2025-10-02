import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { dbHelpers, initializeDatabase } from '../database/db.js';

dotenv.config();

console.log('🔧 Creating admin user and demo data...');

async function createData() {
    try {
        await initializeDatabase();
        
        const password = await bcrypt.hash('password123', 10);
        
        // Create company
        const companyId = uuidv4();
        console.log('Creating company...');
        dbHelpers.run(
            'INSERT INTO companies (id, name, website, address) VALUES (?, ?, ?, ?)',
            [companyId, 'Stellar Structures Inc.', 'https://stellarstructures.com', '123 Innovation Drive, Metropolis, 12345']
        );
        
        // Create admin user
        const adminId = uuidv4();
        console.log('Creating admin user...');
        dbHelpers.run(
            `INSERT INTO users (id, email, password_hash, full_name, job_title, discipline, role, company_id, email_verified, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
            [adminId, 'admin@stellar.com', password, 'Alex Harper', 'CEO', 'Architecture', 'admin', companyId]
        );
        
        // Create member user
        const userId = uuidv4();
        console.log('Creating member user...');
        dbHelpers.run(
            `INSERT INTO users (id, email, password_hash, full_name, job_title, discipline, role, company_id, email_verified, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
            [userId, 'sarah@stellar.com', password, 'Sarah Chen', 'Project Manager', 'Architecture', 'member', companyId]
        );
        
        // Create notification preferences
        dbHelpers.run('INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)', [uuidv4(), adminId]);
        dbHelpers.run('INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)', [uuidv4(), userId]);
        
        // Create a demo project
        const projectId = uuidv4();
        console.log('Creating demo project...');
        dbHelpers.run(
            `INSERT INTO projects (id, name, description, address, company_id, status, discipline, start_date, deadline, budget, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [projectId, 'Grandview Residences', 'Luxury residential development', '100 Grandview Ave', companyId, 'in_progress', 'Architecture', '2024-01-15', '2024-12-31', 5000000, adminId]
        );
        
        // Add project member
        dbHelpers.run(
            'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
            [uuidv4(), projectId, userId, 'manager']
        );
        
        // Create a demo task
        const taskId = uuidv4();
        console.log('Creating demo task...');
        dbHelpers.run(
            `INSERT INTO tasks (id, project_id, name, description, assigned_to, due_date, status, priority, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [taskId, projectId, 'Review architectural plans', 'Complete review of floor plans', userId, '2024-11-15', 'pending', 'high', adminId]
        );
        
        // Save the database
        db.save();
        
        console.log('\n✅ Demo data created successfully!');
        console.log('\n🔑 Login credentials:');
        console.log('   Email: admin@stellar.com');
        console.log('   Password: password123');
        console.log('\n   OR');
        console.log('\n   Email: sarah@stellar.com');
        console.log('   Password: password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating data:', error);
        process.exit(1);
    }
}

createData();
