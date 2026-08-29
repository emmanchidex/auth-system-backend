const bcrypt = require("bcrypt");

async function generate() {
    const password = "Emmanuel";

    const hash = await bcrypt.hash(password, 10);

    console.log("PASSWORD:", password);
    console.log("HASH:", hash);
}

generate().catch(err => console.error(err));