FROM node:22-alpine
WORKDIR /app
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund @aws-sdk/client-s3@3.1154.0
COPY init-s3.cjs ./init-s3.cjs
CMD ["node", "init-s3.cjs"]
