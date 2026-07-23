#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WAKE_LOCK_HELD=0
NODE_PID=""

detect_termux() {
  [[ "${FORGE_OVERNIGHT_PLATFORM:-}" == "termux" ]] ||
    [[ -n "${TERMUX_VERSION:-}" ]] ||
    [[ "${PREFIX:-}" == *com.termux* ]]
}

detect_arch() {
  [[ "${FORGE_OVERNIGHT_PLATFORM:-}" == "arch" ]] ||
    { [[ -r /etc/os-release ]] && grep -Eq '^ID(_LIKE)?=.*arch' /etc/os-release; }
}

detect_platform() {
  if detect_termux; then printf 'termux\n'
  elif detect_arch; then printf 'arch\n'
  else printf 'linux\n'
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'OVERNIGHT_STATUS=FAILED\nFAIL_REASON=MISSING_DEPENDENCY:%s\n' "$1" >&2
    case "$1" in
      node|npm) printf 'INSTALL_HINT=Install Node.js and npm using your platform package manager.\n' >&2 ;;
      timeout) printf 'INSTALL_HINT=Install GNU coreutils (Termux: pkg install coreutils; Arch: pacman -S coreutils).\n' >&2 ;;
      *) printf 'INSTALL_HINT=Install %s using your platform package manager.\n' "$1" >&2 ;;
    esac
    exit 69
  }
}

release_wake_lock() {
  local code=$?
  if (( WAKE_LOCK_HELD == 1 )) && command -v termux-wake-unlock >/dev/null 2>&1; then
    termux-wake-unlock >/dev/null 2>&1 || true
  fi
  exit "$code"
}
trap release_wake_lock EXIT

for dependency in bash git node npm timeout; do require_command "$dependency"; done

PLATFORM="$(detect_platform)"
export FORGE_OVERNIGHT_DETECTED_PLATFORM="$PLATFORM"

if [[ "$PLATFORM" == "termux" ]] && command -v termux-wake-lock >/dev/null 2>&1; then
  if termux-wake-lock >/dev/null 2>&1; then WAKE_LOCK_HELD=1; fi
fi

forward_signal() {
  local signal="$1" exit_code="$2"
  trap - INT TERM HUP
  if [[ -n "$NODE_PID" ]] && kill -0 "$NODE_PID" 2>/dev/null; then
    kill "-$signal" "$NODE_PID"
    if wait "$NODE_PID"; then :; fi
  fi
  exit "$exit_code"
}
trap 'forward_signal INT 130' INT
trap 'forward_signal TERM 143' TERM
trap 'forward_signal HUP 129' HUP

node "$SCRIPT_DIR/runner.mjs" "$@" &
NODE_PID=$!
if wait "$NODE_PID"; then
  exit 0
else
  code=$?
  exit "$code"
fi
