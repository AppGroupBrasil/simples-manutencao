FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY server.js db.js sso.js ./
RUN mkdir -p /data
EXPOSE 3001
CMD ["node", "server.js"]
