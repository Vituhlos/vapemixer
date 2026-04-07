FROM node:22-alpine AS build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server ./server
COPY --from=build /app/client/dist ./client/dist
EXPOSE 3333
CMD ["node", "server/index.js"]
