const referenceLabelFragment = String.raw`(?:(?:official\s+)?receipt|or|reference|ref(?:erence)?|transaction|txn|trx|payment|order|booking|reservation|confirmation|trace|control|invoice)(?:\s*(?:id|ref(?:erence)?|no\.?|number|#))?`;

const inlineReferencePatterns = [
  new RegExp(String.raw`${referenceLabelFragment}\s*(?:[:#-]|\bis\b)?\s*([A-Z0-9#][A-Z0-9 /._-]{3,60})`, "i"),
  /\b((?:TXN|TRX|REF|ORD|RCPT|CTRL|OR|INV)[A-Z0-9/_-]{4,})\b/i,
  /\b([A-Z0-9]{2,}(?:[-/._][A-Z0-9]{2,}){1,})\b/i,
];

const standaloneReferenceLabelPattern = new RegExp(
  String.raw`^${referenceLabelFragment}\s*(?:[:#-]|\bis\b)?\s*$`,
  "i"
);

function normalizeReferenceCandidate(value: string) {
  return value
    .replace(/^[\s#:'"`([{<-]+/, "")
    .replace(/[\s"'`)\]}>,;:.]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([/._-])\s*/g, "$1")
    .trim()
    .toUpperCase();
}

function isLikelyReferenceNumber(value: string) {
  if (value.length < 4 || value.length > 60) {
    return false;
  }

  if (!/[0-9]/.test(value)) {
    return false;
  }

  if (!/^[A-Z0-9][A-Z0-9 /._-]*[A-Z0-9]$/.test(value)) {
    return false;
  }

  if (
    /^(?:PHP|USD|P|₱|\$)\s*\d/i.test(value) ||
    /^\d+(?:\.\d{1,2})$/.test(value)
  ) {
    return false;
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(value)
  ) {
    return false;
  }

  if (
    /^(?:ORDER DETAILS|ORDER DATE|SELLER|SUBTOTAL|TOTAL PAYMENT|SHIPPING FEE|QUANTITY|PRICE|MERCHANT|BILLER|PAYEE|RECIPIENT|STORE)$/i.test(
      value
    )
  ) {
    return false;
  }

  return value.split(" ").length <= 6;
}

function parseReferenceCandidate(value: string) {
  const normalizedCandidate = normalizeReferenceCandidate(value);
  return isLikelyReferenceNumber(normalizedCandidate) ? normalizedCandidate : null;
}

function extractInlineReference(value: string) {
  for (const pattern of inlineReferencePatterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      const parsedReference = parseReferenceCandidate(match[1]);
      if (parsedReference) {
        return parsedReference;
      }
    }
  }

  return null;
}

function extractAdjacentReference(lines: string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];

    if (!standaloneReferenceLabelPattern.test(currentLine)) {
      continue;
    }

    const nextLine = lines[index + 1];
    if (!nextLine) {
      continue;
    }

    const parsedReference = parseReferenceCandidate(nextLine);
    if (parsedReference) {
      return parsedReference;
    }
  }

  return null;
}

export function extractReferenceNumber(value: string) {
  const inlineReference = extractInlineReference(value);
  if (inlineReference) {
    return inlineReference;
  }

  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return extractAdjacentReference(lines);
}
