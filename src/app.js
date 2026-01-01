const express = require("express");

const app = express();

app.use(express.json());

const testRoutes = require("./routes/test.routes");
app.use("/api", testRoutes);

const personRoutes = require("./routes/person.routes");
app.use("/api/person", personRoutes);

const thesisRoutes = require("./routes/thesis.routes");
app.use("/api/thesis", thesisRoutes);

const lookupsRoutes = require("./routes/lookups.routes");
app.use("/api/lookups", lookupsRoutes);



app.get("/", (req, res) => {
    res.json({ ok: true });
});

module.exports = app;
