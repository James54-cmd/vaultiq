export const GET_TRANSACTIONS_QUERY = `
  query GetTransactions(
    $bankName: String
    $category: TransactionCategory
    $type: TransactionType
    $status: TransactionStatus
    $search: String
    $period: TransactionOverviewPeriod
  ) {
    transactions(
      bankName: $bankName
      category: $category
      type: $type
      status: $status
      search: $search
    ) {
      id
      source
      sourceId
      type
      direction
      amount
      signedAmount
      currencyCode
      bankName
      bankInitials
      accountId
      accountName
      fromAccountId
      fromAccountName
      toAccountId
      toAccountName
      originalTransactionId
      merchantName
      merchant
      description
      category
      categoryLabel
      referenceNumber
      notes
      status
      kindLabel
      transactionDate
      happenedAt
      createdAt
      updatedAt
      gmailMessageId
      gmailThreadId
    }
    transactionOverview(period: $period) {
      period
      totalBalance
      periodSpending
      remainingBudget
      periodIncome
      periodExpense
      budgetLimit
      categorySpend {
        name
        value
      }
      recentTransactions {
        id
      }
    }
  }
`;
