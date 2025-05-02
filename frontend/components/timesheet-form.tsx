"use client"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { Entry } from "@/components/timesheet"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  project: z.string().min(1, "Project is required"),
  hours: z.number().min(0.1, "Hours must be greater than 0").max(24, "Hours cannot exceed 24"),
  description: z.string().min(1, "Description is required"),
})

type FormValues = z.infer<typeof formSchema>

interface TimesheetFormProps {
  onSubmit: (values: FormValues) => void
  initialValues?: Entry
  onCancel?: () => void
}

// Sample project list - in a real app, this would come from an API or database
const projects = [
  "Website Redesign",
  "Mobile App Development",
  "Marketing Campaign",
  "Internal Tools",
  "Client Support",
]

export function TimesheetForm({ onSubmit, initialValues, onCancel }: TimesheetFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      date: new Date(),
      project: "",
      hours: 0,
      description: "",
    },
  })

  const handleSubmit = (values: FormValues) => {
    onSubmit(values)
    if (!initialValues) {
      form.reset({
        date: new Date(),
        project: "",
        hours: 0,
        description: "",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
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
            name="hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    placeholder="Enter hours worked"
                    {...field}
                    onChange={(e) => {
                      field.onChange(Number.parseFloat(e.target.value) || 0)
                    }}
                  />
                </FormControl>
                <FormDescription>Enter time in hours (e.g., 1.5 for 1 hour and 30 minutes)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the work you did" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{initialValues ? "Update Entry" : "Add Entry"}</Button>
        </div>
      </form>
    </Form>
  )
}
