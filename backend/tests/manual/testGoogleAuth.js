const { google } = require('googleapis');
const authClient = require('./config/googleAuth');

async function testGoogleAuth() {
    try {
        const calendar = google.calendar({ version: 'v3', auth: await authClient.getClient() });
        const response = await calendar.calendarList.list();
        console.log("✅ Connexion réussie à Google Calendar !");
        console.log(response.data);
    } catch (error) {
        console.error("❌ Erreur de connexion à Google Calendar :", error);
    }
}

testGoogleAuth();

