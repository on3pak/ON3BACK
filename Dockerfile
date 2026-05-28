FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/list/*

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]