import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth'
import assetRoutes from './routes/assets'
import onboardingRoutes from './routes/onboarding'
import verticalRoutes from './routes/verticals'
import serviceRequestRoutes from './routes/service-requests'
import aiSearchRoutes from './routes/ai-search'
import teamRoutes from './routes/team'
import analyticsRoutes from './routes/analytics'
import aiHubRoutes from './routes/ai-hub'
import settingsRoutes from './routes/settings'
import dashboardRoutes from './routes/dashboard'

// Import the onboarding routes correctly
// import onboardingRoutes from './routes/onboarding'

const app = express()

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/verticals', verticalRoutes)
app.use('/api/service-requests', serviceRequestRoutes)
app.use('/api/ai-search', aiSearchRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ai-hub', aiHubRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

const PORT = Number(process.env.PORT) || 3001

export function startServer(port: number = PORT) {
  const server = app.listen(port, () => {
    console.log(`🚀 ServiceAI Backend Server running on port ${port}`)
    console.log(`📊 Health check: http://localhost:${port}/health`)
    console.log(`🔐 Authentication: http://localhost:${port}/api/auth/*`)
    console.log(`📦 Assets: http://localhost:${port}/api/assets/*`)
    console.log(`🎯 Onboarding: http://localhost:${port}/api/onboarding/*`)
    console.log(`🏢 Verticals: http://localhost:${port}/api/verticals/*`)
    console.log(`🎫 Service Requests: http://localhost:${port}/api/service-requests/*`)
    console.log(`🔍 AI Search: http://localhost:${port}/api/ai-search/*`)
    console.log(`👥 Team Management: http://localhost:${port}/api/team/*`)
    console.log(`📈 Analytics: http://localhost:${port}/api/analytics/*`)
    console.log(`🤖 AI Hub: http://localhost:${port}/api/ai-hub/*`)
    console.log(`⚙️ Settings: http://localhost:${port}/api/settings/*`)
    console.log(`📊 Dashboard: http://localhost:${port}/api/dashboard/*`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`)
    } else {
      console.error('Failed to start server:', error)
    }
    process.exit(1)
  })

  return server
}

if (require.main === module) {
  startServer()
}

export default app
