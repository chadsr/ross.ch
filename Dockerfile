FROM node:10

ARG working_directory=/usr/src/ross.ch
ARG port=8080
ARG debugLogging=false
ARG emailHost=localhost
ARG emailPassword
ARG emailAddress
ARG mediumUser
ARG githubUser
ARG maxBlogPosts=10
ARG maxRepos=10

ENV PORT=${port}
ENV NODE_ENV=${debugLogging}
ENV EMAIL_HOST=${emailHost}
ENV EMAIL_PASSWORD=${emailPassword}
ENV EMAIL_ADDRESS=${emailAddress}
ENV MEDIUM_USER=${mediumUser}
ENV GITHUB_USER=${githubUser}
ENV MAX_POSTS=${maxBlogPosts}
ENV MAX_REPOS=${maxRepos}

WORKDIR $working_directory

COPY package*.json ./
RUN ["mkdir", "-p", "${working_directory}/node_modules"]
RUN ["chown", "-R", "node:node", "${working_directory}"

RUN npm install
COPY . .

EXPOSE $port


RUN ["npm", "build"]
CMD ["npm", "start"]