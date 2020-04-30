FROM node:12.2.0-alpine
EXPOSE 3001:3001
WORKDIR /app
COPY . /app
RUN npm install --loglevel error
CMD ["npm", "run", "dev"]
