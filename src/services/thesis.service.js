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
        keyword,
        topic,
        supervisor,
        q: textQuery,
        limit = 20,
        page = 1,
        offset, // isteyen yine offset gönderebilir
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

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";

    // total query (limit/offset olmadan)
    const countSql = `
    select count(*)::int as total
    from thesis t
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
        pool.query(countSql, params.slice(0, params.length - 2)), // limit/offset paramlarını sayımdan çıkar
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
exports.getByNo = async (no) => {
    // tek thesis + keyword/topic/supervisor listeleri
    const base = await pool.query(
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
        [no]
    );

    if (!base.rows[0]) return null;

    const [keywords, topics, supervisors] = await Promise.all([
        pool.query(
            `
      select k.keyword_id, k.keyword_text
      from thesis_keyword tk
      join keyword k on k.keyword_id = tk.keyword_id
      where tk.thesis_no = $1
      order by k.keyword_id asc
      `,
            [no]
        ),
        pool.query(
            `
      select st.topic_id, st.topic_name
      from thesis_subject ts
      join subject_topic st on st.topic_id = ts.topic_id
      where ts.thesis_no = $1
      order by st.topic_id asc
      `,
            [no]
        ),
        pool.query(
            `
      select s.person_id, (p.first_name || ' ' || p.last_name) as name, s.supervisor_role
      from thesis_supervisor s
      join person p on p.person_id = s.person_id
      where s.thesis_no = $1
      order by s.supervisor_role asc, s.person_id asc
      `,
            [no]
        ),
    ]);

    return {
        ...base.rows[0],
        keywords: keywords.rows,
        topics: topics.rows,
        supervisors: supervisors.rows,
    };
};
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

        // 1) thesis
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

        // 2) keywords
        for (const k of keywords) {
            await client.query(
                `insert into thesis_keyword (thesis_no, keyword_id)
         values ($1,$2)`,
                [thesis_no, k]
            );
        }

        // 3) topics
        for (const t of topics) {
            await client.query(
                `insert into thesis_subject (thesis_no, topic_id)
         values ($1,$2)`,
                [thesis_no, t]
            );
        }

        // 4) supervisors
        for (const s of supervisors) {
            await client.query(
                `insert into thesis_supervisor
           (thesis_no, person_id, supervisor_role)
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

        // thesis var mı kontrol
        const exists = await client.query(
            `select thesis_no from thesis where thesis_no = $1`,
            [no]
        );
        if (exists.rowCount === 0) {
            throw new Error("thesis not found");
        }

        // 1) thesis update
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
            [
                no,
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

        // 2) ilişkileri temizle
        await client.query(`delete from thesis_keyword where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_subject where thesis_no = $1`, [no]);
        await client.query(`delete from thesis_supervisor where thesis_no = $1`, [no]);

        // 3) yeni ilişkileri ekle
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
exports.remove = async (no) => {
    const client = await pool.connect();

    try {
        await client.query("begin");

        // önce child tablolar
        await client.query(
            `delete from thesis_keyword where thesis_no = $1`,
            [no]
        );

        await client.query(
            `delete from thesis_subject where thesis_no = $1`,
            [no]
        );

        await client.query(
            `delete from thesis_supervisor where thesis_no = $1`,
            [no]
        );

        // sonra parent
        const res = await client.query(
            `delete from thesis where thesis_no = $1`,
            [no]
        );

        if (res.rowCount === 0) {
            throw new Error("thesis not found");
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
