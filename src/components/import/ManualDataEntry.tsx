import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, CheckCircle, X, Edit3 } from 'lucide-react'

interface ManualItem {
  id: string
  name: string
  description?: string
  price?: number
  quantity?: number
  category?: string
}

interface ManualDataEntryProps {
  vertical: string
  onItemsAdded?: (items: ManualItem[]) => void
}

export function ManualDataEntry({ vertical, onItemsAdded }: ManualDataEntryProps) {
  const [items, setItems] = useState<ManualItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: ''
    })
    setErrors({})
    setEditingItem(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Price must be a valid number'
    }

    if (formData.quantity && isNaN(Number(formData.quantity))) {
      newErrors.quantity = 'Quantity must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const newItem: ManualItem = {
      id: editingItem || `item_${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: formData.price ? Number(formData.price) : undefined,
      quantity: formData.quantity ? Number(formData.quantity) : undefined,
      category: formData.category.trim() || undefined
    }

    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(item => item.id === editingItem ? newItem : item))
    } else {
      // Add new item
      setItems(prev => [...prev, newItem])
    }

    resetForm()
    setShowForm(false)

    // Trigger callback with all items
    onItemsAdded?.(items)
  }

  const handleEdit = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price?.toString() || '',
        quantity: item.quantity?.toString() || '',
        category: item.category || ''
      })
      setEditingItem(itemId)
      setShowForm(true)
    }
  }

  const handleDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const getItemTypeLabel = () => {
    switch (vertical) {
      case 'retail': return 'Product'
      case 'restaurant': return 'Menu Item'
      case 'store-market': return 'Listing'
      case 'business': return 'Asset'
      default: return 'Item'
    }
  }

  const getPlaceholderText = () => {
    switch (vertical) {
      case 'retail': return 'iPhone 15 Pro, Coffee Mug, etc.'
      case 'restaurant': return 'Grilled Salmon, Caesar Salad, etc.'
      case 'store-market': return 'Handmade Jewelry, Vintage Books, etc.'
      case 'business': return 'Office Equipment, Company Assets, etc.'
      default: return 'Item name'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Edit3 className="h-5 w-5 mr-2" />
            Manual Data Entry
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {getItemTypeLabel()}
          </Button>
        </CardTitle>
        <CardDescription>
          Add {getItemTypeLabel().toLowerCase()}s manually one by one
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add/Edit Form */}
        {showForm && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingItem ? 'Edit' : 'Add New'} {getItemTypeLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name" htmlFor="item-name" required error={errors.name}>
                  <Input
                    id="item-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={getPlaceholderText()}
                    aria-invalid={Boolean(errors.name)}
                  />
                </FormField>

                <FormField label="Description" htmlFor="item-description">
                  <Textarea
                    id="item-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the item"
                    rows={3}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Price" htmlFor="item-price" error={errors.price}>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      aria-invalid={Boolean(errors.price)}
                    />
                  </FormField>

                  <FormField label="Quantity" htmlFor="item-quantity" error={errors.quantity}>
                    <Input
                      id="item-quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      aria-invalid={Boolean(errors.quantity)}
                    />
                  </FormField>
                </div>

                <FormField label="Category" htmlFor="item-category">
                  <Input
                    id="item-category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder={`e.g., ${vertical === 'retail' ? 'Electronics' : vertical === 'restaurant' ? 'Main Course' : 'Category'}`}
                  />
                </FormField>

                {/* Form Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button type="submit">
                    {editingItem ? 'Update' : 'Add'} {getItemTypeLabel()}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Added Items ({items.length})
              </h3>
              <span className="text-sm text-slate-500">
                Click any item to edit
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => handleEdit(item.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description ? (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{item.description}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.price != null ? `$${item.price}` : '—'}</TableCell>
                      <TableCell>{item.quantity != null ? item.quantity : '—'}</TableCell>
                      <TableCell>{item.category || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {items.length} {getItemTypeLabel().toLowerCase()}(s) ready to import! You can add more items or edit existing ones.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !showForm && (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            <Plus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No items added yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              Click "Add {getItemTypeLabel()}" to start adding items manually
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
            Manual Entry Tips:
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Add items one by one for precise control</li>
            <li>• Click any item to edit its details</li>
            <li>• Use categories to organize your items</li>
            <li>• Price and quantity are optional fields</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
