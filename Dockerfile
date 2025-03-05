FROM node:18-alpine as builder

WORKDIR /app
COPY ./package.json ./yarn.lock ./

RUN yarn config set network-timeout 600000 -g && yarn
COPY ./src ./src
COPY ./nest-cli.json ./nest-cli.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.build.json ./tsconfig.build.json
# Thêm các file Prisma ở bước này để có thể generate trước khi build
COPY ./prisma ./prisma
RUN yarn prisma generate
RUN yarn build

FROM node:18-alpine as modules

WORKDIR /app
COPY ./package.json ./yarn.lock ./
RUN yarn config set network-timeout 600000 -g && yarn install --production
COPY ./prisma ./prisma
RUN yarn prisma generate

FROM node:18-alpine as runner
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY ./package.json ./yarn.lock ./
COPY ./prisma ./prisma
COPY --from=modules /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV PATH /app/node_modules/.bin:$PATH
RUN chown -R 1001:1001 /app

USER 1001

EXPOSE 3000
CMD ["node", "dist/main"]
