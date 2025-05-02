"use client"

import { SimpleTimesheet } from "@/components/simple-timesheet"
import ProtectedRoute from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <SimpleTimesheet />
    </ProtectedRoute>
  )
}
