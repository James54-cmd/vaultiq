export const CREATE_MANUAL_TRANSACTION_MUTATION = `
  mutation CreateManualTransaction($input: CreateManualTransactionInput!) {
    createManualTransaction(input: $input) {
      id
      bankName
      merchant
      amount
      status
    }
  }
`;

export const SYNC_GMAIL_TRANSACTIONS_MUTATION = `
  mutation SyncGmailTransactions($input: GmailSyncInput) {
    syncGmailTransactions(input: $input) {
      insertedCount
      transactions {
        id
        bankName
        merchant
        amount
        referenceNumber
      }
    }
  }
`;
