const referencePatterns = [
  /(?:reference|ref(?:erence)?(?: no| number)?|transaction id|trx id|payment id)\s*[:#-]?\s*([A-Z0-9-]{6,})/i,
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
