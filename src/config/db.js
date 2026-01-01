const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
});

pool.on("connect", () => {
    console.log("postgres connected");
});

pool.on("error", (err) => {
    console.error("postgres error:", err);
    process.exit(1);
});

module.exports = { pool };
