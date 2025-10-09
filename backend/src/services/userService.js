// services/userService.js
const User = require('../models/User');

const updateUserPreferences = async (userId, preferences) => {
  return await User.findByIdAndUpdate(
    userId,
    { preferences },
    { new: true }
  );
};

const addFavoriteProvider = async (userId, providerId) => {
  return await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favoriteProviders: providerId } },
    { new: true }
  );
};

module.exports = {
  updateUserPreferences,
  addFavoriteProvider,
};

