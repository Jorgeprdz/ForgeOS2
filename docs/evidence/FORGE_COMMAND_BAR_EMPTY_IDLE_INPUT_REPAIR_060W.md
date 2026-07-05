# Forge Command Bar Empty Idle Input Repair 060W

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK

060W addresses the public QA finding that the restored command bar still opened with a prefilled static command such as `/llamar Lariza ahora`.

Expected behavior:
- command bar visible;
- command bar editable;
- idle state shows placeholder only;
- no fixed slash command appears until the user types;
- search overlay behavior remains unchanged.

DECISION=PASS_060W_COMMAND_BAR_EMPTY_IDLE_INPUT_REPAIR_IMPLEMENTATION

NEXT=060X_COMMAND_BAR_EMPTY_IDLE_INPUT_VISUAL_QA_LOCK
