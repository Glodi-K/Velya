// tests/testServer.js
const axios = require("axios");

const testServer = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/test");
    console.log("✅ Réponse du serveur :", res.data);
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("❌ Erreur lors de l’appel :", errorMsg);
  }
};

testServer();

