const { pool } = require("../config/db");

exports.testDb = async (req, res) => {
    try {
        const { rows } = await pool.query("select now() as now");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
