const { pool } = require("../config/db");

exports.years = async () => {
    const { rows } = await pool.query(
        `select distinct year from thesis order by year desc`
    );
    return rows.map((r) => r.year);
};

exports.types = async () => {
    const { rows } = await pool.query(
        `select distinct type from thesis order by type`
    );
    return rows.map((r) => r.type);
};

exports.languages = async () => {
    const { rows } = await pool.query(
        `select language_id, language_name from language order by language_name`
    );
    return rows;
};

exports.universities = async () => {
    const { rows } = await pool.query(
        `select university_id, university_name from university order by university_name`
    );
    return rows;
};

exports.institutes = async () => {
    const { rows } = await pool.query(
        `select institute_id, institute_name from institute order by institute_name`
    );
    return rows;
};

exports.persons = async () => {
    const { rows } = await pool.query(
        `select person_id, first_name, last_name from person order by first_name, last_name`
    );
    return rows;
};

exports.topics = async () => {
    const { rows } = await pool.query(
        `select topic_id, topic_name from subject_topic order by topic_name`
    );
    return rows;
};

exports.keywords = async () => {
    const { rows } = await pool.query(
        `select keyword_id, keyword_text from keyword order by keyword_text`
    );
    return rows;
};
exports.createPerson = async ({ first_name, last_name, email, phone, academic_title }) => {
    const { rows } = await pool.query(
        `
    insert into person (first_name, last_name, email, phone, academic_title)
    values ($1,$2,$3,$4,$5)
    returning person_id, first_name, last_name
    `,
        [first_name, last_name, email || null, phone || null, academic_title || "Student"]
    );
    return rows[0];
};

exports.createKeyword = async ({ keyword_text }) => {
    const { rows } = await pool.query(
        `insert into keyword (keyword_text) values ($1) returning keyword_id, keyword_text`,
        [keyword_text]
    );
    return rows[0];
};

exports.createTopic = async ({ topic_name }) => {
    const { rows } = await pool.query(
        `insert into subject_topic (topic_name) values ($1) returning topic_id, topic_name`,
        [topic_name]
    );
    return rows[0];
};

