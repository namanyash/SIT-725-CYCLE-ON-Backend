FROM node:16-alpine

WORKDIR /app

COPY . .

EXPOSE 5000

RUN npm install

CMD ["npm", "start"]
