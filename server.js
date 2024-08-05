require("dotenv").config();
require("colors");

const express = require("express");
var cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");


const connectDB = require("./database/connection");

const app = express();

// mongodb connection
connectDB();

// middlewares
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
app.use(cookieParser());
app.use(
  session({
    secret: "abc_dada_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
const authRoute = require("./routes/auth");
const indexRoute = require("./routes/index");
// const registerRoute = require("./routes/register");
// const signinRoute = require("./routes/signin");
const dashboardRoute = require("./routes/dashboard/controller");
const { checkAuthenticated } = require("./config/spotifyAuth");

app.use("/auth", authRoute);

app.use("/", indexRoute);
app.use("/dashboard", dashboardRoute);


// 404
//handle requests to non-existent pages
// app.use('*', (req, res, next) => {
//   res.status(404);
//   res.send("Error 404!");
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Your Server listening on PORT ${PORT}`.bold.red);
  console.log("Server url:", `http://localhost:${PORT}`.green);
});
