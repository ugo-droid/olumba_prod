import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import db, { dbHelpers, initializeDatabase } from '../database/db.js';

dotenv.config();

console.log('📄 Adding document demo data...');

async function seedDocuments() {
    try {
        await initializeDatabase();
        
        const projects = dbHelpers.all('SELECT * FROM projects LIMIT 3');
        const users = dbHelpers.all('SELECT * FROM users LIMIT 3');
        
        if (projects.length === 0) {
            console.log('No projects found.');
            process.exit(1);
        }
        
        const documents = [
            {
                id: uuidv4(),
                project_id: projects[0].id,
                name: 'Architectural_Plans_Main.pdf',
                file_path: '/uploads/arch_plans_v3.pdf',
                file_type: 'pdf',
                file_size: 5242880,
                discipline: 'Architectural',
                version: 3,
                is_latest: 1,
                parent_document_id: null,
                uploaded_by: users[0]?.id || projects[0].created_by
            },
            {
                id: uuidv4(),
                project_id: projects[0].id,
                name: 'Structural_Frame.dwg',
                file_path: '/uploads/structural_frame_v1.dwg',
                file_type: 'dwg',
                file_size: 3145728,
                discipline: 'Structural',
                version: 1,
                is_latest: 1,
                parent_document_id: null,
                uploaded_by: users[1]?.id || projects[0].created_by
            },
            {
                id: uuidv4(),
                project_id: projects[0].id,
                name: 'MEP_Model.rvt',
                file_path: '/uploads/mep_model_v2.rvt',
                file_type: 'rvt',
                file_size: 15728640,
                discipline: 'MEP',
                version: 2,
                is_latest: 1,
                parent_document_id: null,
                uploaded_by: users[2]?.id || projects[0].created_by
            }
        ];
        
        documents.forEach(doc => {
            dbHelpers.run(
                `INSERT INTO documents (id, project_id, name, file_path, file_type, file_size, discipline, version, is_latest, parent_document_id, uploaded_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [doc.id, doc.project_id, doc.name, doc.file_path, doc.file_type, doc.file_size, doc.discipline, doc.version, doc.is_latest, doc.parent_document_id, doc.uploaded_by]
            );
        });
        
        console.log('✅ Created', documents.length, 'documents');
        
        // Create older versions for the first document
        const baseDoc = documents[0];
        const olderVersions = [
            {
                id: uuidv4(),
                version: 2,
                uploaded_at: '2025-09-28 10:30:00'
            },
            {
                id: uuidv4(),
                version: 1,
                uploaded_at: '2025-09-25 14:15:00'
            }
        ];
        
        olderVersions.forEach(oldVer => {
            dbHelpers.run(
                `INSERT INTO documents (id, project_id, name, file_path, file_type, file_size, discipline, version, is_latest, parent_document_id, uploaded_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [oldVer.id, baseDoc.project_id, baseDoc.name, baseDoc.file_path.replace('v3', `v${oldVer.version}`), baseDoc.file_type, baseDoc.file_size - 100000, baseDoc.discipline, oldVer.version, baseDoc.id, baseDoc.uploaded_by, oldVer.uploaded_at]
            );
        });
        
        console.log('✅ Created', olderVersions.length, 'older versions');
        
        // Add some access logs
        documents.forEach(doc => {
            ['view', 'download'].forEach(action => {
                dbHelpers.run(
                    'INSERT INTO document_access_log (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
                    [uuidv4(), doc.id, doc.uploaded_by, action]
                );
            });
        });
        
        console.log('✅ Created document access logs');
        
        db.save();
        
        console.log('\n✅ Document demo data created successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding documents:', error);
        process.exit(1);
    }
}

seedDocuments();
