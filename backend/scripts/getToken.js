const axios = require('axios');

async function getToken() {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'bob@example.com', //
            password: 'test123' //
        });

        console.log('🔑 Token généré :', response.data.token);
    } catch (error) {
        console.error('❌ Erreur lors de la génération du token', error.response ? error.response.data : error.message);
    }
}

getToken();

