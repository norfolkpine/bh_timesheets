"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Customer } from "./customer-management"

const projectFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  customerId: z.string().min(1, "Customer is required"),
  description: z.string().optional(),
  billingType: z.enum(["hourly", "daily", "fixed", "retainer"]).default("hourly"),
  hourlyRate: z.coerce.number().min(0, "Rate must be a positive number").optional(),
  dailyRate: z.coerce.number().min(0, "Rate must be a positive number").optional(),
  fixedPrice: z.coerce.number().min(0, "Price must be a positive number").optional(),
  retainerAmount: z.coerce.number().min(0, "Amount must be a positive number").optional(),
  isActive: z.boolean().default(true),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  onSave: (project: ProjectFormValues) => void
  onCancel: () => void
  initialProject?: Partial<ProjectFormValues>
  customers: Customer[]
}

export function ProjectForm({ onSave, onCancel, initialProject, customers }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialProject?.name || "",
      customerId:
        initialProject?.customerId ||
        initialProject?.customer_object?.uuid ||
        initialProject?.customer ||
        initialProject?.customer_uuid ||
        "",
      description: initialProject?.description || "",
      billingType: (initialProject?.billingType || initialProject?.billing_type || "hourly") as
        | "hourly"
        | "daily"
        | "fixed"
        | "retainer",
      hourlyRate: initialProject?.hourlyRate || initialProject?.hourly_rate || undefined,
      dailyRate: initialProject?.dailyRate || initialProject?.daily_rate || undefined,
      fixedPrice: initialProject?.fixedPrice || initialProject?.fixed_price || undefined,
      retainerAmount: initialProject?.retainerAmount || initialProject?.retainer_amount || undefined,
      isActive:
        initialProject?.isActive !== undefined
          ? initialProject.isActive
          : initialProject?.is_active !== undefined
            ? initialProject.is_active
            : true,
    },
  })

  const handleSubmit = (values: ProjectFormValues) => {
    onSave(values)
  }

  const billingType = form.watch("billingType")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Website Redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers
                        .filter((customer) => customer.isActive || customer.is_active)
                        .map((customer) => (
                          <SelectItem key={customer.uuid} value={customer.uuid}>
                            {customer.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Project description and scope" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="daily">Day Rate</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="retainer">Monthly Retainer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {billingType === "hourly" && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="75.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {billingType === "daily" && (
              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="600.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {billingType === "fixed" && (
              <FormField
                control={form.control}
                name="fixedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixed Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="5000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {billingType === "retainer" && (
              <FormField
                control={form.control}
                name="retainerAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Retainer Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="2000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Save Project
          </Button>
        </div>
      </form>
    </Form>
  )
}
