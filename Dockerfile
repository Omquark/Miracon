FROM node:latest
#Environment vars for installation, these are used for setup on the docker image
ENV PRODUCT_NAME="miracon"
ENV INSTALL_PATH="/opt/${PRODUCT_NAME}"
ENV CONFIG_PATH="/etc/opt/${PRODUCT_NAME}"
#This is a host directory, NOT within the container
ENV HOST_MINECRAFT_SERVER="/opt/minecraft"
ENV TEMP_PATH="/var/tmp/${PRODUCT_NAME}"
ENV NODE_ENV="production"

#Environments for the application
#Any paths are within the docker image itself
#If not defined here, they will fall back to the config.props file
#If not defined in either, it may either fall back to default or fail
#Check the config/config.props for more information
ENV MINECRAFT_SERVER_PATH="/opt/minecraft"
ENV MIRACON_INSTALL_DIRECTORY=INSTALL_PATH
ENV LOG_LEVEL="DEBUG"
ENV LOG_PATH="/var/opt/miracon"
# Both the logs and audit folders can be found in the logs path
ENV LOG_FOLDER="logs"
ENV AUDIT_FOLDER="audit"
ENV MINECRAFT_ADDRESS="192.168.1.110"
ENV MINECRAFT_PORT="25575"
ENV MINECRAFT_PASSWORD="cGFzc3dvcmQK"
ENV WEB_SERVER_PORT="3011"
ENV INIT_USERS="1"
ENV EMERGENCY_USER="0"
ENV DB_USERNAME="miracon"
ENV DB_PASSWORD="bWlyYWNvbg=="
ENV DB_URL="localhost"
ENV DB_PORT="27017"
ENV DB_NAME="miracon"

COPY index.js package.json jsconfig.json next.config.js postcss.config.js tailwind.config.js ${TEMP_PATH}/
COPY src/ ${TEMP_PATH}/src/
COPY components/ ${TEMP_PATH}/components/
COPY config/ ${TEMP_PATH}/config/
COPY scripts/ ${TEMP_PATH}/scripts/


USER root
RUN apt-get install -y gnupg curl
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
RUN echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | \
  tee /etc/apt/sources.list.d/mongodb-org-8.0.list
RUN apt-get update
RUN apt-get install -y mongodb-org
RUN ${TEMP_PATH}/scripts/${PRODUCT_NAME}-install.sh
RUN mongod --bind_ip_all &
# RUN sleep 5
# RUN mongosh < ${INSTALL_PATH}/scripts/mongo-init.js

USER ${PRODUCT_NAME}
ENTRYPOINT [ "/opt/miracon/scripts/miracon-start.sh", ">", "${LOG_PATH}/${LOG_FOLDER}/start-up.log", "2>&1" ]

EXPOSE ${WEB_SERVER_PORT}
EXPOSE ${MINECRAFT_PORT}