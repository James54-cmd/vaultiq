import assert from "node:assert/strict";
import { test } from "node:test";

import { extractReferenceNumber } from "@/features/transactions/utils/extractReferenceNumber";

const referenceScenarios = [
  {
    name: "extracts numeric reference numbers",
    value: "Reference No: 461522",
    expected: "461522",
  },
  {
    name: "extracts booking identifiers with dashes",
    value: "Booking ID: A-95RTCDPWXDQ3AV",
    expected: "A-95RTCDPWXDQ3AV",
  },
  {
    name: "extracts long MariBank-style reference numbers",
    value: "Reference No: BC550000017078165718",
    expected: "BC550000017078165718",
  },
  {
    name: "extracts multiline references with standalone labels",
    value: "Successful MariBank Transfer\nReference No\nBC550000016798279517",
    expected: "BC550000016798279517",
  },
  {
    name: "extracts inline short ref labels from transfer subjects",
    value: "Successful MariBank Transfer • Ref BC550000016798279517",
    expected: "BC550000016798279517",
  },
];

for (const scenario of referenceScenarios) {
  test(scenario.name, () => {
    assert.equal(extractReferenceNumber(scenario.value), scenario.expected);
  });
}
