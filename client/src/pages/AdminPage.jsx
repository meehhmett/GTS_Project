import { useEffect, useState } from "react";
import AdminOnly from "../components/AdminOnly.jsx";
import { getLookups, addKeyword, addTopic, addPerson } from "../api/lookups";
import { createThesis, deleteThesis, getThesis, updateThesis, searchThesis } from "../api/thesis";

const empty = {
    thesis_no: "",
    title: "",
    abstract: "",
    year: "",
    type: "",
    author_id: "",
    language_id: "",
    university_id: "",
    institute_id: "",
    keywords: [],
    topics: [],
    supervisors: [],
};

export default function AdminPage() {
    const [lookups, setLookups] = useState(null);

    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listQ, setListQ] = useState("");
    const [listMeta, setListMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    const [mode, setMode] = useState("create");
    const [form, setForm] = useState(empty);
    const [status, setStatus] = useState("");

    // inline add states
    const [newKeyword, setNewKeyword] = useState("");
    const [newTopic, setNewTopic] = useState("");
    const [newPersonFirst, setNewPersonFirst] = useState("");
    const [newPersonLast, setNewPersonLast] = useState("");

    async function reloadLookups() {
        const l = await getLookups();
        setLookups(l);
        return l;
    }

    async function refreshList(nextPage = 1, nextQ = listQ) {
        setLoadingList(true);
        try {
            const term = (nextQ || "").trim();
            const isNo = term !== "" && /^\d+$/.test(term);

            const res = await searchThesis({
                page: nextPage,
                limit: 10,
                ...(term === "" ? {} : isNo ? { thesis_no: Number(term) } : { name: term }),
            });

            setItems(res.items);
            setListMeta({ page: res.page, totalPages: res.totalPages, total: res.total });
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        reloadLookups();
        refreshList(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function setField(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function toggleArrayId(field, id) {
        setForm((f) => {
            const set = new Set(f[field]);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            return { ...f, [field]: Array.from(set) };
        });
    }

    function addSupervisor() {
        setForm((f) => ({
            ...f,
            supervisors: [...f.supervisors, { person_id: "", role: "Supervisor" }],
        }));
    }

    function updateSupervisor(idx, patch) {
        setForm((f) => {
            const next = [...f.supervisors];
            next[idx] = { ...next[idx], ...patch };
            return { ...f, supervisors: next };
        });
    }

    function removeSupervisor(idx) {
        setForm((f) => {
            const next = [...f.supervisors];
            next.splice(idx, 1);
            return { ...f, supervisors: next };
        });
    }

    async function startEdit(thesisNo) {
        setStatus("");
        setMode("edit");
        const t = await getThesis(thesisNo);

        setForm({
            thesis_no: t.thesis_no,
            title: t.title || "",
            abstract: t.abstract || "",
            year: t.year || "",
            type: t.type || "",
            author_id: t.author_id || "",
            language_id: t.language_id || "",
            university_id: t.university_id || "",
            institute_id: t.institute_id || "",
            keywords: (t.keywords || []).map((k) => k.keyword_id),
            topics: (t.topics || []).map((x) => x.topic_id),
            supervisors: (t.supervisors || []).map((s) => ({
                person_id: s.person_id,
                role: s.supervisor_role,
            })),
        });
    }

    function resetForm() {
        setMode("create");
        setForm(empty);
        setStatus("");
    }

    async function submit() {
        setStatus("");
        try {
            const payload = {
                thesis_no: Number(form.thesis_no),
                title: form.title,
                abstract: form.abstract,
                year: Number(form.year),
                type: form.type,
                author_id: Number(form.author_id),
                language_id: Number(form.language_id),
                university_id: Number(form.university_id),
                institute_id: Number(form.institute_id),
                keywords: form.keywords.map(Number),
                topics: form.topics.map(Number),
                supervisors: form.supervisors
                    .filter((s) => s.person_id)
                    .map((s) => ({ person_id: Number(s.person_id), role: s.role })),
            };

            if (mode === "create") {
                await createThesis(payload);
                setStatus("created");
            } else {
                await updateThesis(form.thesis_no, payload);
                setStatus("updated");
            }

            await refreshList(1, listQ);
            if (mode === "create") resetForm();
        } catch (e) {
            setStatus(e?.response?.data?.error || e.message || "failed");
        }
    }

    async function remove(thesisNo) {
        if (!confirm(`delete thesis ${thesisNo}?`)) return;
        setStatus("");
        try {
            await deleteThesis(thesisNo);
            setStatus("deleted");
            await refreshList(1, listQ);
            if (mode === "edit" && String(form.thesis_no) === String(thesisNo)) resetForm();
        } catch (e) {
            setStatus(e?.response?.data?.error || e.message || "delete failed");
        }
    }

    // ✅ inline add handlers
    async function onAddKeyword() {
        const text = newKeyword.trim();
        if (!text) return;
        try {
            const row = await addKeyword({ keyword_text: text });
            const l = await reloadLookups();
            setForm((f) => ({ ...f, keywords: Array.from(new Set([...f.keywords, row.keyword_id])) }));
            setNewKeyword("");
            setStatus(`keyword added: ${row.keyword_text}`);
        } catch (e) {
            setStatus(e?.response?.data?.error || e.message || "add keyword failed");
        }
    }

    async function onAddTopic() {
        const text = newTopic.trim();
        if (!text) return;
        try {
            const row = await addTopic({ topic_name: text });
            await reloadLookups();
            setForm((f) => ({ ...f, topics: Array.from(new Set([...f.topics, row.topic_id])) }));
            setNewTopic("");
            setStatus(`topic added: ${row.topic_name}`);
        } catch (e) {
            setStatus(e?.response?.data?.error || e.message || "add topic failed");
        }
    }

    async function onAddPerson() {
        const fn = newPersonFirst.trim();
        const ln = newPersonLast.trim();
        if (!fn || !ln) return;
        try {
            const row = await addPerson({ first_name: fn, last_name: ln, academic_title: "Student" });
            await reloadLookups();
            // author olarak otomatik seç
            setForm((f) => ({ ...f, author_id: row.person_id }));
            setNewPersonFirst("");
            setNewPersonLast("");
            setStatus(`person added: ${row.first_name} ${row.last_name}`);
        } catch (e) {
            setStatus(e?.response?.data?.error || e.message || "add person failed");
        }
    }

    return (
        <AdminOnly>
            <div className="card">
                <div className="card-body">
                    <div className="h1">admin panel</div>
                    <div className="muted">create / edit / delete thesis</div>
                    {status ? <div className="pill" style={{ marginTop: 10 }}>{status}</div> : null}

                    <div style={{ height: 14 }} />

                    <div className="admin-grid">
                        <div className="card sticky">
                            <div className="card-body">
                                <div className="h2">thesis list</div>
                                <div className="muted">search + pagination</div>

                                <div style={{ height: 10 }} />

                                <div className="searchbar">
                                    <input className="input" placeholder="search (id or name)" value={listQ} onChange={(e) => setListQ(e.target.value)} />
                                    <button className="btn primary" onClick={() => refreshList(1, listQ)}>search</button>
                                </div>

                                <div style={{ height: 10 }} />
                                <span className="pill">page {listMeta.page}/{listMeta.totalPages} · total {listMeta.total}</span>
                                <div style={{ height: 10 }} />

                                {loadingList ? (
                                    <div className="muted">loading...</div>
                                ) : (
                                    <div className="grid">
                                        {items.map((t) => (
                                            <div key={t.thesis_no} className="list-item">
                                                <div className="h2">{t.title}</div>
                                                <div className="muted">#{t.thesis_no} · {t.year} · {t.author_name}</div>
                                                <div style={{ height: 10 }} />
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button className="btn" onClick={() => startEdit(t.thesis_no)}>edit</button>
                                                    <button className="btn danger" onClick={() => remove(t.thesis_no)}>delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="footerbar">
                                    <button className="btn" disabled={listMeta.page <= 1} onClick={() => refreshList(listMeta.page - 1, listQ)}>prev</button>
                                    <button className="btn" onClick={() => refreshList(1, listQ)}>first</button>
                                    <button className="btn" disabled={listMeta.page >= listMeta.totalPages} onClick={() => refreshList(listMeta.page + 1, listQ)}>next</button>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <div className="h2">{mode === "create" ? "new thesis" : `edit thesis #${form.thesis_no}`}</div>

                                <div style={{ height: 10 }} />

                                <div className="grid">
                                    <input className="input" placeholder="thesis_no" value={form.thesis_no} disabled={mode === "edit"} onChange={(e) => setField("thesis_no", e.target.value)} />
                                    <input className="input" placeholder="title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
                                    <textarea className="input" style={{ minHeight: 110 }} placeholder="abstract" value={form.abstract} onChange={(e) => setField("abstract", e.target.value)} />

                                    <div className="row">
                                        <select className="select" value={form.year} onChange={(e) => setField("year", e.target.value)}>
                                            <option value="">year</option>
                                            {(lookups?.years || []).map((y) => <option key={y} value={y}>{y}</option>)}
                                        </select>

                                        <select className="select" value={form.type} onChange={(e) => setField("type", e.target.value)}>
                                            <option value="">type</option>
                                            {(lookups?.types || []).map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>

                                        <select className="select" value={form.author_id} onChange={(e) => setField("author_id", e.target.value)}>
                                            <option value="">author</option>
                                            {(lookups?.persons || []).map((p) => (
                                                <option key={p.person_id} value={p.person_id}>{p.first_name} {p.last_name}</option>
                                            ))}
                                        </select>

                                        <select className="select" value={form.language_id} onChange={(e) => setField("language_id", e.target.value)}>
                                            <option value="">language</option>
                                            {(lookups?.languages || []).map((l) => (
                                                <option key={l.language_id} value={l.language_id}>{l.language_name}</option>
                                            ))}
                                        </select>

                                        <select className="select" value={form.university_id} onChange={(e) => setField("university_id", e.target.value)}>
                                            <option value="">university</option>
                                            {(lookups?.universities || []).map((u) => (
                                                <option key={u.university_id} value={u.university_id}>{u.university_name}</option>
                                            ))}
                                        </select>

                                        <select className="select" value={form.institute_id} onChange={(e) => setField("institute_id", e.target.value)}>
                                            <option value="">institute</option>
                                            {(lookups?.institutes || []).map((i) => (
                                                <option key={i.institute_id} value={i.institute_id}>{i.institute_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* inline add person */}
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="h2">quick add person</div>
                                            <div className="searchbar">
                                                <input className="input" placeholder="first name" value={newPersonFirst} onChange={(e) => setNewPersonFirst(e.target.value)} />
                                                <input className="input" placeholder="last name" value={newPersonLast} onChange={(e) => setNewPersonLast(e.target.value)} />
                                                <button className="btn primary" type="button" onClick={onAddPerson}>add</button>
                                            </div>
                                            <div className="muted" style={{ marginTop: 8 }}>ekleyince author’a otomatik seçer</div>
                                        </div>
                                    </div>

                                    {/* inline add keyword */}
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="h2">keywords</div>
                                            <div className="searchbar" style={{ marginBottom: 10 }}>
                                                <input className="input" placeholder="new keyword" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} />
                                                <button className="btn primary" type="button" onClick={onAddKeyword}>add</button>
                                            </div>
                                            <div className="kv">
                                                {(lookups?.keywords || []).map((k) => (
                                                    <button
                                                        type="button"
                                                        key={k.keyword_id}
                                                        className="btn"
                                                        onClick={() => toggleArrayId("keywords", k.keyword_id)}
                                                        style={{ borderColor: form.keywords.includes(k.keyword_id) ? "rgba(96,165,250,.55)" : undefined }}
                                                    >
                                                        {k.keyword_text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* inline add topic */}
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="h2">topics</div>
                                            <div className="searchbar" style={{ marginBottom: 10 }}>
                                                <input className="input" placeholder="new topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
                                                <button className="btn primary" type="button" onClick={onAddTopic}>add</button>
                                            </div>
                                            <div className="kv">
                                                {(lookups?.topics || []).map((t) => (
                                                    <button
                                                        type="button"
                                                        key={t.topic_id}
                                                        className="btn"
                                                        onClick={() => toggleArrayId("topics", t.topic_id)}
                                                        style={{ borderColor: form.topics.includes(t.topic_id) ? "rgba(96,165,250,.55)" : undefined }}
                                                    >
                                                        {t.topic_name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* supervisors */}
                                    <div className="card">
                                        <div className="card-body">
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div className="h2">supervisors</div>
                                                <button className="btn" type="button" onClick={addSupervisor}>add</button>
                                            </div>

                                            <div className="grid" style={{ marginTop: 10 }}>
                                                {form.supervisors.map((s, idx) => (
                                                    <div key={idx} className="row">
                                                        <select className="select" value={s.person_id} onChange={(e) => updateSupervisor(idx, { person_id: e.target.value })}>
                                                            <option value="">person</option>
                                                            {(lookups?.persons || []).map((p) => (
                                                                <option key={p.person_id} value={p.person_id}>{p.first_name} {p.last_name}</option>
                                                            ))}
                                                        </select>

                                                        <select className="select" value={s.role} onChange={(e) => updateSupervisor(idx, { role: e.target.value })}>
                                                            <option value="Supervisor">Supervisor</option>
                                                            <option value="Co-Supervisor">Co-Supervisor</option>
                                                        </select>

                                                        <button className="btn danger" type="button" onClick={() => removeSupervisor(idx)}>remove</button>
                                                        <div />
                                                    </div>
                                                ))}
                                                {form.supervisors.length === 0 ? <div className="muted">no supervisors</div> : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                        {mode === "edit" ? <button className="btn" type="button" onClick={resetForm}>cancel</button> : null}
                                        <button className="btn primary" type="button" onClick={submit}>{mode === "create" ? "create" : "save"}</button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminOnly>
    );
}
