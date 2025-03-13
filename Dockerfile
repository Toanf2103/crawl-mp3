# Sử dụng Node.js làm base image
FROM node:18-alpine AS builder

WORKDIR /app

# Cài đặt OpenSSL trước khi chạy Prisma
RUN apk add --no-cache openssl1.1-compat

# Sao chép package.json, yarn.lock và cài dependencies
COPY package.json yarn.lock .env ./  
RUN yarn install --frozen-lockfile

# Sao chép toàn bộ source code
COPY . .

# Tạo Prisma Client
RUN npx prisma generate

# Biên dịch code TypeScript
RUN yarn build

FROM node:18-alpine

WORKDIR /app

# Sao chép các file cần thiết từ builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./  
COPY --from=builder /app/.env ./  
COPY --from=builder /app/prisma ./prisma  

# Chạy migrations khi container start
RUN apk add --no-cache openssl1.1-compat
RUN npx prisma migrate deploy  

EXPOSE 3000  

CMD ["node", "dist/main"]
