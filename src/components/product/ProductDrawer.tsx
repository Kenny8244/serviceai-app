import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField, nativeSelectClassName } from "@/components/ui/form-field"
import { X, Save, AlertCircle, CheckCircle } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  category: string
  status: string
  description: string
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  name: string
  sku: string
  price: string
  quantity: string
  category: string
  status: string
  description: string
}

interface ProductDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Product) => void
}

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Beverage",
  "Office Supplies",
  "Home & Garden",
  "Sports",
  "Other"
]

const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Out of Stock"
]

export function ProductDrawer({ isOpen, onClose, onSave }: ProductDrawerProps) {
  console.log("ProductDrawer render - isOpen:", isOpen);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    category: "",
    status: "Active",
    description: ""
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        sku: "",
        price: "",
        quantity: "",
        category: "",
        status: "Active",
        description: ""
      })
      setErrors({})
      setShowSuccess(false)
      setShowDiscardConfirm(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }

      document.addEventListener("keydown", handleTabKey)
      firstElement?.focus()

      return () => document.removeEventListener("keydown", handleTabKey)
    }
  }, [isOpen])

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}

    // Product Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Product name must be at least 3 characters"
    }

    // SKU validation
    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required"
    } else {
      const skuRegex = /^[A-Z]{3}-\d{3}$/
      if (!skuRegex.test(formData.sku.toUpperCase())) {
        newErrors.sku = "SKU must be in format: XXX-### (e.g., ELC-001)"
      } else {
        // Check if SKU already exists
        const existingProducts = JSON.parse(localStorage.getItem("serviceai_products") || "[]")
        const skuExists = existingProducts.some((product: Product) => product.sku === formData.sku.toUpperCase())
        if (skuExists) {
          newErrors.sku = "This SKU already exists"
        }
      }
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = "Price is required"
    } else {
      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        newErrors.price = "Price must be a positive number"
      }
    }

    // Quantity validation
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required"
    } else {
      const quantity = parseInt(formData.quantity)
      if (isNaN(quantity) || quantity < 0) {
        newErrors.quantity = "Quantity must be a non-negative number"
      }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-uppercase SKU
    if (field === "sku") {
      setFormData(prev => ({ ...prev, sku: value.toUpperCase() }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    const hasData = Object.values(formData).some(value => value.trim() !== "")
    if (hasData && !showDiscardConfirm) {
      setShowDiscardConfirm(true)
      return
    }
    onClose()
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Create new product object
      const newProduct: Product = {
        id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        sku: formData.sku.toUpperCase(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        status: formData.status,
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Get existing products from localStorage
      const existingProducts = JSON.parse(localStorage.getItem("serviceai_products") || "[]")
      
      // Add new product
      const updatedProducts = [...existingProducts, newProduct]
      
      // Save to localStorage
      localStorage.setItem("serviceai_products", JSON.stringify(updatedProducts))

      // Show success message
      setShowSuccess(true)

      // Call onSave callback after a brief delay
      setTimeout(() => {
        onSave(newProduct)
        onClose()
      }, 1000)

    } catch (error) {
      console.error("Error saving product:", error)
      alert(`Error saving product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-[500px] bg-background backdrop-blur-glass border-l border-border/50 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Save className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Add New Product</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showSuccess ? (
              <div className="space-y-6">
                <FormField label="Product Name" htmlFor="productName" required error={errors.name}>
                  <Input
                    id="productName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Wireless Mouse"
                    aria-invalid={Boolean(errors.name)}
                  />
                </FormField>

                <FormField label="SKU" htmlFor="productSku" required error={errors.sku}>
                  <Input
                    id="productSku"
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="e.g., ELC-001"
                    aria-invalid={Boolean(errors.sku)}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Price" htmlFor="productPrice" required error={errors.price}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="productPrice"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                        aria-invalid={Boolean(errors.price)}
                      />
                    </div>
                  </FormField>

                  <FormField label="Quantity" htmlFor="productQuantity" required error={errors.quantity}>
                    <Input
                      id="productQuantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="0"
                      aria-invalid={Boolean(errors.quantity)}
                    />
                  </FormField>
                </div>

                <FormField label="Category" htmlFor="productCategory" required error={errors.category}>
                  <select
                    id="productCategory"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className={nativeSelectClassName}
                    aria-invalid={Boolean(errors.category)}
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Status" htmlFor="productStatus">
                  <select
                    id="productStatus"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className={nativeSelectClassName}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Description (optional)" htmlFor="productDescription">
                  <Textarea
                    id="productDescription"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Optional product description..."
                    maxLength={500}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/500 characters
                  </p>
                </FormField>
              </div>
            ) : (
              /* Success State */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 pulse-glow">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Product Added Successfully!</h3>
                <p className="text-muted-foreground text-lg">The new product has been added to your inventory.</p>
                <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-600">✓ Product saved to localStorage</p>
                  <p className="text-sm text-green-600">✓ Dashboard will update automatically</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div className="p-6 border-t border-border/50 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="px-6 backdrop-blur-glass hover:bg-muted/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!validateForm() || isSubmitting}
                  className="px-6 button-glow"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discard Confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Discard Changes?</h3>
                <p className="text-muted-foreground mb-6">
                  You have unsaved changes. Are you sure you want to close without saving?
                </p>
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDiscardConfirm(false)}
                  >
                    Keep Editing
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDiscardConfirm(false)
                      onClose()
                    }}
                    variant="destructive"
                  >
                    Discard Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
