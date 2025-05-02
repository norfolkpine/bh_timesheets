"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { Customer, CustomerCreate, CustomerUpdate } from "@/types/customer"

interface CustomerFormProps {
  onSave: (data: CustomerCreate | CustomerUpdate) => Promise<void>
  onCancel: () => void
  initialCustomer?: Customer
}

export function CustomerForm({ onSave, onCancel, initialCustomer }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerCreate>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  })

  useEffect(() => {
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.name,
        contactName: initialCustomer.contactName || "",
        email: initialCustomer.email || "",
        phone: initialCustomer.phone || "",
        address: initialCustomer.address || "",
        notes: initialCustomer.notes || "",
        isActive: initialCustomer.isActive,
      })
    }
  }, [initialCustomer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const handleChange = (field: keyof CustomerCreate, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="h-20"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="h-32"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Customer</Button>
      </div>
    </form>
  )
}
