# 067G16C Advisor Sales Pipeline Responsive Layout, Canonical Color and Route Hydration Repair

Status: `IMPLEMENTED_AND_ACCEPTED`

067G16B remains the canonical-renderer milestone: `ForgePipelineUI.renderPipelineUI` is still the single Pipeline renderer. Direct user review invalidated only 067G16B's prior visual/layout acceptance claim; it did not invalidate its renderer authority.

067G16C establishes an intentional two-region desktop grid, a near-full-width tablet composition, and normal-flow mobile stacking. The accepted viewports are `390x844`, `360x800`, `768x1024`, `1366x768`, and `1440x900`. Browser geometry verifies that header, filters and body are visible and non-intersecting, controls fit their surfaces, horizontal overflow is absent, and mobile content clears the fixed navigation.

Pipeline presentation consumes the closest canonical shell token chains: desktop resolves through `--forge-bg`, `--forge-glass`, `--forge-panel-2`, `--forge-border`, `--forge-text`, `--forge-muted`, `--forge-gold`, and `--forge-cyan`; mobile and tablet fall back through `--bg`, `--panel`, `--panel-strong`, `--line`, `--text`, `--muted`, `--gold`, and `--gold-soft`. No new Pipeline color literal was introduced.

Fresh `?nav=pipeline`, hard reload, visible navigation activation, and browser back/forward now hydrate navigation and the primary outlet from the same URL route authority. Pipeline activation mounts the canonical renderer and removes the Home primary surfaces, desktop contextual rail, and reparented Home command layer. The published Pipeline assets use cache key `067g16c-2`.

Targeted contracts, runner-integrity self-tests, the required non-regression suite, real sequential Chromium acceptance, geometry acceptance, and recorded visual review passed. The honest empty/partial read-model boundary remains unchanged. 067G17 was not executed; no schema, database, persistence, product, financial, compensation, forecast, or Rule Pack truth changed.
