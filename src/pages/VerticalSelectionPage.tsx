import React, { useState } from "react"
import { Button } from "../ui/button"
import { Sparkles, ArrowRight, Store, UtensilsCrossed, ShoppingBag, Building2, Check } from "lucide-react"
import { ThemeToggle } from "../ui/ThemeToggle"

interface Vertical {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  features: string[]
  color: string
}

const verticals: Vertical[] = [
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    description: "Transform your retail operations with AI-powered customer insights and inventory optimization.",
    features: ["Smart Recommendations", "Inventory Management", "Customer Analytics"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    icon: UtensilsCrossed,
    description: "Streamline restaurant operations with intelligent order management and customer service.",
    features: ["Order Optimization", "Menu Analytics", "Staff Scheduling"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "store-market",
    name: "Marketplace",
    icon: Store,
    description: "Optimize marketplace operations with AI-driven vendor management and customer insights.",
    features: ["Vendor Analytics", "Price Optimization", "Customer Segmentation"],
    color: "from-green-500 to-teal-500",
  },
  {
    id: "business",
    name: "Enterprise",
    icon: Building2,
    description: "Custom AI solutions tailored for your unique business needs and workflows.",
    features: ["Custom Workflows", "Advanced Analytics", "Enterprise Security"],
    color: "from-orange-500 to-red-500",
  },
]

interface VerticalSelectionPageProps {
  onBack: () => void
  onVerticalSelect: (verticalId: string) => void
}

export function VerticalSelectionPage({ onBack, onVerticalSelect }: VerticalSelectionPageProps) {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null)

  const handleVerticalSelect = (verticalId: string) => {
    setSelectedVertical(verticalId)
  }

  const handleContinue = () => {
    if (selectedVertical) {
      onVerticalSelect(selectedVertical)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-blue-500 animate-pulse" />
            </div>
            <div className="ml-6 flex-1">
              <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                SimpleServiceAI
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                Choose Your Industry
              </p>
            </div>
            <div className="ml-4">
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Built for Your
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Business Vertical
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Select your industry to unlock AI-powered solutions specifically designed for your business challenges
              and opportunities.
            </p>
          </div>
        </div>

        {/* Vertical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {verticals.map((vertical) => {
            const IconComponent = vertical.icon
            const isSelected = selectedVertical === vertical.id

            return (
              <div
                key={vertical.id}
                onClick={() => handleVerticalSelect(vertical.id)}
                className={`
                  relative cursor-pointer group transition-all duration-300 transform
                  ${isSelected ? "scale-105" : "hover:scale-102"}
                `}
              >
                <div
                  className={`
                    bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border rounded-3xl p-8 h-full shadow-lg
                    transition-all duration-300 hover:shadow-xl
                    ${
                      isSelected
                        ? "border-blue-500 shadow-blue-500/25 ring-2 ring-blue-500/50"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-6 right-6 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}

                  {/* Icon with Gradient Background */}
                  <div className="mb-8">
                    <div
                      className={`
                        w-20 h-20 rounded-2xl bg-gradient-to-br ${vertical.color}
                        flex items-center justify-center mb-6
                        ${isSelected ? "scale-110" : "group-hover:scale-110"}
                        transition-transform duration-300
                      `}
                    >
                      <IconComponent className="h-10 w-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {vertical.name}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                      {vertical.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    {vertical.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`
                            w-2 h-2 rounded-full bg-gradient-to-r ${vertical.color}
                            ${isSelected ? "scale-125" : ""}
                            transition-transform duration-300
                          `}
                        ></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedVertical}
            variant={selectedVertical ? 'default' : 'outline'}
            className={`
              px-12 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 text-black
              ${
                selectedVertical
                  ? "bg-blue-500 hover:bg-blue-100 shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed hover:bg-slate-100"
              }
            `}
          >
            Continue with {selectedVertical ? verticals.find((v) => v.id === selectedVertical)?.name : "your selection"}
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="px-8 py-3 text-base font-medium"
          >
            ← Back to Login
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-600 dark:text-slate-400">
            Need a custom solution?{" "}
            <a href="#" className="text-blue-500 hover:underline font-medium">
              Contact our enterprise team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
