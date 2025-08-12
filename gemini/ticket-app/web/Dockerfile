# web/Dockerfile (for development)
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose the port used by ng serve
EXPOSE 4200

# Start the Angular development server
CMD ["npm", "run", "start"]