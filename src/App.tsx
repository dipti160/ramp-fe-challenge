import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction, SetTransactionApprovalParams } from "./utils/types"
import { useCustomFetch } from "./hooks/useCustomFetch"

export function App() {
  const { data: employees, loading: employeesLoading, ...employeeUtils } = useEmployees()
  const {
    data: paginatedTransactions,
    loading: transactionsLoading,
    hasMoreData,
    ...paginatedTransactionsUtils
  } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [transactionApprovalState, setTransactionApprovalState] = useState<Record<string, boolean>>({})

  const { fetchWithoutCache } = useCustomFetch() // Ensure fetchWithoutCache is available

  const transactions = useMemo(() => {
    const transactionList = paginatedTransactions?.data ?? transactionsByEmployee ?? null
    return (
      transactionList?.map((transaction) => ({
        ...transaction,
        approved: transactionApprovalState[transaction.id] ?? transaction.approved,
      })) ?? null
    )
  }, [paginatedTransactions, transactionsByEmployee, transactionApprovalState])

  const showViewMoreButton = useMemo(() => {
    return !transactionsByEmployee && hasMoreData
  }, [transactionsByEmployee, hasMoreData])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    try {
      await employeeUtils.fetchAll()
      await paginatedTransactionsUtils.fetchAll()
    } catch (err) {
      console.log("Failed to load all transactions:", err)
    } finally {
      setIsLoading(false)
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      if (!employeeId || employeeId === EMPTY_EMPLOYEE.id) {
        return
      }
      try {
        await transactionsByEmployeeUtils.fetchById(employeeId)
      } catch (err) {
        console.log("Failed to load transactions by employee:", err)
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions()
    }
  }, [employeesLoading, employees, loadAllTransactions])

  const handleEmployeeChange = useCallback(
    async (newValue: Employee | null) => {
      if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions()
      } else {
        await loadTransactionsByEmployee(newValue.id)
      }
    },
    [loadAllTransactions, loadTransactionsByEmployee]
  )

  const handleTransactionApproval = useCallback(
    async (transactionId: string, newValue: boolean) => {
      setTransactionApprovalState((prev) => ({
        ...prev,
        [transactionId]: newValue,
      }))
      try {
        await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
          transactionId,
          value: newValue,
        })
      } catch (err) {
        console.log("Failed to update transaction approval:", err)
      }
    },
    [fetchWithoutCache]
  )

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleEmployeeChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} onTransactionApproval={handleTransactionApproval} />

          {showViewMoreButton && (
            <button
              className="RampButton"
              disabled={transactionsLoading}
              onClick={async () => {
                await paginatedTransactionsUtils.fetchAll()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
