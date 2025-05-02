"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/lib/api-client"

export function ApiTest() {
  const [result, setResult] = useState<string>("No test run yet")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Try a simple GET request to the server root
      const response = await apiClient.get("/")
      setResult(JSON.stringify(response.data, null, 2))
    } catch (err) {
      console.error("API test failed:", err)
      setError(`Error: ${err.message || "Unknown error"}`)

      // Try a direct fetch as fallback
      try {
        const response = await fetch("http://127.0.0.1:8000/api/")
        const text = await response.text()
        setResult(`Direct fetch result: ${text}`)
      } catch (fetchErr) {
        setError(`Both axios and fetch failed. Fetch error: ${fetchErr.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test API Connection"}
        </Button>

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>}

        <div className="mt-4 p-4 bg-gray-50 border rounded-md">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
