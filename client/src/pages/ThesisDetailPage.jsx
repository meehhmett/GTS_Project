import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getThesis } from "../api/thesis";

export default function ThesisDetailPage() {
    const { no } = useParams();
    const [t, setT] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            setErr("");
            setLoading(true);
            setT(null);
            try {
                const data = await getThesis(no);
                if (!cancelled) setT(data);
            } catch (e) {
                const msg = e?.response?.data?.error || e?.message || "failed to load thesis";
                if (!cancelled) setErr(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [no]);

    const keywords = (t?.keywords || []).map((k) => k.keyword_text);
    const topics = (t?.topics || []).map((x) => x.topic_name);
    const supervisors = (t?.supervisors || []).map((s) => `${s.name} (${s.supervisor_role})`);

    return (
        <div className="card">
            <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <Link className="pill" to="/">← back</Link>
                    {t ? <span className="pill">#{t.thesis_no}</span> : null}
                </div>

                <div style={{ height: 12 }} />

                {err ? (
                    <div className="card">
                        <div className="card-body">
                            <div className="h2">error</div>
                            <div className="muted">{err}</div>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="muted">loading...</div>
                ) : !t ? (
                    <div className="muted">not found</div>
                ) : (
                    <>
                        <div className="h1" style={{ marginBottom: 8 }}>{t.title}</div>
                        <div className="muted">
                            {t.author_name} · {t.university_name} · {t.year} · {t.type}
                        </div>

                        <div style={{ height: 14 }} />

                        {/* meta grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                            }}
                        >
                            <div className="card">
                                <div className="card-body">
                                    <div className="h2">basic info</div>
                                    <div className="muted">
                                        <div>language: {t.language_name}</div>
                                        <div>institute: {t.institute_name}</div>
                                        <div>pages: {t.number_of_pages ?? "-"}</div>
                                        <div>submission: {t.submission_date ?? "-"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div className="h2">people</div>
                                    <div className="muted">
                                        <div>author: {t.author_name}</div>
                                        <div>supervisors: {supervisors.length ? supervisors.join(", ") : "-"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ gridColumn: "1 / -1" }}>
                                <div className="card-body">
                                    <div className="h2">abstract</div>
                                    <div className="muted" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                        {t.abstract || "-"}
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div className="h2">keywords</div>
                                    {keywords.length ? (
                                        <div className="kv">
                                            {keywords.map((x) => (
                                                <span key={x} className="tag">{x}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="muted">-</div>
                                    )}
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div className="h2">topics</div>
                                    {topics.length ? (
                                        <div className="kv">
                                            {topics.map((x) => (
                                                <span key={x} className="tag">{x}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="muted">-</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
