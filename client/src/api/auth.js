import { http } from "./http.js";

export async function login(username, password) {
    const { data } = await http.post("/auth/login", { username, password });
    return data; // {token, user}
}

export async function me() {
    const { data } = await http.get("/auth/me");
    return data; // {user}
}
