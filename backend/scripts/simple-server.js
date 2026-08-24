const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'SimpleServiceAI Backend is running!'
  });
});

// Test auth endpoint
app.post('/api/auth/demo', (req, res) => {
  res.json({
    user: {
      id: 'demo-user-123',
      email: 'demo@simpleserviceai.com',
      firstName: 'Demo',
      lastName: 'User',
      companyName: 'Demo Company'
    },
    token: 'demo-token-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
});

// Test team endpoint
app.get('/api/team', (req, res) => {
  res.json({
    teamMembers: [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        role: 'admin',
        status: 'online',
        lastActive: new Date().toISOString(),
        joinDate: new Date('2024-01-15').toISOString(),
        permissions: ['all'],
        expertise: ['technical', 'management', 'strategy'],
        workload: 75,
        stats: {
          ticketsResolved: 147,
          avgResponseTime: '2.3h',
          satisfaction: 4.8
        }
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        role: 'manager',
        status: 'away',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        joinDate: new Date('2024-02-01').toISOString(),
        permissions: ['manage_team', 'manage_tickets'],
        expertise: ['customer_service', 'workflow_optimization', 'team_leadership'],
        workload: 60,
        stats: {
          ticketsResolved: 89,
          avgResponseTime: '1.8h',
          satisfaction: 4.6
        }
      },
      {
        id: '3',
        name: 'Emily Davis',
        email: 'emily@company.com',
        role: 'agent',
        status: 'online',
        lastActive: new Date().toISOString(),
        joinDate: new Date('2024-03-10').toISOString(),
        permissions: ['resolve_tickets', 'communicate'],
        expertise: ['customer_support', 'product_knowledge', 'troubleshooting'],
        workload: 45,
        stats: {
          ticketsResolved: 156,
          avgResponseTime: '3.2h',
          satisfaction: 4.9
        }
      },
      {
        id: '4',
        name: 'Alex Rodriguez',
        email: 'alex@company.com',
        role: 'agent',
        status: 'offline',
        lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        joinDate: new Date('2024-03-15').toISOString(),
        permissions: ['resolve_tickets', 'communicate'],
        expertise: ['technical_support', 'system_administration', 'networking'],
        workload: 80,
        stats: {
          ticketsResolved: 73,
          avgResponseTime: '4.1h',
          satisfaction: 4.4
        }
      }
    ]
  });
});

// Dashboard Widget Endpoints
app.get('/api/dashboard/products/count', (req, res) => {
  try {
    // For demo purposes, we'll use a simple in-memory store
    // In a real app, this would be a database query
    const fs = require('fs');
    const path = require('path');

    // Try to read products from a JSON file (create if doesn't exist)
    const productsFile = path.join(__dirname, 'data', 'products.json');
    let products = [];

    try {
      if (fs.existsSync(productsFile)) {
        const data = fs.readFileSync(productsFile, 'utf8');
        products = JSON.parse(data);
      }
    } catch (error) {
      console.log('No products file found, starting with empty array');
    }

    const count = products.length;

    // Calculate change (for demo, just use the same logic as before)
    const previousCount = Math.max(0, count - 12); // Mock previous count
    const change = count - previousCount;
    const percentage = previousCount > 0 ? (change / previousCount) * 100 : 0;

    res.json({
      count: count,
      change: { value: change, percentage: Math.round(percentage * 10) / 10 },
      trend: change >= 0 ? 'up' : 'down'
    });
  } catch (error) {
    console.error('Error getting products count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/customers/active', (req, res) => {
  res.json({
    count: 892,
    change: { value: -3, percentage: -1.2 },
    trend: 'down'
  });
});

app.get('/api/dashboard/revenue/monthly', (req, res) => {
  const monthlyData = [
    { month: 'Jan', revenue: 45000, timestamp: new Date('2024-01-01').toISOString() },
    { month: 'Feb', revenue: 52000, timestamp: new Date('2024-02-01').toISOString() },
    { month: 'Mar', revenue: 48000, timestamp: new Date('2024-03-01').toISOString() },
    { month: 'Apr', revenue: 61000, timestamp: new Date('2024-04-01').toISOString() },
    { month: 'May', revenue: 55000, timestamp: new Date('2024-05-01').toISOString() },
    { month: 'Jun', revenue: 67000, timestamp: new Date('2024-06-01').toISOString() }
  ];
  res.json({
    data: monthlyData,
    total: monthlyData.reduce((sum, item) => sum + item.revenue, 0)
  });
});

app.post('/api/products', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const newProduct = req.body;

    // Validate required fields
    if (!newProduct.name || !newProduct.sku || !newProduct.price || !newProduct.quantity || !newProduct.category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Read existing products
    const productsFile = path.join(__dirname, 'data', 'products.json');
    let products = [];

    try {
      if (fs.existsSync(productsFile)) {
        const data = fs.readFileSync(productsFile, 'utf8');
        products = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading products file:', error);
    }

    // Check if SKU already exists
    const skuExists = products.some(p => p.sku === newProduct.sku);
    if (skuExists) {
      return res.status(409).json({ error: 'SKU already exists' });
    }

    // Add timestamps
    newProduct.id = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    newProduct.createdAt = new Date().toISOString();
    newProduct.updatedAt = new Date().toISOString();

    // Add to products array
    products.push(newProduct);

    // Write back to file
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });

  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recent Activity Endpoint
app.get('/api/dashboard/activity/recent', (req, res) => {
  const recentActivities = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      action: 'ticket_resolved',
      user: 'Sarah Johnson',
      details: 'Resolved service request #1247',
      type: 'success'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      action: 'user_login',
      user: 'Mike Chen',
      details: 'User logged into dashboard',
      type: 'info'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      action: 'product_created',
      user: 'Emily Davis',
      details: 'Created new product SKU-789',
      type: 'info'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      action: 'system_alert',
      user: 'System',
      details: 'High memory usage detected',
      type: 'warning'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
      action: 'revenue_milestone',
      user: 'System',
      details: 'Monthly revenue target achieved',
      type: 'success'
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 78 * 60 * 1000).toISOString(),
      action: 'customer_signup',
      user: 'Alex Rodriguez',
      details: 'New customer registered',
      type: 'info'
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      action: 'ticket_escalated',
      user: 'Sarah Johnson',
      details: 'Ticket #1245 escalated to urgent',
      type: 'warning'
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 112 * 60 * 1000).toISOString(),
      action: 'backup_completed',
      user: 'System',
      details: 'Daily backup completed successfully',
      type: 'success'
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
      action: 'api_rate_limit',
      user: 'System',
      details: 'API rate limit exceeded',
      type: 'warning'
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 158 * 60 * 1000).toISOString(),
      action: 'user_role_updated',
      user: 'Mike Chen',
      details: 'Updated user permissions',
      type: 'info'
    }
  ];
  res.json({
    activities: recentActivities,
    total: recentActivities.length
  });
});

