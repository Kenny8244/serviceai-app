import { Router, Request, Response } from 'express';
import {
  getUserAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetById,
  createInventoryTransaction,
  getAssetTransactions
} from '../utils/database';
import { CreateAssetRequest, UpdateAssetRequest, InventoryTransactionRequest } from '../models/Asset';

const router = Router();

// Get all assets for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      page = '1',
      limit = '50',
      category,
      supplier,
      location,
      search,
      lowStock
    } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (supplier) filters.supplier = supplier as string;
    if (location) filters.location = location as string;
    if (search) filters.search = search as string;
    if (lowStock === 'true') filters.lowStock = true;

    const assets = await getUserAssets(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      ...filters
    });

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific asset by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const asset = await getAssetById(req.params.id, userId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new asset
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const assetData: CreateAssetRequest = req.body;

    // Validate required fields
    if (!assetData.name || !assetData.category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const asset = await createAsset(userId, assetData);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing asset
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData: UpdateAssetRequest = req.body;

    const asset = await updateAsset(req.params.id, userId, updateData);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an asset (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const deleted = await deleteAsset(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory transactions for an asset
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { page = '1', limit = '50' } = req.query;

    const transactions = await getAssetTransactions(req.params.id, userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching asset transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create an inventory transaction
router.post('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const transactionData: InventoryTransactionRequest = req.body;

    // Validate required fields
    if (!transactionData.transactionType || !transactionData.quantityChange) {
      return res.status(400).json({ error: 'Transaction type and quantity change are required' });
    }

    const transaction = await createInventoryTransaction(userId, transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating inventory transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
