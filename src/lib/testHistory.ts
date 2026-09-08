// One entry per test the user has actually run in the Test tab this
// session. TestRunnerPanel appends to this list (via a callback prop) each
// time `run()` succeeds; the Dashboard tab reads the accumulated list to
// show "the tests used" without needing to re-run anything.

import type { TestResult } from "@/lib/testRunners";

export type TestHistoryEntry = {
  id: string;
  /** e.g. "Two-sample t-test" */
  label: string;
  /** e.g. "Score by Method" -- which columns/values it ran against. */
  description: string;
  result: TestResult;
  runAt: number;
};
