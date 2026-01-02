import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminOnly({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="card">
                <div className="card-body muted">loading...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (user.role !== "admin") {
        return (
            <div className="card">
                <div className="card-body">yetkin yok</div>
            </div>
        );
    }

    return children;
}