// AI Assistant Endpoint
app.post('/api/assistant/query', (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      error: 'Query parameter is required and must be a string'
    });
  }

  // Mock AI responses based on query keywords
  let response = {
    answer: '',
    source: 'dashboard',
    confidence: 0.85
  };

  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('product') || lowerQuery.includes('inventory')) {
    response.answer = 'You currently have ' + (1247) + ' products in your inventory. The top selling category this month is electronics with 45% ';
    response.source = 'dashboard/products';
  } else if (lowerQuery.includes('customer') || lowerQuery.includes('user')) {
    response.answer = 'You have ' + (892) + ' active customers, with ' + (67) + ' new signups this month. Customer satisfaction score is currently ' + (4.7) + ' out of 5.';
    response.source = 'dashboard/customers';
  } else if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('money')) {
    response.answer = 'Monthly revenue is trending upward with $' + (67000) + ' this month, representing a ' + (22) + '% increase from last month. Total revenue this year is $' + (328000) + '.';
    response.source = 'dashboard/revenue';
  } else if (lowerQuery.includes('team') || lowerQuery.includes('employee') || lowerQuery.includes('staff')) {
    response.answer = 'Your team consists of ' + (4) + ' members: ' + (1) + ' admin, ' + (1) + ' manager, and ' + (2) + ' agents. Average workload is ' + (65) + '% and team satisfaction is ' + (4.6) + ' out of 5.';
    response.source = 'dashboard/team';
  } else if (lowerQuery.includes('ticket') || lowerQuery.includes('support') || lowerQuery.includes('issue')) {
    response.answer = 'You have 23 open service tickets, with 8 marked as high priority. Average resolution time is 2.8 hours.';
    response.source = 'dashboard/tickets';
  } else {
    response.answer = 'I can help you with information about products, customers, revenue, team members, or service tickets. What specific area would you like to know more about?';
    response.source = 'general';
  }

  res.json(response);
});

app.listen(PORT, () => {
  console.log("🚀 SimpleServiceAI Backend running on port " + PORT);
  console.log("📊 Health check: http://localhost:" + PORT + "/health");
});





