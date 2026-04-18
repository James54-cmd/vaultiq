type ReferenceLabelRule = {
  pattern: RegExp;
  allowAlphaOnly: boolean;
};

const referenceLabelRules: ReferenceLabelRule[] = [
  {
    pattern: /\bref(?:erence)?\s*(?:no\.?|number)?\s*\/\s*trace\s+no\.?\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\breference\s+(?:no\.?|number|code)\b/i,
    allowAlphaOnly: true,
  },
  {
    pattern: /\bref(?:\s*(?:#|no\.?|number))?\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\bbooking\s+(?:id|ref(?:erence)?)\b/i,
    allowAlphaOnly: true,
  },
  {
    pattern: /\border\s+(?:id|ref(?:erence)?)\b/i,
    allowAlphaOnly: true,
  },
  {
    pattern: /\breservation\s+(?:id|ref(?:erence)?)\b/i,
    allowAlphaOnly: true,
  },
  {
    pattern: /\btransaction\s+(?:id|ref(?:erence)?)\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\btrace\s+no\.?\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\bcontrol\s+no\.?\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\breceipt\s+(?:no\.?|number)\b/i,
    allowAlphaOnly: false,
  },
  {
    pattern: /\bconfirmation\s+no\.?\b/i,
    allowAlphaOnly: true,
  },
  {
    pattern: /\binvoice\s+(?:id|no\.?|number|ref(?:erence)?)\b/i,
    allowAlphaOnly: false,
  },
];

const unlabeledReferencePatterns = [
  /\b((?:TXN|TRX|REF|ORD|RCPT|CTRL|OR|INV)[A-Z0-9/_-]{4,})\b/i,
  /\b([A-Z0-9]{2,}(?:[-/._][A-Z0-9]{2,}){1,})\b/i,
];

const trailingFieldBoundaryPatterns = [
  /\s{2,}/,
  /[•|]+/,
  /[,;](?=\s*(?:date|amount|transfer|paid|merchant|biller|payee|recipient|store|fare|subtotal|total|payment|pickup|picked\s+up|status|from|to|reference|ref|booking|order|reservation|transaction|trace|control|receipt|confirmation|invoice)\b)/i,
  /\s+(?=(?:date|amount|transfer(?:\s+(?:from|to|amount))?|paid(?:\s+by)?|merchant|biller|payee|recipient|store|fare|subtotal|total(?:\s+(?:paid|amount|payment))?|payment(?:\s+(?:amount|method))?|pickup|picked\s+up|status|from|to|reference(?:\s+(?:no\.?|number|code))?|ref(?:\s*(?:#|no\.?|number))?|booking(?:\s+(?:id|ref(?:erence)?))?|order(?:\s+(?:id|ref(?:erence)?))?|reservation(?:\s+(?:id|ref(?:erence)?))?|transaction(?:\s+(?:id|ref(?:erence)?))?|trace\s+no\.?|control\s+no\.?|receipt(?:\s+(?:no\.?|number))?|confirmation\s+no\.?|invoice(?:\s+(?:id|no\.?|number|ref(?:erence)?))?)\b[:#-]?)/i,
];

const knownPlaceholderValues = /^(?:ORDER DETAILS|ORDER DATE|SELLER|SUBTOTAL|TOTAL PAYMENT|TOTAL PAID|TOTAL AMOUNT|SHIPPING FEE|QUANTITY|PRICE|MERCHANT|BILLER|PAYEE|RECIPIENT|STORE|DATE|AMOUNT|TRANSFER|PAID|PAYMENT METHOD|STATUS|PICKUP|PICKED UP|FROM|TO)$/i;

function normalizeReferenceCandidate(value: string) {
  return value
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/^[\s#:'"`([{<|.;,]+/, "")
    .replace(/[\s"'`)\]}>,;:.|]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([/._-])\s*/g, "$1")
    .trim()
    .toUpperCase();
}

function trimCandidateToBoundary(value: string) {
  let candidate = value
    .replace(/^\s*(?:(?:is\b)|[:=#-])\s*/i, "")
    .trim();

  if (candidate.length === 0) {
    return "";
  }

  const boundaryIndices = trailingFieldBoundaryPatterns
    .map((pattern) => candidate.search(pattern))
    .filter((index) => index >= 0);

  if (boundaryIndices.length > 0) {
    candidate = candidate.slice(0, Math.min(...boundaryIndices)).trim();
  }

  return candidate;
}

function isLikelyReferenceNumber(
  value: string,
  options: {
    allowAlphaOnly?: boolean;
  } = {}
) {
  if (value.length < 4 || value.length > 60) {
    return false;
  }

  if (!/^[A-Z0-9][A-Z0-9 /._-]*[A-Z0-9]$/.test(value)) {
    return false;
  }

  const hasDigit = /[0-9]/.test(value);

  if (!hasDigit && !options.allowAlphaOnly) {
    return false;
  }

  if (!hasDigit && options.allowAlphaOnly) {
    if (value.includes(" ") || value.length < 6) {
      return false;
    }
  }

  if (
    /^(?:PHP|USD|P|₱|\$)\s*\d/i.test(value) ||
    /^\d+(?:\.\d{1,2})$/.test(value)
  ) {
    return false;
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(?::\d{2})?$/.test(value) ||
    /^\d{4}-\d{2}-\d{2}\s+\d{1,2}$/.test(value) ||
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/.test(value) ||
    /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value)
  ) {
    return false;
  }

  if (knownPlaceholderValues.test(value)) {
    return false;
  }

  return value.split(" ").length <= 6;
}

function parseReferenceCandidate(
  value: string,
  options: {
    allowAlphaOnly?: boolean;
  } = {}
) {
  const normalizedCandidate = normalizeReferenceCandidate(trimCandidateToBoundary(value));
  return isLikelyReferenceNumber(normalizedCandidate, options) ? normalizedCandidate : null;
}

function findLabelMatches(line: string) {
  return referenceLabelRules
    .map((rule) => {
      const match = rule.pattern.exec(line);
      if (!match || typeof match.index !== "number") {
        return null;
      }

      return {
        allowAlphaOnly: rule.allowAlphaOnly,
        index: match.index,
        length: match[0].length,
      };
    })
    .filter((match): match is { allowAlphaOnly: boolean; index: number; length: number } => match !== null)
    .sort((left, right) => left.index - right.index);
}

function extractLabeledReference(lines: string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const labelMatches = findLabelMatches(currentLine);

    if (labelMatches.length === 0) {
      continue;
    }

    for (const labelMatch of labelMatches) {
      const inlineValue = currentLine.slice(labelMatch.index + labelMatch.length);
      const parsedInlineReference = parseReferenceCandidate(inlineValue, {
        allowAlphaOnly: labelMatch.allowAlphaOnly,
      });

      if (parsedInlineReference) {
        return parsedInlineReference;
      }

      if (trimCandidateToBoundary(inlineValue).length > 0) {
        continue;
      }

      const nextLine = lines[index + 1];
      if (!nextLine) {
        continue;
      }

      const parsedAdjacentReference = parseReferenceCandidate(nextLine, {
        allowAlphaOnly: labelMatch.allowAlphaOnly,
      });

      if (parsedAdjacentReference) {
        return parsedAdjacentReference;
      }
    }
  }

  return null;
}

function extractUnlabeledReference(value: string) {
  for (const pattern of unlabeledReferencePatterns) {
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

export function extractReferenceNumber(value: string) {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const labeledReference = extractLabeledReference(lines);
  if (labeledReference) {
    return labeledReference;
  }

  return extractUnlabeledReference(value);
}
