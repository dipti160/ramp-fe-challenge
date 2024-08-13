import { useCallback, useMemo, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading: fetchLoading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)
  const [loading, setLoading] = useState<boolean>(fetchLoading)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
        "paginatedTransactions",
        {
          page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
        }
      )

      if (response) {
        setPaginatedTransactions((previousResponse) => {
          if (previousResponse === null) {
            return response
          }

          return {
            data: [...previousResponse.data, ...response.data],
            nextPage: response.nextPage,
          }
        })
      }
    } catch (err) {
      console.log("Failed to fetch paginated transactions:", err)
    } finally {
      setLoading(false)
    }
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  const hasMoreData = useMemo(() => {
    return paginatedTransactions?.nextPage !== null
  }, [paginatedTransactions])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData, hasMoreData }
}
