FROM node:20-bookworm

ENV TZ=Europe/Madrid
RUN apt-get update && apt-get install -y curl tzdata && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]