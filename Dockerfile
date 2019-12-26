FROM node:12

ARG WORK_DIR
ARG NODE_ENV
ARG PORT

WORKDIR ${WORK_DIR}

COPY package*.json ./
RUN ["mkdir", "-p", "${WORK_DIR}/node_modules"]
RUN ["chown", "-R", "node:node", "${WORK_DIR}"]

RUN npm install
COPY . .

EXPOSE ${PORT}

RUN ["npm", "run", "build"]
CMD ["npm", "start"]