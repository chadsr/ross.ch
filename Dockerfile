FROM node:lts-slim

ARG WORK_DIR
ARG PORT

WORKDIR ${WORK_DIR}

COPY package.json ./
COPY yarn.lock ./
RUN ["mkdir", "-p", "${WORK_DIR}/node_modules"]
RUN ["chown", "-R", "node:node", "${WORK_DIR}"]

RUN apt-get update
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

RUN corepack enable
RUN yarn --version
RUN yarn install
COPY . .

EXPOSE ${PORT}

RUN ["yarn", "build"]
CMD ["yarn", "start"]