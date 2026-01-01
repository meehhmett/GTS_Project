const { pool } = require("../config/db");

exports.list = async (q) => {
    const { title, limit = 50, offset = 0 } = q;

    const params = [];
    let where = "";

    if (title) {
        params.push(title);
        where = `where academic_title = $${params.length}`;
    }

    params.push(Number(limit));
    const limitIdx = params.length;

    params.push(Number(offset));
    const offsetIdx = params.length;

    const sql = `
    select person_id, first_name, last_name, email, phone, academic_title
    from person
    ${where}
    order by person_id asc
    limit $${limitIdx} offset $${offsetIdx};
  `;

    const { rows } = await pool.query(sql, params);
    return rows;
};

exports.getById = async (id) => {
    const { rows } = await pool.query(
        `select person_id, first_name, last_name, email, phone, academic_title
     from person
     where person_id = $1`,
        [id]
    );
    return rows[0] || null;
};
