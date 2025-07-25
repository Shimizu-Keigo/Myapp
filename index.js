require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const eventRoutes = require("./routes/events");
const userRoutes = require("./routes/users");

const Event = require("./models/event");

const  MongoStore  =  require ( 'connect-mongo' ) ;


const dbUrl = process.env.DB_URL|| "mongodb://127.0.0.1:27017/eventStand ";
    // process.env.DB_URL

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => {
        console.log("mongoDBコネクションok");
    })
    .catch(err => {
        console.log("mongoDBコネクションエラー");
        console.log(err);
    });

app.engine("ejs", ejsMate)
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const secret = process.env.SECRET || "kegosecret";

const store = MongoStore.create ({ 
      mongoUrl : dbUrl , 
      crypto: {
        secret
      },
      touchAfter: 24 * 3600
    } ) ;

  store.on( "error", (e) => {
    console.log("セッションストアエラー", e)
  });

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    return next();
});


app.get("/", (req, res) => {
    res.render("home");
});

app.use("/", userRoutes);
app.use("/events", eventRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`ポート${port}でリクエスト待受中...`);
})