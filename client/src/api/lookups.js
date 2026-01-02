import { http } from "./http";

export async function getLookups() {
    const [years, types, universities, languages, institutes, persons, topics, keywords] =
        await Promise.all([
            http.get("/lookups/years"),
            http.get("/lookups/thesis-types"),
            http.get("/lookups/universities"),
            http.get("/lookups/languages"),
            http.get("/lookups/institutes"),
            http.get("/lookups/persons"),
            http.get("/lookups/topics"),
            http.get("/lookups/keywords"),
        ]);

    return {
        years: years.data,
        types: types.data,
        universities: universities.data,
        languages: languages.data,
        institutes: institutes.data,
        persons: persons.data,
        topics: topics.data,
        keywords: keywords.data,
    };
}
export async function addPerson(payload) {
    const { data } = await http.post("/lookups/persons", payload);
    return data;
}

export async function addKeyword(payload) {
    const { data } = await http.post("/lookups/keywords", payload);
    return data;
}

export async function addTopic(payload) {
    const { data } = await http.post("/lookups/topics", payload);
    return data;
}
