FROM node:lts-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
ENV NODE_ENV production
WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --chown=node:node . .

ENV PORT=8080

EXPOSE 8080 
USER node
CMD ["dumb-init", "node", "scripts/index.js"]