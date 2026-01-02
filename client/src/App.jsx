import { Routes, Route, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ThesisListPage from "./pages/ThesisListPage.jsx";
import ThesisDetailPage from "./pages/ThesisDetailPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
    const { user, logout } = useAuth();

    return (
        <div className="container">
            <div className="nav">
                <div className="left">
                    <Link className="brand" to="/">thesis db</Link>
                    <Link className="pill" to="/">browse</Link>

                    {!user ? (
                        <Link className="pill" to="/login">admin login</Link>
                    ) : null}

                    {user?.role === "admin" ? (
                        <Link className="pill" to="/admin">admin panel</Link>
                    ) : null}
                </div>

                <div className="right">
                    {user ? <span className="pill">role: {user.role}</span> : <span className="pill">guest</span>}

                    {!user ? (
                        <Link className="btn primary" to="/login">login</Link>
                    ) : (
                        <button className="btn" onClick={logout}>logout</button>
                    )}
                </div>
            </div>

            <div style={{ height: 14 }} />

            <Routes>
                <Route path="/" element={<ThesisListPage />} />
                <Route path="/thesis/:no" element={<ThesisDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </div>
    );
}
