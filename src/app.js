const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(express.json());

const testRoutes = require("./routes/test.routes");
app.use("/api", testRoutes);

const personRoutes = require("./routes/person.routes");
app.use("/api/person", personRoutes);

const thesisRoutes = require("./routes/thesis.routes");
app.use("/api/thesis", thesisRoutes);

const lookupsRoutes = require("./routes/lookups.routes");
app.use("/api/lookups", lookupsRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);







app.get("/", (req, res) => {
    res.json({ ok: true });
});

module.exports = app;
