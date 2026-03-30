import { Router } from 'express';
import { createServiceRequest, getUserServiceRequests, updateServiceRequest } from '../utils/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get user's service requests
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const serviceRequests = await getUserServiceRequests(userId);

    res.json({
      serviceRequests,
    });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new service request
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { verticalId, title, description, category, priority, attachments } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const serviceRequest = await createServiceRequest({
      userId,
      verticalId,
      title,
      description,
      category,
      priority,
      attachments,
    });

    res.status(201).json({
      serviceRequest,
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a service request
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    // First verify the service request belongs to the user
    const userRequests = await getUserServiceRequests(userId);
    const requestExists = userRequests.some(request => request.id === id);

    if (!requestExists) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    const updatedRequest = await updateServiceRequest(id, updates);

    res.json({
      serviceRequest: updatedRequest,
    });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific service request
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const userRequests = await getUserServiceRequests(userId);
    const serviceRequest = userRequests.find(request => request.id === id);

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({
      serviceRequest,
    });
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
