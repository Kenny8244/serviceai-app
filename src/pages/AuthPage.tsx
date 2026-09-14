import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormField, nativeSelectClassName } from "@/components/ui/form-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, ArrowRight, Shield, Zap, Brain, Users, Eye, EyeOff } from "lucide-react"
import { apiService, type AuthResponse, type CreateUserRequest, type LoginRequest } from "@/services/api"
import { toAuthMessage } from "@/lib/userFacingError"
import { cn } from "@/lib/utils"

const authInputClassName =
  "h-12 bg-background border-input text-foreground placeholder:text-muted-foreground dark:bg-muted"

function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(authInputClassName, "pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

interface AuthPageProps {
  onAuthSuccess: (
    response: AuthResponse,
    options?: { isNewAccount?: boolean; forceVerticalSelection?: boolean }
  ) => void | Promise<void>
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
          rememberMe,
        }
        response = await apiService.login(credentials)
      }

      apiService.setAuthToken(response.token)
      const isDemoUser = response.user.email.trim().toLowerCase() === "demo@simpleserviceai.com"
      await onAuthSuccess(response, {
        isNewAccount: activeTab === "signup",
        forceVerticalSelection: isDemoUser,
      })
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
      await onAuthSuccess(response, { forceVerticalSelection: true })
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
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Left Panel - Hero Section */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.28),transparent_55%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:24px_24px]" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-4xl font-bold text-white tracking-tight">SimpleServiceAI</h1>
                  <p className="text-slate-300 text-base font-medium">The Future of Service</p>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div>
                <h2 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight text-balance">
                  AI-Powered
                  <br />
                  <span className="text-blue-300">Service Revolution</span>
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl leading-relaxed text-pretty">
                  Transform your business operations with intelligent automation, real-time insights, and seamless
                  customer experiences.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <Brain className="h-7 w-7 text-blue-300 mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1.5">Smart Automation</h3>
                  <p className="text-slate-400 text-sm">AI-driven workflows that adapt to your business</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <Zap className="h-7 w-7 text-sky-300 mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1.5">Real-time Analytics</h3>
                  <p className="text-slate-400 text-sm">Instant insights for better decision making</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <Shield className="h-7 w-7 text-indigo-300 mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1.5">Enterprise Security</h3>
                  <p className="text-slate-400 text-sm">Bank-level security for your data</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <Users className="h-7 w-7 text-blue-200 mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1.5">Team Collaboration</h3>
                  <p className="text-slate-400 text-sm">Seamless workflows across departments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">SimpleServiceAI</h1>
              </div>
            </div>

            <Card className="border-border shadow-xl">
              <CardHeader className="space-y-6 pb-8">
                <div className="flex bg-muted rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => handleTabChange("login")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "login"
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("signup")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "signup"
                        ? "bg-card text-foreground shadow-sm border border-border"
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="First Name" htmlFor="firstName" required>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Enter your first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className={authInputClassName}
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
                            className={authInputClassName}
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
                          className={authInputClassName}
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
                            className={authInputClassName}
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
                            className={authInputClassName}
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Company Size" htmlFor="companySize">
                          <select
                            id="companySize"
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            className={`${nativeSelectClassName} h-12`}
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
                            className={`${nativeSelectClassName} h-12`}
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
                          className={authInputClassName}
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Password" htmlFor="password" required>
                          <PasswordInput
                            id="password"
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                          />
                          <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                        </FormField>
                        <FormField
                          label="Confirm Password"
                          htmlFor="confirmPassword"
                          required
                          error={
                            confirmPassword && password !== confirmPassword
                              ? "Passwords do not match"
                              : undefined
                          }
                        >
                          <PasswordInput
                            id="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                            aria-invalid={Boolean(confirmPassword && password !== confirmPassword)}
                          />
                        </FormField>
                      </div>
                    </>
                  ) : (
                    <>
                      <FormField label="Email address" htmlFor="email">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={authInputClassName}
                        />
                      </FormField>

                      <FormField label="Password" htmlFor="password">
                        <PasswordInput
                          id="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                      </FormField>

                      <div className="flex items-center space-x-2">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-border bg-muted"
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
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Please wait...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>{activeTab === "login" ? "Sign in" : "Create account"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 font-medium"
                      onClick={handleDemo}
                      disabled={isLoading}
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
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
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
