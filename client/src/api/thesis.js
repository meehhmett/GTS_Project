import { http } from "./http";

export async function searchThesis(params) {
    const { data } = await http.get("/thesis", { params });
    return data;
}

export async function getThesis(no) {
    const { data } = await http.get(`/thesis/${no}`);
    return data;
}

// admin-only functions
export async function createThesis(payload) {
    const { data } = await http.post("/thesis", payload);
    return data;
}

export async function updateThesis(no, payload) {
    const { data } = await http.put(`/thesis/${no}`, payload);
    return data;
}

export async function deleteThesis(no) {
    const { data } = await http.delete(`/thesis/${no}`);
    return data;
}
