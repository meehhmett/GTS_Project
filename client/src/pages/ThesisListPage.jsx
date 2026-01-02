import { useEffect, useMemo, useState } from "react";
import { searchThesis } from "../api/thesis";
import { getLookups } from "../api/lookups";
import { Link } from "react-router-dom";

export default function ThesisListPage() {
    const [lookups, setLookups] = useState(null);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [err, setErr] = useState("");

    const [page, setPage] = useState(1);

    // filters
    const [year, setYear] = useState("");
    const [type, setType] = useState("");
    const [universityId, setUniversityId] = useState("");
    const [languageId, setLanguageId] = useState("");

    const [q, setQ] = useState("");
    const [name, setName] = useState("");
    const [keyword, setKeyword] = useState("");
    const [topic, setTopic] = useState("");

    useEffect(() => {
        getLookups().then(setLookups);
    }, []);

    const params = useMemo(() => {
        const p = { page, limit: 8 };
        if (year) p.year = Number(year);
        if (type) p.type = type;
        if (universityId) p.university_id = Number(universityId);
        if (languageId) p.language_id = Number(languageId);
        if (q) p.q = q;
        if (name) p.name = name;
        if (keyword) p.keyword = keyword;
        if (topic) p.topic = topic;
        return p;
    }, [page, year, type, universityId, languageId, q, name, keyword, topic]);

    async function runSearch(nextPage = 1) {
        setErr("");
        setSearched(true);
        setLoading(true);
        setData(null);
        try {
            const res = await searchThesis({ ...params, page: nextPage });
            setData(res);
            setPage(res.page || nextPage);
        } catch (e) {
            setErr(e?.response?.data?.error || e?.message || "search failed");
        } finally {
            setLoading(false);
        }
    }

    function resetAll() {
        setYear("");
        setType("");
        setUniversityId("");
        setLanguageId("");
        setQ("");
        setName("");
        setKeyword("");
        setTopic("");
        setPage(1);
        setData(null);
        setErr("");
        setSearched(false);
        setLoading(false);
    }

    useEffect(() => {
        if (!searched) return;
        runSearch(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <div className="card">
            <div className="card-body">
                <div className="h1">browse theses</div>
                <div className="muted">use filters then hit search</div>

                <div style={{ height: 14 }} />

                {/* filters */}
                <div className="card" style={{ marginBottom: 14 }}>
                    <div className="card-body">
                        <div className="row">
                            <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                                <option value="">year</option>
                                {(lookups?.years || []).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="">type</option>
                                {(lookups?.types || []).map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>

                            <select className="select" value={universityId} onChange={(e) => setUniversityId(e.target.value)}>
                                <option value="">university</option>
                                {(lookups?.universities || []).map((u) => (
                                    <option key={u.university_id} value={u.university_id}>{u.university_name}</option>
                                ))}
                            </select>

                            <select className="select" value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
                                <option value="">language</option>
                                {(lookups?.languages || []).map((l) => (
                                    <option key={l.language_id} value={l.language_id}>{l.language_name}</option>
                                ))}
                            </select>

                            <input className="input" placeholder="q (title/abstract)" value={q} onChange={(e) => setQ(e.target.value)} />
                            <input className="input" placeholder="name (author or supervisor)" value={name} onChange={(e) => setName(e.target.value)} />
                            <input className="input" placeholder="keyword (text)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                            <input className="input" placeholder="topic (text)" value={topic} onChange={(e) => setTopic(e.target.value)} />
                        </div>

                        <div style={{ height: 10 }} />

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button className="btn" onClick={resetAll}>reset</button>
                            <button className="btn primary" onClick={() => runSearch(1)}>search</button>
                        </div>
                    </div>
                </div>

                {/* results */}
                {err ? (
                    <div className="card">
                        <div className="card-body">
                            <div className="h2">error</div>
                            <div className="muted">{err}</div>
                        </div>
                    </div>
                ) : !searched ? (
                    <div className="card">
                        <div className="card-body muted">no results yet. hit search</div>
                    </div>
                ) : loading ? (
                    <div className="muted">loading...</div>
                ) : !data || data.items.length === 0 ? (
                    <div className="card">
                        <div className="card-body muted">no results</div>
                    </div>
                ) : (
                    <>
                        <div className="grid">
                            {data.items.map((t) => (
                                <Link key={t.thesis_no} className="list-item" to={`/thesis/${t.thesis_no}`}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="h2" style={{ marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {t.title}
                                            </div>
                                            <div className="muted">
                                                {t.author_name} · {t.university_name}
                                            </div>
                                        </div>
                                        <span className="pill">#{t.thesis_no}</span>
                                    </div>

                                    <div style={{ height: 10 }} />

                                    <div className="kv">
                                        <span className="tag">{t.year}</span>
                                        <span className="tag">{t.type}</span>
                                        <span className="tag">{t.language_name}</span>
                                        <span className="tag">{t.institute_name}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="footerbar">
                            <button className="btn" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>prev</button>

                            <span className="pill">
                page {data.page} / {data.totalPages} · total {data.total}
              </span>

                            <button className="btn" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>next</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
