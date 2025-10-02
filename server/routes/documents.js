import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../database/db.js';
import { authenticateToken, checkProjectAccess } from '../middleware/auth.js';

const router = express.Router();

// Get documents for a project
router.get('/project/:projectId', authenticateToken, checkProjectAccess, (req, res) => {
    try {
        const { latest_only } = req.query;
        
        let documents;
        
        if (latest_only === 'true') {
            // Only show latest versions (for clients/consultants)
            documents = dbHelpers.all(
                `SELECT d.*, u.full_name as uploaded_by_name,
                 (SELECT COUNT(*) FROM documents WHERE parent_document_id = d.id OR id = d.id) as version_count
                 FROM documents d
                 LEFT JOIN users u ON d.uploaded_by = u.id
                 WHERE d.project_id = ? AND d.is_latest = 1
                 ORDER BY d.created_at DESC`,
                [req.params.projectId]
            );
        } else {
            // Show all versions (for admins/members)
            documents = dbHelpers.all(
                `SELECT d.*, u.full_name as uploaded_by_name,
                 COALESCE(pd.name, d.name) as original_name
                 FROM documents d
                 LEFT JOIN users u ON d.uploaded_by = u.id
                 LEFT JOIN documents pd ON d.parent_document_id = pd.id
                 WHERE d.project_id = ?
                 ORDER BY d.name, d.version DESC`,
                [req.params.projectId]
            );
        }
        
        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to get documents' });
    }
});

// Get document version history
router.get('/:id/history', authenticateToken, (req, res) => {
    try {
        // Get the base document
        const document = dbHelpers.get(
            'SELECT * FROM documents WHERE id = ?',
            [req.params.id]
        );
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        // Get all versions of this document
        const versions = dbHelpers.all(
            `SELECT d.*, u.full_name as uploaded_by_name
             FROM documents d
             LEFT JOIN users u ON d.uploaded_by = u.id
             WHERE d.id = ? OR d.parent_document_id = ? OR 
                   (d.parent_document_id IS NOT NULL AND d.parent_document_id = 
                    (SELECT parent_document_id FROM documents WHERE id = ?))
             ORDER BY d.version DESC`,
            [req.params.id, req.params.id, req.params.id]
        );
        
        // Get access log for this document
        const accessLog = dbHelpers.all(
            `SELECT dal.*, u.full_name as user_name
             FROM document_access_log dal
             LEFT JOIN users u ON dal.user_id = u.id
             WHERE dal.document_id = ?
             ORDER BY dal.created_at DESC
             LIMIT 20`,
            [req.params.id]
        );
        
        res.json({
            document,
            versions,
            accessLog
        });
    } catch (error) {
        console.error('Get document history error:', error);
        res.status(500).json({ error: 'Failed to get document history' });
    }
});

// Create document (simulated upload)
router.post('/', authenticateToken, (req, res) => {
    try {
        const {
            project_id,
            name,
            file_type,
            discipline,
            parent_document_id = null
        } = req.body;
        
        if (!project_id || !name || !file_type) {
            return res.status(400).json({ error: 'project_id, name, and file_type are required' });
        }
        
        // Check project access
        const access = dbHelpers.get(
            `SELECT * FROM project_members WHERE project_id = ? AND user_id = ?
             UNION
             SELECT p.id as id, p.id as project_id, p.created_by as user_id, 'owner' as role, datetime('now') as created_at
             FROM projects p WHERE p.id = ? AND p.created_by = ?`,
            [project_id, req.user.id, project_id, req.user.id]
        );
        
        if (!access && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        const documentId = uuidv4();
        let version = 1;
        
        // If this is a new version, update the old one
        if (parent_document_id) {
            const parentDoc = dbHelpers.get(
                'SELECT version FROM documents WHERE id = ?',
                [parent_document_id]
            );
            
            if (parentDoc) {
                version = parentDoc.version + 1;
                
                // Mark old version as not latest
                dbHelpers.run(
                    'UPDATE documents SET is_latest = 0 WHERE id = ?',
                    [parent_document_id]
                );
            }
        }
        
        // Create document record (simulated - no actual file)
        const filePath = `/uploads/${project_id}/${documentId}_${name}`;
        const fileSize = Math.floor(Math.random() * 10000000); // Simulated size
        
        dbHelpers.run(
            `INSERT INTO documents (id, project_id, name, file_path, file_type, file_size, discipline, version, is_latest, parent_document_id, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [documentId, project_id, name, filePath, file_type, fileSize, discipline || null, version, parent_document_id, req.user.id]
        );
        
        // Log the upload
        dbHelpers.run(
            'INSERT INTO document_access_log (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
            [uuidv4(), documentId, req.user.id, 'upload']
        );
        
        // Create notification for project members
        const projectMembers = dbHelpers.all(
            'SELECT user_id FROM project_members WHERE project_id = ?',
            [project_id]
        );
        
        projectMembers.forEach(member => {
            if (member.user_id !== req.user.id) {
                dbHelpers.run(
                    `INSERT INTO notifications (id, user_id, type, title, message, link)
                     VALUES (?, ?, 'document_uploaded', 'New Document Uploaded', ?, ?)`,
                    [uuidv4(), member.user_id, `${name} has been uploaded`, `/documents/${documentId}`]
                );
            }
        });
        
        const document = dbHelpers.get('SELECT * FROM documents WHERE id = ?', [documentId]);
        res.status(201).json(document);
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

// Log document access
router.post('/:id/log-access', authenticateToken, (req, res) => {
    try {
        const { action } = req.body; // 'view' or 'download'
        
        dbHelpers.run(
            'INSERT INTO document_access_log (id, document_id, user_id, action) VALUES (?, ?, ?, ?)',
            [uuidv4(), req.params.id, req.user.id, action || 'view']
        );
        
        res.json({ message: 'Access logged' });
    } catch (error) {
        console.error('Log access error:', error);
        res.status(500).json({ error: 'Failed to log access' });
    }
});

// Delete document
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        // Only admins and document uploader can delete
        const document = dbHelpers.get(
            'SELECT * FROM documents WHERE id = ?',
            [req.params.id]
        );
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        if (document.uploaded_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only document uploader or admin can delete' });
        }
        
        dbHelpers.run('DELETE FROM documents WHERE id = ?', [req.params.id]);
        
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
