export const TRANSACTION_FIELDS_FRAGMENT = `
  fragment TransactionFields on Transaction {
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
`;
