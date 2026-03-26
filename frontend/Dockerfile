# Utilise Node.js pour construire l'application React 
FROM node:18

WORKDIR /app

# Installe React et les outils de cartographie (Leaflet) 
COPY package*.json ./
RUN npm install

# Copie le code de l'interface SPA 
COPY . .

# Le frontend React écoute sur le port 3000 
EXPOSE 3000

# Lance l'application React 
CMD ["npm", "start"]