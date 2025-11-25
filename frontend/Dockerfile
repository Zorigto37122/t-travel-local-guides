FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --silent

COPY . .

RUN npm run build

FROM node:22-alpine as dev

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]