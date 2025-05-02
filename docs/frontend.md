# Frontend Development Guide

## Overview

The frontend is built using Next.js 13+ with the App Router, React 19, and Tailwind CSS. It uses modern React patterns and best practices for a maintainable and scalable codebase.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API route handlers
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── shared/           # Shared components
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── public/              # Static assets
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Component Architecture

### UI Components

We use a combination of custom components and Radix UI primitives:

```tsx
// Example of a custom button component
import { Button } from "@/components/ui/button"

export function CustomButton({ children, ...props }) {
  return (
    <Button
      className="bg-primary hover:bg-primary/90"
      {...props}
    >
      {children}
    </Button>
  )
}
```

### Form Components

Forms are built using React Hook Form and Zod for validation:

```tsx
// Example of a form component
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema)
  })

  return (
    <Form {...form}>
      {/* Form fields */}
    </Form>
  )
}
```

## State Management

We use React Context for global state management:

```tsx
// Example of a context
import { createContext, useContext } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
```

## API Integration

API calls are handled using custom hooks:

```tsx
// Example of an API hook
import { useQuery } from "@tanstack/react-query"

export function useTimesheets() {
  return useQuery({
    queryKey: ["timesheets"],
    queryFn: () => fetch("/api/timesheets").then(res => res.json())
  })
}
```

## Styling

We use Tailwind CSS for styling:

```tsx
// Example of styled component
export function Card({ children }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {children}
    </div>
  )
}
```

## Best Practices

1. **Component Organization**
   - Keep components small and focused
   - Use composition over inheritance
   - Follow the single responsibility principle

2. **Type Safety**
   - Use TypeScript for all components
   - Define proper interfaces and types
   - Avoid using `any` type

3. **Performance**
   - Use React.memo for expensive components
   - Implement proper loading states
   - Optimize images and assets

4. **Accessibility**
   - Use semantic HTML
   - Implement proper ARIA attributes
   - Ensure keyboard navigation

5. **Testing**
   - Write unit tests for components
   - Test user interactions
   - Implement E2E tests for critical flows

## Common Patterns

### Protected Routes

```tsx
// Example of a protected route
export default function ProtectedPage() {
  const { user } = useAuth()
  
  if (!user) {
    redirect("/login")
  }

  return <div>Protected Content</div>
}
```

### Error Boundaries

```tsx
// Example of an error boundary
export function ErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Loading States

```tsx
// Example of a loading state
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}
```

## Development Workflow

1. Create a new branch for your feature
2. Write tests for new functionality
3. Implement the feature
4. Run the test suite
5. Create a pull request
6. Get code review
7. Merge to main branch

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Clear `.next` directory
   - Run `npm run build` again

2. **Type Errors**
   - Check TypeScript configuration
   - Update type definitions

3. **Styling Issues**
   - Check Tailwind configuration
   - Verify class names

4. **API Integration**
   - Check API endpoints
   - Verify authentication
   - Check network requests 