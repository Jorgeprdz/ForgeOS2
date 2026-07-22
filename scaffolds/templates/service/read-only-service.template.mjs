// Generated file warning: produced by the Forge Termux scaffold system.
// Scaffold: {{scaffold}}
// Stage: {{stage}}
// Capability: {{capability}}
// Requirement: {{requirement}}
// Authority: {{authority}}
// Boundaries: {{boundaries}}
// Contract: {{contract}}
// Status: {{status}}

export function createReadOnlyServiceContract() {
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
