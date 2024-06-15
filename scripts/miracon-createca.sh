#Need MIRACON_CA_PASS
#TODO: Finish, need to create the CA, then create the certs to communicate witihin the image ONLY!

openssl req -x509 -sha256 -newkey rsa:4096 -keyout MiraconCA.key -out MiraconCA.crt -subj "/O=/CN=MiraconCA" -passout env:MIRACON_CA_PASS