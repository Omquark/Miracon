#!/bin/bash

set -euo pipefail

RUN_USER="$(whoami)"
EXPECTED_USER="${PRODUCT_NAME:-miracon}"
LOG_KEEP_FILES="${LOG_KEEP_FILES:-20}"
LOG_ROOT="${LOG_PATH:-/var/opt/miracon}"
LOG_DIR_NAME="${LOG_FOLDER:-logs}"
LOG_DIR="${LOG_ROOT}/${LOG_DIR_NAME}"
LOG_ARCHIVE_DIR="${LOG_DIR}/archive"
APP_LOG_FILE="${LOG_DIR}/miracon.log"

rotate_log() {
	local target_file="$1"
	local base_name
	local ext
	local timestamp
	local archived_file

	if [ ! -f "${target_file}" ] || [ ! -s "${target_file}" ]; then
		return
	fi

	base_name="$(basename "${target_file}")"
	ext="${base_name##*.}"
	base_name="${base_name%.*}"
	timestamp="$(date +%Y%m%d-%H%M%S)"
	archived_file="${LOG_ARCHIVE_DIR}/${base_name}-${timestamp}.${ext}"

	mv "${target_file}" "${archived_file}"
}

prune_archives() {
	if [ "${LOG_KEEP_FILES}" -le 0 ]; then
		return
	fi

	# Keep the newest LOG_KEEP_FILES and remove older ones.
	mapfile -t archived_logs < <(find "${LOG_ARCHIVE_DIR}" -maxdepth 1 -type f -name '*.log' | sort)
	local count="${#archived_logs[@]}"
	if [ "${count}" -le "${LOG_KEEP_FILES}" ]; then
		return
	fi

	local remove_count=$((count - LOG_KEEP_FILES))
	for ((i=0; i<remove_count; i++)); do
		rm -f "${archived_logs[$i]}"
	done
}

if [ "${EXPECTED_USER}" != "${RUN_USER}" ]; then
	echo "This program must be run as $EXPECTED_USER"
	exit 1
fi

mkdir -p "${LOG_DIR}" "${LOG_ARCHIVE_DIR}"
rotate_log "${APP_LOG_FILE}"
prune_archives

cd $INSTALL_PATH/bin
mongod --bind_ip_all &
sleep 5
if [ -f "$INSTALL_PATH/scripts/mongo-init.js" ];
then
	echo "Detected mongo start script, setting up the database user"
	mongosh < "$INSTALL_PATH/scripts/mongo-init.js"
	rm "$INSTALL_PATH/scripts/mongo-init.js"
fi

exec node index.js > "${APP_LOG_FILE}" 2>&1
