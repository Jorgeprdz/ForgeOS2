# Forge Action Contract Read Model Preview Binding 062E

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK

062E implements structured preview payload generation for command-bar contract selection.

Expected behavior:

- selecting `/cotizar`, `follow`, `revisar`, `preview`, `abrir`, or `/quick actions` creates a local preview payload;
- payload includes contract id, target, status, source module, blocked reasons, approval requirement, and no-effect policy;
- a compact preview payload panel appears below the command bar;
- no real action executes.

DECISION=PASS_062E_ACTION_CONTRACT_READ_MODEL_PREVIEW_BINDING

NEXT=062F_ACTION_CONTRACT_READ_MODEL_PREVIEW_QA_LOCK
