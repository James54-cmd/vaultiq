export const CREATE_MANUAL_TRANSACTION_MUTATION = `
  mutation CreateManualTransaction($input: CreateTransactionInput!) {
    createManualTransaction(input: $input) {
      id
      accountName
      merchantName
      type
      amount
      status
    }
  }
`;

export const SYNC_GMAIL_TRANSACTIONS_MUTATION = `
  mutation SyncGmailTransactions($input: GmailSyncInput) {
    syncGmailTransactions(input: $input) {
      query
      daysBack
      pagesFetched
      matchedMessageCount
      existingMessageCount
      parsedMessageCount
      insertedCount
      updatedCount
      skippedMessageCount
      skippedMessages {
        gmailMessageId
        subject
        from
        reason
      }
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
