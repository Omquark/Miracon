#!/usr/bin/env bash
set -euo pipefail
unmask 007

# ====== Settings ======
CA_NAME="MiraconCA"
SERVER_NAME="MiraconServer"
DAYS_CA=3650
DAYS_SERVER=825  # 825 is a common max for leaf certs in many ecosystems; you can set higher for private use
KEY_BITS=4096

# Set your server identity + SANs here
CN="miracon.local"
SAN_DNS_1="miracon.local"
SAN_DNS_2="localhost"
SAN_IP_1="127.0.0.1"
# If you have a LAN IP, add it:
# SAN_IP_2="192.168.1.50"

# ====== Filenames ======
CA_KEY="${CA_NAME}.key"
CA_CRT="${CA_NAME}.crt"

SERVER_KEY="${SERVER_NAME}.key"
SERVER_CSR="${SERVER_NAME}.csr"
SERVER_CRT="${SERVER_NAME}.crt"

CHAIN_PEM="${SERVER_NAME}-chain.pem"     # cert + CA chain (no private key)
FULLCHAIN_PEM="${SERVER_NAME}-fullchain.pem" # same as chain in this simple case
KEYPAIR_PEM="${SERVER_NAME}-keypair.pem" # private key + cert + CA (use carefully)

# ====== OpenSSL config for CSR + x509 extensions ======
OPENSSL_CNF="$(mktemp)"
trap 'rm -f "$OPENSSL_CNF"' EXIT

cat > "$OPENSSL_CNF" <<EOF
[ req ]
default_bits       = ${KEY_BITS}
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = req_ext

[ dn ]
C  = US
ST = NY
L  = Secaucus
O  = Miracon
OU = Minecraft
CN = ${CN}

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = ${SAN_DNS_1}
DNS.2 = ${SAN_DNS_2}
IP.1  = ${SAN_IP_1}
#IP.2  = ${SAN_IP_2}

[ v3_ca ]
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer:always

[ v3_server ]
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
EOF

echo "==> Generating Root CA private key (encrypted)..."
openssl genrsa -aes256 -out "$CA_KEY" "$KEY_BITS"

echo "==> Generating Root CA certificate..."
openssl req -x509 -new -key "$CA_KEY" -sha256 -days "$DAYS_CA" \
  -out "$CA_CRT" -config "$OPENSSL_CNF" -extensions v3_ca

echo "==> Generating server key + CSR with SAN..."
openssl req -new -newkey rsa:"$KEY_BITS" -nodes \
  -keyout "$SERVER_KEY" -out "$SERVER_CSR" \
  -config "$OPENSSL_CNF"

echo "==> Signing server certificate with CA (includes SAN)..."
openssl x509 -req -in "$SERVER_CSR" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$SERVER_CRT" -days "$DAYS_SERVER" -sha256 \
  -extfile "$OPENSSL_CNF" -extensions v3_server

echo "==> Verifying certificate details..."
openssl x509 -in "$SERVER_CRT" -noout -subject -issuer -dates
openssl x509 -in "$SERVER_CRT" -noout -ext subjectAltName

echo "==> Building chain/fullchain bundles..."
cat "$SERVER_CRT" "$CA_CRT" > "$CHAIN_PEM"
cp "$CHAIN_PEM" "$FULLCHAIN_PEM"

echo "==> Building keypair bundle (PRIVATE KEY INCLUDED — protect this!)..."
cat "$SERVER_KEY" "$SERVER_CRT" "$CA_CRT" > "$KEYPAIR_PEM"

echo "==> Done."
echo "CA cert (distribute to clients as trust anchor): $CA_CRT"
echo "Server key: $SERVER_KEY"
echo "Server cert: $SERVER_CRT"
echo "Chain (cert + CA): $CHAIN_PEM"
echo "Keypair bundle (key + cert + CA): $KEYPAIR_PEM"