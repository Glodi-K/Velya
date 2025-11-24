const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connecté à MongoDB');
  const user = await User.findOne();
  if (!user) {
    console.log('❌ Aucun utilisateur trouvé');
    process.exit(1);
  }
  console.log('Utilisateur trouvé:', user.email || user._id);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
