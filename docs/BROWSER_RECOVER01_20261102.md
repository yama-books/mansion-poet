# BROWSER-RECOVER-01

Base: origin/main ee45852. This independent PR retains the normal body and all
its listeners. Only the disposable print clone and print mode are cleared.
Recovery handles afterprint, pageshow, visible visibilitychange, deferred focus,
print-media exit, and print() exceptions. Focus while print media is active must
not clear the sheet. Location invalidation also restores screen state.

Local browser test: Edge at 390px and 1280px; all six exit paths pass, body/button
identity retained, clone removed, normal content visible, regeneration works.
These are simulated lifecycle events, not real OS dialog cancellation acceptance.
Run: `node tests/mobile-device/print-recovery.cjs` with playwright-core installed
and CHROME_PATH set if using an installed browser. Added to mobile-device CI.
Local existing Node suite: 207 pass (audit pack records real output and exit code).

Code/PR, CI, publication, and hardware acceptance are separate. No Pages deploy or
main merge is part of this branch. iPhone Safari print/cancel remains pending.
Jev audit unresolved: tool unavailable; this repository is outside the standing
allowlist, send_allowed=false. No content sent. Rollback: revert this commit.
