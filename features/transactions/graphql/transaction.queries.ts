export const GET_TRANSACTIONS_QUERY = `
  query GetTransactions(
    $bankName: SupportedBank
    $category: TransactionCategory
    $direction: TransactionDirection
    $status: TransactionStatus
    $search: String
  ) {
    transactions(
      bankName: $bankName
      category: $category
      direction: $direction
      status: $status
      search: $search
    ) {
      id
      source
      direction
      amount
      signedAmount
      currencyCode
      bankName
      bankInitials
      merchant
      description
      category
      categoryLabel
      referenceNumber
      notes
      status
      kindLabel
      happenedAt
      createdAt
      updatedAt
      gmailMessageId
      gmailThreadId
    }
    transactionOverview {
      totalBalance
      monthlySpending
      remainingBudget
      monthlyIncome
      monthlyExpense
      budgetLimit
      categorySpend {
        name
        value
      }
    }
  }
`;
