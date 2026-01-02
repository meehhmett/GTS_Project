const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function signToken(user) {
    return jwt.sign(
        { sub: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

exports.register = async ({ username, password, role }) => {
    if (!username || !password) throw new Error("username and password required");
    const safeRole = role === "admin" ? "admin" : "user";

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
        `insert into app_user (username, password_hash, role)
     values ($1,$2,$3)
     returning user_id, username, role, created_at`,
        [username, password_hash, safeRole]
    );

    return rows[0];
};

exports.login = async ({ username, password }) => {
    if (!username || !password) throw new Error("username and password required");

    const { rows } = await pool.query(
        `select user_id, username, password_hash, role
     from app_user
     where username = $1`,
        [username]
    );

    const user = rows[0];
    if (!user) throw new Error("invalid credentials");

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error("invalid credentials");

    const token = signToken(user);

    return {
        token,
        user: { user_id: user.user_id, username: user.username, role: user.role },
    };
};
