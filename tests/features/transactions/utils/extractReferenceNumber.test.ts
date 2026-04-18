import assert from "node:assert/strict";
import { test } from "node:test";

import { extractReferenceNumber } from "@/features/transactions/utils/extractReferenceNumber";

const referenceScenarios = [
  {
    name: "extracts the MariBank 300 reference from labeled text",
    value: [
      "Your transfer of PHP300.00 is successful.",
      "Transfer from: JAMES FANUEL DAMASO - 0860",
      "Transfer to: MariBank - 1172",
      "Transfer amount: PHP300.00",
      "Reference No: BC550000016658898435",
    ].join("\n"),
    expected: "BC550000016658898435",
  },
  {
    name: "extracts the MariBank 2000 reference from labeled text",
    value: [
      "Your transfer of PHP2,000.00 is successful.",
      "Transfer from: JAMES FANUEL DAMASO - 0860",
      "Transfer to: MariBank - 1172",
      "Transfer amount: PHP2,000.00",
      "Reference No: BC550000016659195123",
    ].join("\n"),
    expected: "BC550000016659195123",
  },
  {
    name: "extracts booking identifiers as references",
    value: "Booking ID: A-94PHP40GWASUAV",
    expected: "A-94PHP40GWASUAV",
  },
  {
    name: "extracts reference code labels",
    value: "Reference code: BC550000016798279517",
    expected: "BC550000016798279517",
  },
  {
    name: "extracts combined ref and trace labels",
    value: "Ref no / trace no: BC550000016798279517",
    expected: "BC550000016798279517",
  },
  {
    name: "extracts multiline references with standalone labels",
    value: "Successful MariBank Transfer\nReference No\nBC550000016798279517",
    expected: "BC550000016798279517",
  },
  {
    name: "does not absorb trailing date text into the reference",
    value: "Reference No: BC550000016798279517 Date: 2026-04-18",
    expected: "BC550000016798279517",
  },
  {
    name: "does not absorb trailing amount text into the reference",
    value: "Reference No. BC550000016798279517 Amount: PHP 100.00",
    expected: "BC550000016798279517",
  },
  {
    name: "rejects timestamps masquerading as transaction identifiers",
    value: "Transaction ID: 2026-04-18 10:30:00",
    expected: null,
  },
  {
    name: "allows alpha-heavy booking ids when they are strongly labeled",
    value: "Booking Reference\nABCDEFGHJKLMN",
    expected: "ABCDEFGHJKLMN",
  },
];

for (const scenario of referenceScenarios) {
  test(scenario.name, () => {
    assert.equal(extractReferenceNumber(scenario.value), scenario.expected);
  });
}
