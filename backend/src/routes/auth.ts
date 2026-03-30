import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { CreateUserRequest, LoginRequest } from '../models/User';
import { findUserByEmail, createUser } from '../utils/database';
import { generateToken, getTokenExpiration } from '../utils/jwt';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: CreateUserRequest = req.body;

    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'companyName', 'phoneNumber', 'password'];
    for (const field of requiredFields) {
      if (!userData[field as keyof CreateUserRequest]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Validate password length
    if (userData.password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const newUser = await createUser({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyName: userData.companyName,
      phoneNumber: userData.phoneNumber,
      jobTitle: userData.jobTitle,
      companySize: userData.companySize,
      industry: userData.industry,
      passwordHash,
    });

    // Generate token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Return user data (without password hash) and token
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      user: userWithoutPassword,
      token,
      expiresAt: getTokenExpiration(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Return user data (without password hash) and token
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token,
      expiresAt: getTokenExpiration(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Demo endpoint (for demo mode)
router.post('/demo', async (req: Request, res: Response) => {
  try {
    // Create a demo user
    const demoUser = await createUser({
      email: 'demo@simpleserviceai.com',
      firstName: 'Demo',
      lastName: 'User',
      companyName: 'Demo Company',
      phoneNumber: '+1 (555) 123-4567',
      jobTitle: 'Demo Manager',
      companySize: '11-50',
      industry: 'technology',
      passwordHash: await bcrypt.hash('demo123', 10),
    });

    // Generate token
    const token = generateToken({
      userId: demoUser.id,
      email: demoUser.email,
    });

    // Return user data (without password hash) and token
    const { passwordHash: _, ...userWithoutPassword } = demoUser;
    
    res.json({
      user: userWithoutPassword,
      token,
      expiresAt: getTokenExpiration(),
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

