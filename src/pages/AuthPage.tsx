import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField, nativeSelectClassName } from "@/components/ui/form-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowRight, Shield, Zap, Brain, Users } from "lucide-react"
import { apiService, type AuthResponse, type CreateUserRequest, type LoginRequest } from "@/services/api"
import { toAuthMessage } from "@/lib/userFacingError"

interface AuthPageProps {
  onAuthSuccess: (response: AuthResponse, options?: { isNewAccount?: boolean }) => void | Promise<void>
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Signup form fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [companySize, setCompanySize] = useState("")
  const [industry, setIndustry] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (activeTab === "signup") {
      if (password !== confirmPassword) {
        setFormError("Passwords do not match")
        return
      }
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters long")
        return
      }
      if (!firstName || !lastName || !companyName || !phoneNumber) {
        setFormError("Please fill in all required fields")
        return
      }
    }

    setIsLoading(true)

    try {
      let response

      if (activeTab === "signup") {
        const userData: CreateUserRequest = {
          email,
          firstName,
          lastName,
          companyName,
          phoneNumber,
          jobTitle,
          companySize,
          industry,
          password,
        }
        response = await apiService.register(userData)
      } else {
        const credentials: LoginRequest = {
          email,
          password,
        }
        response = await apiService.login(credentials)
      }

      apiService.setAuthToken(response.token)
      await onAuthSuccess(response, { isNewAccount: activeTab === "signup" })
    } catch (error) {
      console.error("Auth error:", error)
      setFormError(toAuthMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemo = async () => {
    setIsLoading(true)
    setFormError(null)

    try {
      const response = await apiService.demoLogin()
      apiService.setAuthToken(response.token)
      await onAuthSuccess(response)
    } catch (error) {
      console.error("Demo login error:", error)
      setFormError(toAuthMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setCompanyName("")
    setPhoneNumber("")
    setJobTitle("")
    setCompanySize("")
    setIndustry("")
    setConfirmPassword("")
    setRememberMe(false)
  }

  const handleTabChange = (tab: "login" | "signup") => {
    setActiveTab(tab)
    setFormError(null)
    clearForm()
  }

  return (
    <div className="min-h-screen bg-background grid-pattern floating-particles">
      <div className="flex min-h-screen">
        {/* Left Panel - Hero Section */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
          <div className="absolute inset-0 gradient-animated opacity-95"></div>
          <div className="absolute inset-0 grid-pattern"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            {/* Logo */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <Sparkles className="h-12 w-12 text-white pulse-glow" />
                  <div className="absolute inset-0 h-12 w-12 bg-blue-500 rounded-full blur-xl opacity-30"></div>
                </div>
                <div className="ml-4">
                  <h1 className="text-5xl font-bold text-white tracking-tight">SimpleServiceAI</h1>
                  <p className="text-white/80 text-lg font-medium">The Future of Service</p>
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-12">
              <div>
                <h2 className="text-6xl font-bold text-white mb-6 leading-tight text-balance">
                  AI-Powered
                  <br />
                  <span className="text-gradient">Service Revolution</span>
                </h2>
                <p className="text-xl text-white/90 max-w-2xl leading-relaxed text-pretty">
                  Transform your business operations with intelligent automation, real-time insights, and seamless
                  customer experiences.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="backdrop-blur-glass rounded-2xl p-6 card-hover">
                  <Brain className="h-8 w-8 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Smart Automation</h3>
                  <p className="text-white/70 text-sm">AI-driven workflows that adapt to your business</p>
                </div>

                <div className="backdrop-blur-glass rounded-2xl p-6 card-hover">
                  <Zap className="h-8 w-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h3>
                  <p className="text-white/70 text-sm">Instant insights for better decision making</p>
                </div>

                <div className="backdrop-blur-glass rounded-2xl p-6 card-hover">
                  <Shield className="h-8 w-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Enterprise Security</h3>
                  <p className="text-white/70 text-sm">Bank-level security for your data</p>
                </div>

                <div className="backdrop-blur-glass rounded-2xl p-6 card-hover">
                  <Users className="h-8 w-8 text-pink-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Team Collaboration</h3>
                  <p className="text-white/70 text-sm">Seamless workflows across departments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-8 relative">
          <div className="absolute inset-0 gradient-hero"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-card/95 backdrop-blur-sm"></div>

          <div className="relative z-10 w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-primary pulse-glow mr-3" />
                <h1 className="text-3xl font-bold text-foreground">SimpleServiceAI</h1>
              </div>
            </div>

            <Card className="backdrop-blur-glass border-border/50 shadow-2xl gradient-card-bg">
              <CardHeader className="space-y-6 pb-8">
                {/* Tab Toggle */}
                <div className="flex bg-muted/50 rounded-xl p-1 backdrop-blur-sm">
                  <button
                    onClick={() => handleTabChange("login")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === "login"
                        ? "bg-primary text-primary-foreground shadow-lg glow-blue"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleTabChange("signup")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === "signup"
                        ? "bg-primary text-primary-foreground shadow-lg glow-blue"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="text-center">
                  <CardTitle className="text-3xl font-bold text-foreground mb-2">
                    {activeTab === "login" ? "Welcome back" : "Get started"}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    {activeTab === "login"
                      ? "Sign in to your SimpleServiceAI workspace"
                      : "Create your SimpleServiceAI account today"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError ? (
                    <div
                      role="alert"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {formError}
                    </div>
                  ) : null}
                  {activeTab === "signup" ? (
                    <>
                      {/* Personal Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="First Name" htmlFor="firstName" required>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Enter your first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                        </FormField>
                        <FormField label="Last Name" htmlFor="lastName" required>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Enter your last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                        </FormField>
                      </div>

                      <FormField label="Company Name" htmlFor="companyName" required>
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Enter your company name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Job Title" htmlFor="jobTitle">
                          <Input
                            id="jobTitle"
                            type="text"
                            placeholder="e.g., CEO, Manager"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                        </FormField>
                        <FormField label="Phone Number" htmlFor="phoneNumber" required>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Company Size" htmlFor="companySize">
                          <select
                            id="companySize"
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            className={`${nativeSelectClassName} h-12 bg-input/50 border-border/50 backdrop-blur-sm`}
                          >
                            <option value="">Select company size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </FormField>
                        <FormField label="Industry" htmlFor="industry">
                          <select
                            id="industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className={`${nativeSelectClassName} h-12 bg-input/50 border-border/50 backdrop-blur-sm`}
                          >
                            <option value="">Select industry</option>
                            <option value="retail">Retail</option>
                            <option value="restaurant">Restaurant & Food Service</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="technology">Technology</option>
                            <option value="finance">Finance</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="education">Education</option>
                            <option value="other">Other</option>
                          </select>
                        </FormField>
                      </div>

                      <FormField label="Business Email" htmlFor="email" required>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Password" htmlFor="password" required>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                        </FormField>
                        <FormField
                          label="Confirm Password"
                          htmlFor="confirmPassword"
                          required
                          error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                        >
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            aria-invalid={Boolean(confirmPassword && password !== confirmPassword)}
                            className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                          />
                        </FormField>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Login Form */}
                      <FormField label="Email address" htmlFor="email">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                        />
                      </FormField>

                      <FormField label="Password" htmlFor="password">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 bg-input/50 border-border/50 backdrop-blur-sm focus:gradient-input-focus transition-all"
                        />
                      </FormField>

                      <div className="flex items-center space-x-2">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-border/50 bg-input/50"
                        />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground">
                          Remember me for 30 days
                        </Label>
                      </div>
                    </>
                  )}

                  <div className="space-y-4 pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base button-glow shine-modern group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                          <span>Please wait...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>{activeTab === "login" ? "Sign in" : "Create account"}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 bg-secondary/50 border-border/50 hover:bg-secondary/70 backdrop-blur-sm font-medium card-hover"
                      onClick={handleDemo}
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Try Demo</span>
                      </div>
                    </Button>
                  </div>
                </form>

                <div className="text-center pt-4">
                  <p className="text-xs text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline font-medium">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
