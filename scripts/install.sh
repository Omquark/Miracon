#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PRODUCT_NAME="${PRODUCT_NAME:-miracon}"
CREATED_USER="${CREATED_USER:-${PRODUCT_NAME}}"
CREATED_GROUP="${CREATED_GROUP:-${PRODUCT_NAME}g}"

INSTALL_PATH="${INSTALL_PATH:-/opt/${PRODUCT_NAME}}"
CONFIG_PATH="${CONFIG_PATH:-/etc/opt/${PRODUCT_NAME}}"
LOG_PATH="${LOG_PATH:-/var/opt/${PRODUCT_NAME}}"
MINECRAFT_SERVER_PATH="${MINECRAFT_SERVER_PATH:-/opt/minecraft}"
TEMP_PATH="${TEMP_PATH:-${/var/tmp/${PRODUCT_NAME}}}"
SOURCE_PATH="${SOURCE_PATH:-${REPO_ROOT}}"
CLEANUP_TEMP="${CLEANUP_TEMP:-0}"

INSTALL_MONGO="${INSTALL_MONGO:-1}"
MONGO_VERSION="${MONGO_VERSION:-8.0}"

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "$(date) This script must be run as root."
    exit 1
  fi
}

ensure_user_and_group() {
  if ! getent group "${CREATED_GROUP}" >/dev/null 2>&1; then
    groupadd "${CREATED_GROUP}"
  fi

  if ! id -u "${CREATED_USER}" >/dev/null 2>&1; then
    useradd -m -g "${CREATED_GROUP}" "${CREATED_USER}"
  else
    usermod -a -G "${CREATED_GROUP}" "${CREATED_USER}" >/dev/null 2>&1 || true
  fi
}

reset_path() {
  local target_path="$1"
  if [ -d "${target_path}" ]; then
    echo "Directory ${target_path} exists. Removing before install."
    rm -rf "${target_path}"
  fi
}

install_mongo() {
  if [ "${INSTALL_MONGO}" != "1" ]; then
    echo "Skipping MongoDB installation because INSTALL_MONGO=${INSTALL_MONGO}."
    return
  fi

  if command -v mongod >/dev/null 2>&1; then
    echo "MongoDB already installed, skipping package install."
    return
  fi

  echo "Installing MongoDB ${MONGO_VERSION} packages..."
  apt-get update
  apt-get install -y --no-install-recommends gnupg curl ca-certificates
  curl -fsSL "https://www.mongodb.org/static/pgp/server-${MONGO_VERSION}.asc" \
    | gpg -o "/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg" --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-${MONGO_VERSION}.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/${MONGO_VERSION} main" \
    > "/etc/apt/sources.list.d/mongodb-org-${MONGO_VERSION}.list"
  apt-get update
  apt-get install -y --no-install-recommends mongodb-org
  rm -rf /var/lib/apt/lists/*
}

build_app() {
  cd "${SOURCE_PATH}"
  echo "Downloading packages required for build..."
  npm install --include=dev
  echo "Building the frontend..."
  npm run build
}

install_app_files() {
  reset_path "${INSTALL_PATH}"
  reset_path "${CONFIG_PATH}"
  reset_path "${LOG_PATH}"

  echo "Creating installation directories..."
  mkdir -p "${INSTALL_PATH}/bin" "${INSTALL_PATH}/scripts"
  mkdir -p "${CONFIG_PATH}"
  mkdir -p "${LOG_PATH}/logs"
  mkdir -p /data/db
  mkdir -p "${MINECRAFT_SERVER_PATH}"

  echo "Installing application files..."
  cp -a "${SOURCE_PATH}/index.js" "${INSTALL_PATH}/bin/"
  cp -a "${SOURCE_PATH}/package.json" "${INSTALL_PATH}/bin/"
  cp -a "${SOURCE_PATH}/postcss.config.js" "${INSTALL_PATH}/bin/"
  cp -a "${SOURCE_PATH}/tailwind.config.js" "${INSTALL_PATH}/bin/"
  cp -a "${SOURCE_PATH}/components" "${INSTALL_PATH}/bin/"
  cp -a "${SOURCE_PATH}/scripts" "${INSTALL_PATH}/"
  cp -a "${SOURCE_PATH}/.next" "${INSTALL_PATH}/bin/"

  cd "${SOURCE_PATH}"
  ls -a "${SOURCE_PATH}"

  echo "Copying configuration..."
  cp -a "${SOURCE_PATH}/config/config.prop" "${CONFIG_PATH}/config.prop"

  echo "Installing runtime dependencies..."
  cd "${INSTALL_PATH}/bin"
  npm install --omit=dev
}

apply_permissions() {
  echo "Applying permissions..."
  chmod -R 755 "${INSTALL_PATH}" "${CONFIG_PATH}" "${LOG_PATH}" /data
  chown -R "${CREATED_USER}:${CREATED_GROUP}" "${INSTALL_PATH}" "${CONFIG_PATH}" "${LOG_PATH}" /data
  if [ -d "/home/${CREATED_USER}" ]; then
    chmod -R 755 "/home/${CREATED_USER}"
    chown -R "${CREATED_USER}:${CREATED_GROUP}" "/home/${CREATED_USER}"
  fi
}

cleanup() {
  if [ "${CLEANUP_TEMP}" = "1" ] && [ "${SOURCE_PATH}" != "${REPO_ROOT}" ]; then
    echo "Cleaning up temp files at ${SOURCE_PATH}"
    rm -rf "${SOURCE_PATH}"
  fi
}

main() {
  require_root
  ensure_user_and_group
  install_mongo
  build_app
  install_app_files
  apply_permissions
  cleanup
}

main "$@"
