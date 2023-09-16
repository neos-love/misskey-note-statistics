FROM node:20.6
WORKDIR /app
COPY main.mjs .
CMD ["node", "main.mjs"]
