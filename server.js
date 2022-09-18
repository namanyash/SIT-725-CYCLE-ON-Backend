const express = require("express");
const connectDb = require("./config/db");
const app = express();

// Connect Database
connectDb();

//Init MiddleWare
app.use(express.json({ extended: false }));

app.use("/api/users", require("./routes/api/users"));
app.use("/api/admins", require("./routes/api/admins"));
app.use("/api/adminActions", require("./routes/api/adminActions"));
app.use("/api/locations", require("./routes/api/locations"));
app.use("/api/rides", require("./routes/api/ride"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
});
