FROM node:10

ARG WORK_DIR
ARG NODE_ENV
ARG PORT

WORKDIR ${WORK_DIR}

COPY package*.json ${WORK_DIR}
COPY . ${WORK_DIR}
RUN ["mkdir", "-p", "${WORK_DIR}/node_modules"]
RUN ["chown", "-R", "node:node", "${WORK_DIR}"]

RUN npm install

EXPOSE ${PORT}

RUN ["npm", "run", "build"]
CMD ["npm", "start"]