FROM node:24-alpine as build-stage

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate
RUN npm config set registry https://registry.npmmirror.com

# RUN corepack prepare pnpm@latest --activate


COPY  package.json  ./
RUN pnpm install

COPY . .
RUN pnpm run build


FROM nginx as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]