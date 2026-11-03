FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --allow-remote=all
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
