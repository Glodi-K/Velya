require("dotenv").config();
const axios = require("axios");

(async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/admin/report", {
      headers: {
        Authorization: `Bearer ${process.env.TEST_ADMIN_JWT}`,
      },
    });

    console.log("✅ Rapport reçu :\n", res.data);
  } catch (err) {
    console.error("❌ Erreur :", err.response?.data || err.message);
  }
})();

