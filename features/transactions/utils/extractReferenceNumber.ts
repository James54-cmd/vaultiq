const referencePatterns = [
  /(?:reference|ref(?:erence)?(?: no| number)?|transaction id|trx id|payment id)\s*[:#-]?\s*([A-Z0-9-]{6,})/i,
  /(?:trace(?: no| number)?|confirmation(?: no| number)?|receipt(?: no| number)?|order(?: id| no| number)?|control(?: no| number)?|txn(?: id| no| number)?)\s*[:#-]?\s*([A-Z0-9-]{6,})/i,
  /\b((?:TXN|TRX|REF|ORD|RCPT|CTRL)[A-Z0-9-]{4,})\b/i,
  /\b([A-Z]{2,6}-[A-Z0-9]{4,})\b/,
];

export function extractReferenceNumber(value: string) {
  for (const pattern of referencePatterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}
