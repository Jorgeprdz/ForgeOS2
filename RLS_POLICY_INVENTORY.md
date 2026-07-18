# 067G17A1 RLS Policy Inventory

All listed tables have RLS enabled. Policies apply to `authenticated`; `anon` has no table privileges.

| Table | SELECT | INSERT | UPDATE / archive | DELETE |
| --- | --- | --- | --- | --- |
| `prospects` | `advisor_id = auth.uid()` | owner check | owner using/check plus restrictive archive metadata | no grant; policies removed |
| `opportunities` | owner only | owner only; composite parent owner FK | owner only; ownership immutable; archive metadata required | no grant; policies removed |
| `prospect_contact_methods` | owner only | owner only; composite parent owner FK | owner only; ownership immutable; archive metadata required | no grant; policies removed |
| `prospect_provenance` | owner only | owner only; composite parent owner FK | owner only; ownership immutable; archive metadata required | no grant; policies removed |
| `opportunity_status_history` | owner only | owner only; composite opportunity owner FK; actor equals owner | business fields append-only; archive metadata only | no grant; policies removed |

Views `active_prospects` and `active_opportunities` use `security_invoker = true`, retain underlying RLS, and filter archived records. The opportunity view also joins an unarchived owner-matched prospect.

Forbidden policy forms `USING (true)` and `WITH CHECK (true)` are absent.

