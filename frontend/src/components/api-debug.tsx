"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/lib/api-client"

export function ApiDebug() {
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTimesheets = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.get("/timesheets/")
      setResponse(result.data)
      console.log("API Response:", result.data)
    } catch (err) {
      console.error("API Error:", err)
      setError(`Error: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>API Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchTimesheets} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch Timesheets"}
        </Button>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>}

        {response && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Response Type: {typeof response}</h3>
            <h3 className="font-medium mb-2">Is Array: {Array.isArray(response) ? "Yes" : "No"}</h3>

            {typeof response === "object" && !Array.isArray(response) && (
              <div>
                <h3 className="font-medium mb-2">Object Keys:</h3>
                <ul className="list-disc pl-5">
                  {Object.keys(response).map((key) => (
                    <li key={key}>
                      {key}: {typeof response[key]}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 border rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(response, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
