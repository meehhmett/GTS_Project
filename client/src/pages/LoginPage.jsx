import { useState } from "react";
import { login as loginApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const { refresh } = useAuth();
    const nav = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        try {
            const data = await loginApi(username, password);
            localStorage.setItem("token", data.token);
            await refresh();
            nav("/");
        } catch (e2) {
            setErr(e2?.response?.data?.error || "login failed");
        }
    }

    return (
        <div style={{ maxWidth: 360 }}>
            <h2>login</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
                <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">sign in</button>
                {err ? <div style={{ color: "crimson" }}>{err}</div> : null}
            </form>
        </div>
    );
}
