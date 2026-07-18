(function forgeAliveAuthEntry067G17B1(global) {
  'use strict';

  const CONTRACT_ID = 'FORGE_AUTH_ENTRY_067G17B1_V1';
  const AVATAR_SELECTOR = [
    '.dw-top-actions-056y .dw-avatar-056y',
    '.dw-sidebar-profile-056y .dw-avatar-056y',
    '.alfred-profile-056g7 > span',
  ].join(',');
  const state = {
    avatars: [],
    panel: null,
    lastFocus: null,
    session: null,
  };

  function configApi() {
    return global.ForgeAlivePublicConfig067G17A1 || null;
  }

  function testAdvisorLoginEnabled() {
    return configApi()?.allowsTestAdvisorLogin?.() === true;
  }

  function makeAvatarButton(node) {
    if (!node || node.dataset.forgeAuthAvatar === '067g17b1') return node;
    const button = global.document.createElement('button');
    button.type = 'button';
    button.className = `${node.className || ''} forge-auth-avatar-067g17b1`.trim();
    button.dataset.forgeAuthAvatar = '067g17b1';
    button.setAttribute('aria-label', 'Iniciar sesión o abrir perfil');
    button.textContent = 'F';
    node.replaceWith(button);
    button.addEventListener('click', () => openAuthPanel());
    return button;
  }

  function discoverAvatars() {
    state.avatars = Array.from(global.document.querySelectorAll(AVATAR_SELECTOR))
      .map(makeAvatarButton)
      .filter(Boolean);
    renderAnonymousAvatar();
  }

  function renderAnonymousAvatar() {
    for (const avatar of state.avatars) {
      avatar.textContent = 'F';
      avatar.setAttribute('aria-label', 'Iniciar sesión o abrir perfil');
      avatar.dataset.forgeAuthState = 'anonymous';
    }
  }

  function ensurePanel() {
    if (state.panel) return state.panel;
    const backdrop = global.document.createElement('div');
    backdrop.className = 'forge-auth-backdrop-067g17b1';
    backdrop.dataset.forgeAuthPanel = '067g17b1';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="forge-auth-panel-067g17b1" role="dialog" aria-modal="true" aria-labelledby="forge-auth-title-067g17b1" tabindex="-1">
        <header>
          <div>
            <h2 id="forge-auth-title-067g17b1">Iniciar sesión en Forge</h2>
            <p>Accede para consultar tu Pipeline y administrar tus prospectos.</p>
          </div>
          <button type="button" class="forge-auth-close-067g17b1" data-forge-auth-close aria-label="Cerrar panel de autenticación">×</button>
        </header>
        <div class="forge-auth-actions-067g17b1">
          <button type="button" class="forge-auth-primary-067g17b1" data-forge-auth-google>Continuar con Google</button>
        </div>
        <section class="forge-auth-test-section-067g17b1" data-forge-test-advisors hidden>
          <p class="forge-auth-test-label-067g17b1">Acceso de prueba</p>
          <div class="forge-auth-test-actions-067g17b1">
            <button type="button" class="forge-auth-secondary-067g17b1" data-forge-test-advisor="A">Asesor A</button>
            <button type="button" class="forge-auth-secondary-067g17b1" data-forge-test-advisor="B">Asesor B</button>
          </div>
        </section>
        <footer>
          <button type="button" class="forge-auth-secondary-067g17b1" data-forge-auth-close>Cancelar</button>
        </footer>
      </section>`;
    global.document.body.append(backdrop);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop || event.target.closest('[data-forge-auth-close]')) closeAuthPanel();
    });
    global.document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !backdrop.hidden) closeAuthPanel();
    });
    state.panel = backdrop;
    return backdrop;
  }

  function refreshPanel() {
    const panel = ensurePanel();
    const testSection = panel.querySelector('[data-forge-test-advisors]');
    if (testSection) testSection.hidden = !testAdvisorLoginEnabled();
  }

  function openAuthPanel() {
    const panel = ensurePanel();
    refreshPanel();
    state.lastFocus = global.document.activeElement instanceof HTMLElement ? global.document.activeElement : null;
    panel.hidden = false;
    const focusTarget = panel.querySelector('[data-forge-auth-google]') || panel.querySelector('[data-forge-auth-close]');
    focusTarget?.focus?.();
    global.dispatchEvent(new CustomEvent('forge:auth-panel-opened', { detail: { contractId: CONTRACT_ID } }));
  }

  function closeAuthPanel() {
    if (!state.panel) return;
    state.panel.hidden = true;
    state.lastFocus?.focus?.();
    global.dispatchEvent(new CustomEvent('forge:auth-panel-closed', { detail: { contractId: CONTRACT_ID } }));
  }

  function init() {
    if (!global.document) return;
    discoverAvatars();
    ensurePanel();
    refreshPanel();
    global.document.addEventListener('click', (event) => {
      const opener = event.target.closest?.('[data-forge-auth-open]');
      if (!opener) return;
      event.preventDefault();
      openAuthPanel();
    });
  }

  const api = Object.freeze({
    contractId: CONTRACT_ID,
    openAuthPanel,
    closeAuthPanel,
    refreshPanel,
    diagnostics: () => Object.freeze({
      contractId: CONTRACT_ID,
      avatarCount: state.avatars.length,
      panelReady: Boolean(state.panel),
      testAdvisorLoginEnabled: testAdvisorLoginEnabled(),
    }),
  });

  global.ForgeAliveAuthEntry067G17B1 = api;

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
