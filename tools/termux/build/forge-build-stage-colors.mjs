export const BUILD_STAGE_COLORS = Object.freeze({
  declared: Object.freeze({
    tone: 'muted',
    ansi256: 245,
    label: 'DECLARADO'
  }),
  architecture_ready: Object.freeze({
    tone: 'blue',
    ansi256: 75,
    label: 'ARQUITECTURA'
  }),
  contracts_ready: Object.freeze({
    tone: 'cyan',
    ansi256: 45,
    label: 'CONTRATOS'
  }),
  implementation_started: Object.freeze({
    tone: 'yellow',
    ansi256: 220,
    label: 'IMPLEMENTACIÓN'
  }),
  implementation_complete: Object.freeze({
    tone: 'orange',
    ansi256: 214,
    label: 'IMPLEMENTADO'
  }),
  tests_added: Object.freeze({
    tone: 'magenta',
    ansi256: 213,
    label: 'PRUEBAS'
  }),
  tests_pass: Object.freeze({
    tone: 'green',
    ansi256: 82,
    label: 'PRUEBAS PASS'
  }),
  integration_pass: Object.freeze({
    tone: 'brightGreen',
    ansi256: 46,
    label: 'INTEGRACIÓN PASS'
  }),
  committed: Object.freeze({
    tone: 'brightBlue',
    ansi256: 39,
    label: 'COMMIT'
  }),
  pushed: Object.freeze({
    tone: 'brightCyan',
    ansi256: 51,
    label: 'PUSH'
  }),
  merged: Object.freeze({
    tone: 'success',
    ansi256: 48,
    label: 'MERGED'
  }),
  blocked: Object.freeze({
    tone: 'red',
    ansi256: 196,
    label: 'BLOQUEADO'
  })
});

export function stageVisual(state) {
  return BUILD_STAGE_COLORS[state] || BUILD_STAGE_COLORS.declared;
}

export function stageTone(state) {
  return stageVisual(state).tone;
}
