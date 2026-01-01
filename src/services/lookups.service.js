const { pool } = require("../config/db");

exports.languages = async () => {
    const { rows } = await pool.query(
        `select language_id, language_name
     from language
     order by language_name asc`
    );
    return rows;
};

exports.universities = async () => {
    const { rows } = await pool.query(
        `select university_id, university_name
     from university
     order by university_name asc`
    );
    return rows;
};

exports.institutes = async (universityId) => {
    if (universityId) {
        const { rows } = await pool.query(
            `select institute_id, institute_name, university_id
       from institute
       where university_id = $1
       order by institute_name asc`,
            [universityId]
        );
        return rows;
    }

    const { rows } = await pool.query(
        `select institute_id, institute_name, university_id
     from institute
     order by institute_name asc`
    );
    return rows;
};

exports.topics = async () => {
    const { rows } = await pool.query(
        `select topic_id, topic_name
     from subject_topic
     order by topic_name asc`
    );
    return rows;
};

exports.keywords = async () => {
    const { rows } = await pool.query(
        `select keyword_id, keyword_text
     from keyword
     order by keyword_text asc`
    );
    return rows;
};

exports.thesisTypes = () => ([
    "Master",
    "Doctorate",
    "Specialization in Medicine",
    "Proficiency in Art",
    "Specialization in Dentistry",
    "Minor Specialization in Medicine",
    "Specialization in Pharmacy",
]);

exports.years = async () => {
    const { rows } = await pool.query(
        `select distinct year
     from thesis
     order by year desc`
    );
    return rows.map(r => r.year);
};
