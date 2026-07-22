# Termux Rewrite Runbook

Run all commands from any directory inside the repository. Scripts detect the root with Git and quote paths with spaces.

Android shared storage may not expose executable bits. Invoke rewrite scripts explicitly through `bash`.

```sh
bash tools/termux/rewrite/forge-rewrite-bootstrap.sh
bash tools/termux/rewrite/forge-rewrite-capabilities.sh
bash tools/termux/rewrite/forge-rewrite-plan.sh
bash tools/termux/rewrite/forge-rewrite-stage.sh SG-001 --plan
bash tools/termux/rewrite/forge-rewrite-stage.sh SG-001 --dry-run
bash tools/termux/rewrite/forge-rewrite-stage.sh SG-001 --apply
bash tools/termux/rewrite/forge-rewrite-validate.sh
bash tools/termux/rewrite/forge-rewrite-evidence.sh SG-003
bash tools/termux/rewrite/forge-rewrite-resume.sh
bash tools/termux/rewrite/forge-rewrite-rollback.sh SG-001
bash tools/termux/rewrite/forge-rewrite-commit.sh SG-001 "scaffold(termux): apply SG-001 evidence"
bash tools/termux/rewrite/forge-rewrite-push.sh
```

Export visible reports to Android storage only when requested:

```sh
bash tools/termux/rewrite/forge-rewrite-stage.sh SG-001 --plan --export-android
```

Copy output to the clipboard only when Termux:API is installed:

```sh
bash tools/termux/rewrite/forge-rewrite-stage.sh SG-001 --plan --copy-result
```

Never use these scripts to promote to `main`. Push is restricted to non-main rewrite branches.
