# Use a lightweight Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install http-server
RUN npm install -g http-server

# Copy game files
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["http-server", "--cors", "-p", "8080"]