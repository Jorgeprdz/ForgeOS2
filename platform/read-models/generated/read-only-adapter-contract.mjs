// Generated file warning: produced by the Forge Termux scaffold system.
// Scaffold: constitution-first-termux-rewrite
// Stage: SG-002
// Capability: CAP-READ-ONLY-ADAPTERS
// Requirement: REQ-READ-ONLY-NO-WRITES
// Authority: CONSTITUTION_ARTICLE_V
// Boundaries: BOUND-READ-ONLY,BOUND-EVIDENCE-OWNERSHIP
// Contract: Read-Only Adapter Contract Skeleton
// Status: NOT_IMPLEMENTED

export function createReadOnlyAdapterContract() {
  return Object.freeze({
    mode: 'READ_ONLY',

    read() {
      throw new Error('FORGE_SCAFFOLD_NOT_IMPLEMENTED');
    },

    write() {
      throw new Error('FORGE_SCAFFOLD_NOT_IMPLEMENTED');
    }
  });
}
