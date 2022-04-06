FROM node:alpine

COPY src src
WORKDIR src
RUN npm install

ENTRYPOINT ["node", "index.js"]

