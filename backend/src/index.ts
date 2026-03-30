import app from './server'

// Start the server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 ServiceAI Backend Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth/*`)
  console.log(`📦 Assets: http://localhost:${PORT}/api/assets/*`)
  console.log(`🎯 Onboarding: http://localhost:${PORT}/api/onboarding/*`)
  console.log(`🏢 Verticals: http://localhost:${PORT}/api/verticals/*`)
  console.log(`🎫 Service Requests: http://localhost:${PORT}/api/service-requests/*`)
  console.log(`🔍 AI Search: http://localhost:${PORT}/api/ai-search/*`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})
