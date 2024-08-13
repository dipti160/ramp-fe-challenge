export type Transaction = {
  id: string
  amount: number
  employee: Employee
  merchant: string
  date: string
  approved: boolean
}

export type Employee = {
  id: string
  firstName: string
  lastName: string
}

export type PaginatedResponse<T> = {
  data: T
  nextPage: number | null
}

export type PaginatedRequestParams = {
  page: number | null
}

export type RequestByEmployeeParams = {
  employeeId: string
}

export type SetTransactionApprovalParams = {
  transactionId: string
  value: boolean
}

export interface TransactionsProps {
  transactions: Transaction[] | null
  onTransactionApproval: (transactionId: string, newValue: boolean) => Promise<void>
}

export type TransactionsComponent = React.FC<TransactionsProps>
