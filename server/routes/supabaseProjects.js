/**
 * Supabase Projects Routes
 * Handles project CRUD operations using Supabase
 */

import express from 'express';
import { ProjectsService, ActivityLogService, NotificationsService } from '../services/supabaseService.js';
import { authenticateSupabaseToken, requireProjectAccess, requireProjectAdmin } from '../middleware/supabaseAuth.js';

const router = express.Router();

/**
 * Get all projects for the current user
 */
router.get('/', authenticateSupabaseToken, async (req, res) => {
    try {
        const projects = await ProjectsService.getAll(req.user.id);
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch projects',
            details: error.message 
        });
    }
});

/**
 * Get a specific project by ID
 */
router.get('/:id', authenticateSupabaseToken, requireProjectAccess, async (req, res) => {
    try {
        const project = await ProjectsService.getById(req.params.id, req.user.id);
        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch project',
            details: error.message 
        });
    }
});

/**
 * Create a new project
 */
router.post('/', authenticateSupabaseToken, async (req, res) => {
    try {
        const { name, description, start_date, deadline, budget, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const projectData = {
            name,
            description,
            company_id: req.user.company_id,
            start_date,
            deadline,
            budget,
            address,
            status: 'planning'
        };

        const project = await ProjectsService.create(projectData, req.user.id);

        // Log activity
        await ActivityLogService.create({
            user_id: req.user.id,
            entity_type: 'project',
            entity_id: project.id,
            action: 'created',
            description: `Created project "${project.name}"`
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ 
            error: 'Failed to create project',
            details: error.message 
        });
    }
});

/**
 * Update a project
 */
router.put('/:id', authenticateSupabaseToken, requireProjectAccess, async (req, res) => {
    try {
        const allowedUpdates = [
            'name', 'description', 'status', 'start_date', 
            'deadline', 'budget', 'address'
        ];
        
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const project = await ProjectsService.update(req.params.id, updates);

        // Log activity
        await ActivityLogService.create({
            user_id: req.user.id,
            entity_type: 'project',
            entity_id: project.id,
            action: 'updated',
            description: `Updated project "${project.name}"`
        });

        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ 
            error: 'Failed to update project',
            details: error.message 
        });
    }
});

/**
 * Delete a project
 */
router.delete('/:id', authenticateSupabaseToken, requireProjectAdmin, async (req, res) => {
    try {
        // Get project details for logging
        const project = await ProjectsService.getById(req.params.id, req.user.id);
        
        await ProjectsService.delete(req.params.id);

        // Log activity
        await ActivityLogService.create({
            user_id: req.user.id,
            entity_type: 'project',
            entity_id: req.params.id,
            action: 'deleted',
            description: `Deleted project "${project.name}"`
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ 
            error: 'Failed to delete project',
            details: error.message 
        });
    }
});

/**
 * Add a member to a project
 */
router.post('/:id/members', authenticateSupabaseToken, requireProjectAdmin, async (req, res) => {
    try {
        const { user_id, role = 'member' } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const member = await ProjectsService.addMember(
            req.params.id, 
            user_id, 
            role, 
            req.user.id
        );

        // Create notification for the new member
        await NotificationsService.create({
            user_id,
            type: 'project_invite',
            title: 'Added to Project',
            message: `You have been added to a project by ${req.user.full_name}`,
            link: `/project-detail.html?id=${req.params.id}`
        });

        // Log activity
        await ActivityLogService.create({
            user_id: req.user.id,
            entity_type: 'project',
            entity_id: req.params.id,
            action: 'member_added',
            description: `Added member to project`
        });

        res.status(201).json(member);
    } catch (error) {
        console.error('Add project member error:', error);
        res.status(500).json({ 
            error: 'Failed to add project member',
            details: error.message 
        });
    }
});

/**
 * Remove a member from a project
 */
router.delete('/:id/members/:userId', authenticateSupabaseToken, requireProjectAdmin, async (req, res) => {
    try {
        await ProjectsService.removeMember(req.params.id, req.params.userId);

        // Log activity
        await ActivityLogService.create({
            user_id: req.user.id,
            entity_type: 'project',
            entity_id: req.params.id,
            action: 'member_removed',
            description: `Removed member from project`
        });

        res.json({ message: 'Project member removed successfully' });
    } catch (error) {
        console.error('Remove project member error:', error);
        res.status(500).json({ 
            error: 'Failed to remove project member',
            details: error.message 
        });
    }
});

/**
 * Get project activity log
 */
router.get('/:id/activity', authenticateSupabaseToken, requireProjectAccess, async (req, res) => {
    try {
        const activities = await ActivityLogService.getByProject(req.params.id);
        res.json(activities);
    } catch (error) {
        console.error('Get project activity error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch project activity',
            details: error.message 
        });
    }
});

export default router;
