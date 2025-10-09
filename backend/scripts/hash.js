const bcrypt = require('bcrypt');

async function hashPassword() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    console.log("Hash:", hashedPassword);
}

hashPassword();

