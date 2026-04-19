import { financialAccountSchema } from "@/features/accounts/schemas/account.schema";
import type { FinancialAccountRecord } from "@/features/accounts/types/FinancialAccount";

export function mapFinancialAccountRecord(record: FinancialAccountRecord) {
  return financialAccountSchema.parse({
    id: record.id,
    name: record.name,
    institutionName: record.institution_name,
    accountType: record.account_type,
    kind: record.kind,
    source: record.source,
    currencyCode: record.currency_code,
    currentBalance: Number(record.current_balance),
    creditLimit: record.credit_limit === null ? null : Number(record.credit_limit),
    includeInNetWorth: record.include_in_net_worth,
    status: record.status,
    lastSyncedAt: record.last_synced_at,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}
