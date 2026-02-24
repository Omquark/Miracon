#!/bin/sh

<<<<<<< Updated upstream
openssl req -x509 -sha256 -newkey rsa:4096 -keyout MiraconCA.key -out MiraconCA.crt -subj "/O=/CN=MiraconCA" -passout env:MIRACON_CA_PASS

# Generate Private key for CA
openssl genrsa -aes256 -out MiraconCA.key 4096
# Generate the root certificate
openssl req -new -key MiraconCA.key -x509 -out MiraconCA.crt -days 3650
# Create domain/server certificate request
openssl req -new -nodes -newkey rsa:4096 -keyout MiraconServerPK.key -out Miracon.req -batch -subj "" -reqexts SAN
# Sign the certificate request
openssl x509 -req -in Miracon.req -CA MiraconCA.crt -CAkey MiraconCA.key -CAcreateserial -out MiraconServer.crt -days 3650 -sha256
# Build a chain file
cat MiraconServerPK.key > MiraconChain.pem
cat MiraconServer.crt >> MiraconChain.pem
cat MiraconCA.crt >> MiraconChain.pem
=======
# Need MIRACON_CA_PASS
# TODO: Finish, need to create the CA, then create the certs to communicate witihin the image ONLY!
# Temp pass
# PavTWn$1=M[/ExGWp@tW6Hq0nY]D3%tw?Tbd$iaWcm]uwExxJ}wi5mbpet%t:R/1

openssl req -x509 -sha256 -newkey rsa:4096 -keyout MiraconCA.key -out MiraconCA.crt -subj "/O=/CN=MiraconCA" -passout env:MIRACON_CA_PASS
>>>>>>> Stashed changes
