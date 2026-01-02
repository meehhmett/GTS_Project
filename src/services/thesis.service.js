const { pool } = require("../config/db");

function addParam(params, value) {
    params.push(value);
    return `$${params.length}`;
}

exports.search = async (q) => {
    const {
        year,
        type,
        university_id,
        institute_id,
        language_id,
        author_id,

        // text filters
        keyword,
        topic,
        supervisor, // eski
        name, // YENI: author OR supervisor ortak arama
        q: textQuery,

        limit = 20,
        page = 1,
        offset,
    } = q;

    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const pageNum = Math.max(Number(page) || 1, 1);

    const computedOffset =
        offset !== undefined ? Math.max(Number(offset) || 0, 0) : (pageNum - 1) * pageSize;

    const params = [];
    const where = [];

    if (year) where.push(`t.year = ${addParam(params, Number(year))}`);
    if (type) where.push(`t.type = ${addParam(params, type)}`);
    if (university_id) where.push(`t.university_id = ${addParam(params, Number(university_id))}`);
    if (institute_id) where.push(`t.institute_id = ${addParam(params, Number(institute_id))}`);
    if (language_id) where.push(`t.language_id = ${addParam(params, Number(language_id))}`);
    if (author_id) where.push(`t.author_id = ${addParam(params, Number(author_id))}`);

    if (textQuery) {
        const p = addParam(params, `%${textQuery}%`);
        where.push(`(t.title ilike ${p} or coalesce(t.abstract,'') ilike ${p})`);
    }

    // keyword text match
    if (keyword) {
        const p = addParam(params, keyword);
        where.push(`
      exists (
        select 1
        from thesis_keyword tk
        join keyword k on k.keyword_id = tk.keyword_id
        where tk.thesis_no = t.thesis_no
          and k.keyword_text ilike ${p}
      )
    `);
    }

    // topic text match
    if (topic) {
        const p = addParam(params, topic);
        where.push(`
      exists (
        select 1
        from thesis_subject ts
        join subject_topic st on st.topic_id = ts.topic_id
        where ts.thesis_no = t.thesis_no
          and st.topic_name ilike ${p}
      )
    `);
    }

    // supervisor name contains (legacy)
    if (supervisor) {
        const p = addParam(params, `%${supervisor}%`);
        where.push(`
      exists (
        select 1
        from thesis_supervisor s
        join person p2 on p2.person_id = s.person_id
        where s.thesis_no = t.thesis_no
          and (p2.first_name || ' ' || p2.last_name) ilike ${p}
      )
    `);
    }

    // ✅ NEW: name = author OR supervisor (tek kutu)
    if (name) {
        const p = addParam(params, `%${name}%`);
        where.push(`
      (
        (pa.first_name || ' ' || pa.last_name) ilike ${p}
        or exists (
          select 1
          from thesis_supervisor ts
          join person sp on sp.person_id = ts.person_id
          where ts.thesis_no = t.thesis_no
            and (sp.first_name || ' ' || sp.last_name) ilike ${p}
        )
      )
    `);
    }

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";

    // total query (limit/offset olmadan)
    const countSql = `
    select count(*)::int as total
    from thesis t
    join person pa on pa.person_id = t.author_id
    ${whereSql};
  `;

    // data query
    params.push(pageSize);
    const limIdx = params.length;

    params.push(computedOffset);
    const offIdx = params.length;

    const dataSql = `
    select
      t.thesis_no,
      t.title,
      t.year,
      t.type,
      t.submission_date,
      t.number_of_pages,
      t.author_id,
      (pa.first_name || ' ' || pa.last_name) as author_name,
      t.language_id,
      l.language_name,
      t.university_id,
      u.university_name,
      t.institute_id,
      i.institute_name
    from thesis t
    join person pa on pa.person_id = t.author_id
    join language l on l.language_id = t.language_id
    join university u on u.university_id = t.university_id
    join institute i on i.institute_id = t.institute_id
    ${whereSql}
    order by t.year desc, t.thesis_no asc
    limit $${limIdx} offset $${offIdx};
  `;

    const [countRes, dataRes] = await Promise.all([
        pool.query(countSql, params.slice(0, params.length - 2)),
        pool.query(dataSql, params),
    ]);

    const total = countRes.rows[0]?.total ?? 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return {
        page: pageNum,
        pageSize,
        offset: computedOffset,
        total,
        totalPages,
        items: dataRes.rows,
    };
};

