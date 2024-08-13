import { useCallback, useState } from "react"
import { Employee } from "../utils/types"
import { useCustomFetch } from "./useCustomFetch"
import { EmployeeResult } from "./types"

export function useEmployees(): EmployeeResult {
  const { fetchWithCache, loading: fetchLoading } = useCustomFetch()
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [loading, setLoading] = useState<boolean>(fetchLoading)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const employeesData = await fetchWithCache<Employee[]>("employees")
      setEmployees(employeesData)
    } catch (err) {
      console.log("Failed to fetch employees:", err)
    } finally {
      setLoading(false)
    }
  }, [fetchWithCache])

  const invalidateData = useCallback(() => {
    setEmployees(null)
  }, [])

  return { data: employees, loading, fetchAll, invalidateData }
}
