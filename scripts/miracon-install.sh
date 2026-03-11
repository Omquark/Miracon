#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backward-compatible entrypoint. Historically this script only installed app files,
# so default to skipping Mongo unless caller explicitly sets INSTALL_MONGO=1.
export INSTALL_MONGO="${INSTALL_MONGO:-0}"

exec "${SCRIPT_DIR}/install.sh" "$@"
