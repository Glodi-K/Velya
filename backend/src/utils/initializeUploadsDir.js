const fs = require('fs');
const path = require('path');

const initializeUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const profilePhotosDir = path.join(uploadsDir, 'profile-photos');

  // Créer le dossier uploads s'il n'existe pas
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Dossier uploads créé');
  }

  // Créer le dossier profile-photos s'il n'existe pas
  if (!fs.existsSync(profilePhotosDir)) {
    fs.mkdirSync(profilePhotosDir, { recursive: true });
    console.log('✅ Dossier profile-photos créé');
  }
};

module.exports = initializeUploadsDir;
