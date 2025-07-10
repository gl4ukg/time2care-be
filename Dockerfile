FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# 👇 Generate Prisma client after installing deps
RUN npx prisma generate

CMD ["npm", "run", "start:dev"]