// CREATE (admin)
exports.create = async (body) => {
    const client = await pool.connect();
    try {
        await client.query("begin");

        const {
            thesis_no,
            title,
            abstract,
            year,
            type,
            author_id,
            language_id,
            institute_id,
            university_id,
            keywords = [],
            topics = [],
            supervisors = [],
        } = body;

        await client.query(
            `
      insert into thesis
        (thesis_no, title, abstract, year, type,
         author_id, language_id, institute_id, university_id)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
            [
                thesis_no,
                title,
                abstract,
                year,
                type,
                author_id,
                language_id,
                institute_id,
                university_id,
            ]
        );

        for (const k of keywords) {
            await client.query(
                `insert into thesis_keyword (thesis_no, keyword_id) values ($1,$2)`,
                [thesis_no, k]
            );
        }

        for (const t of topics) {
            await client.query(
                `insert into thesis_subject (thesis_no, topic_id) values ($1,$2)`,
                [thesis_no, t]
            );
        }

        for (const s of supervisors) {
            await client.query(
                `insert into thesis_supervisor (thesis_no, person_id, supervisor_role)
         values ($1,$2,$3)`,
                [thesis_no, s.person_id, s.role]
            );
        }

        await client.query("commit");
        return { ok: true, thesis_no };
    } catch (err) {
        await client.query("rollback");
        throw err;
    } finally {
        client.release();
    }
};

// UPDATE (admin)
exports.update = async (no, body) => {
    const client = await pool.connect();
    try {
        await client.query("begin");

        const {
            title,
            abstract,
            year,
            type,
            author_id,
            language_id,
            institute_id,
            university_id,
            keywords = [],
            topics = [],
            supervisors = [],
        } = body;

        const exists = await client.query(
            `select thesis_no from thesis where thesis_no = $1`,
            [no]
        );
        if (exists.rowCount === 0) throw new Error("thesis not found");

        await client.query(
            `
                update thesis
                set
                    title = $2,
                    abstract = $3,
                    year = $4,
                    type = $5,
                    author_id = $6,
                    language_id = $7,
                    institute_id = $8,
                    university_id = $9
                where thesis_no = $1
            `,
            [no, title, abstract, year, type, author_id, language_id, institute_id, university_id]
        );

        await client.query(`delete from thesis_keyword where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_subject where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_supervisor where thesis_no = $1`, [no]);

        for (const k of keywords) {
            await client.query(
                `insert into thesis_keyword (thesis_no, keyword_id) values ($1,$2)`,
                [no, k]
            );
        }

        for (const t of topics) {
            await client.query(
                `insert into thesis_subject (thesis_no, topic_id) values ($1,$2)`,
                [no, t]
            );
        }

        for (const s of supervisors) {
            await client.query(
                `insert into thesis_supervisor (thesis_no, person_id, supervisor_role)
                 values ($1,$2,$3)`,
                [no, s.person_id, s.role]
            );
        }

        await client.query("commit");
        return { ok: true, thesis_no: no };
    } catch (err) {
        await client.query("rollback");
        throw err;
    } finally {
        client.release();
    }
};

// DELETE (cascade yoksa manuel, cascade varsa sadece thesis delete de yeter)
exports.remove = async (no) => {
    const client = await pool.connect();
    try {
        await client.query("begin");

        // cascade yoksa child’ları önce sil
        await client.query(`delete from thesis_keyword where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_subject where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_supervisor where thesis_no = $1`, [no]);

        const res = await client.query(`delete from thesis where thesis_no = $1`, [no]);

        if (res.rowCount === 0) throw new Error("thesis not found");

        await client.query("commit");
        return { ok: true, thesis_no: no };
    } catch (err) {
        await client.query("rollback");
        throw err;
    } finally {
        client.release();
    }
};

exports.getByNo = async (no) => {
    const client = await pool.connect();
    try {
        // ana tez
        const base = await client.query(
            `
      select
        t.thesis_no,
        t.title,
        t.abstract,
        t.year,
        t.type,
        t.submission_date,
        t.number_of_pages,
        t.author_id,
        (pa.first_name || ' ' || pa.last_name) as author_name,
        t.language_id,
        l.language_name,
        t.university_id,
        u.university_name,
        t.institute_id,
        i.institute_name
      from thesis t
      join person pa on pa.person_id = t.author_id
      join language l on l.language_id = t.language_id
      join university u on u.university_id = t.university_id
      join institute i on i.institute_id = t.institute_id
      where t.thesis_no = $1
      `,
            [Number(no)]
        );

        if (base.rowCount === 0) return null;

        const thesis = base.rows[0];

        // keywords
        const keywords = await client.query(
            `
      select k.keyword_id, k.keyword_text
      from thesis_keyword tk
      join keyword k on k.keyword_id = tk.keyword_id
      where tk.thesis_no = $1
      `,
            [Number(no)]
        );

        // topics
        const topics = await client.query(
            `
      select st.topic_id, st.topic_name
      from thesis_subject ts
      join subject_topic st on st.topic_id = ts.topic_id
      where ts.thesis_no = $1
      `,
            [Number(no)]
        );

        // supervisors
        const supervisors = await client.query(
            `
      select
        p.person_id,
        (p.first_name || ' ' || p.last_name) as name,
        ts.supervisor_role
      from thesis_supervisor ts
      join person p on p.person_id = ts.person_id
      where ts.thesis_no = $1
      `,
            [Number(no)]
        );

        return {
            ...thesis,
            keywords: keywords.rows,
            topics: topics.rows,
            supervisors: supervisors.rows,
        };
    } finally {
        client.release();
    }
};
