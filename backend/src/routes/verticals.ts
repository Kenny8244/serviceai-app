import { Router, Response } from 'express';
import { getVerticals, selectVertical, getUserVertical } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest, SelectVerticalBody, UserVertical } from '../types';

const router = Router();

// Get all available verticals
router.get('/', async (req, res) => {
  try {
    const verticals = await getVerticals();
    res.json({
      verticals,
    });
  } catch (error) {
    console.error('Get verticals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Select a vertical for the authenticated user
router.post<{}, Response, SelectVerticalBody>(
  '/select', 
  authenticateToken, 
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { verticalId } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!verticalId) {
        return res.status(400).json({ error: 'Vertical ID is required' });
      }

      const selectedVertical = await selectVertical(userId, verticalId);
      res.json(selectedVertical);
    } catch (error) {
      console.error('Select vertical error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get the currently selected vertical for the authenticated user
router.get('/selected', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userVertical = await getUserVertical(userId);
    res.json(userVertical);
  } catch (error) {
    console.error('Get selected vertical error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
