# Utilise l'image Node.js version 18 
FROM node:18

# Définit le dossier de travail dans le conteneur
WORKDIR /app

# Copie le fichier package.json pour installer les dépendances (Express, MySQL, JWT) 
COPY package*.json ./
RUN npm install

# Copie le reste du code de l'API 
COPY . .

# Le backend écoute sur le port 5000 (standard pour Express) 
EXPOSE 5000

# Lance le serveur Node 
CMD ["npm", "start"]