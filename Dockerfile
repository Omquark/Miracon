FROM eclipse-temurin:17
ENV PRODUCT_NAME="miracon"
ENV INSTALL_PATH="/opt/${PRODUCT_NAME}"
ENV CONFIG_PATH="/etc/${INSTALL_PATH}"
ENV LOG_PATH="/var/${INSTALL_PATH}"
ENV BACK_PORT=23041
ENV FRONT_PORT=23040

USER root
COPY "config/*" "/var/tmp/${PRODUCT_NAME}/config"
COPY "scripts/*" "/var/tmp/${PRODUCT_NAME}/scripts"
COPY "back-end/*" "/var/tmp/${PRODUCT_NAME}/back-end"
COPY "front-end/*" "/var/temp${PRODUCT_NAME}/front=end"

RUN "/var/tmp/${PRODUCT_NAME}/scripts/${PRODUCT_NAME}-install.sh" ?? /var/tmp/${PRODUCT_NAME}/${PRODUCT_NAME}-install.log
USER ${PRODUCT_NAME}
ENTRYPOINT [ ${INSTALL_PATH}/bin/scripts/${PRODUCT_NAME}-start ]
EXPOSE ${BACK_PORT}
EXPOSE ${FRONT_PORT}