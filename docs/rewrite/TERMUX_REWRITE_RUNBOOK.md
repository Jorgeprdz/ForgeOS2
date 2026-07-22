# Termux Rewrite Runbook

Run all commands from any directory inside the repository. Scripts detect the root with Git and quote paths with spaces.

```sh
"./tools/termux/rewrite/forge-rewrite-bootstrap.sh"
"./tools/termux/rewrite/forge-rewrite-capabilities.sh"
"./tools/termux/rewrite/forge-rewrite-plan.sh"
"./tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --plan
"./tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --dry-run
"./tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --apply
"./tools/termux/rewrite/forge-rewrite-validate.sh"
"./tools/termux/rewrite/forge-rewrite-evidence.sh" SG-003
"./tools/termux/rewrite/forge-rewrite-resume.sh"
"./tools/termux/rewrite/forge-rewrite-rollback.sh" SG-001
"./tools/termux/rewrite/forge-rewrite-commit.sh" SG-001 "scaffold(termux): apply SG-001 evidence"
"./tools/termux/rewrite/forge-rewrite-push.sh"
```

Export visible reports to Android storage only when requested:

```sh
"./tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --plan --export-android
```

Copy output to the clipboard only when Termux:API is installed:

```sh
"./tools/termux/rewrite/forge-rewrite-stage.sh" SG-001 --plan --copy-result
```

Never use these scripts to promote to `main`. Push is restricted to non-main rewrite branches.
