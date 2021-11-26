FROM node:lts-alpine

ARG WORK_DIR
ARG NODE_ENV
ARG PORT

WORKDIR ${WORK_DIR}

COPY package.json ./
COPY yarn.lock ./
RUN ["mkdir", "-p", "${WORK_DIR}/node_modules"]
RUN ["chown", "-R", "node:node", "${WORK_DIR}"]

RUN yarn install
COPY . .

EXPOSE ${PORT}

RUN ["yarn", "build"]
CMD ["npm", "start"]