const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const { nowLogin } = require("../middleware");


router.get("/register", nowLogin, (req, res) => {
    res.render("users/register");
});

router.post("/register", nowLogin, async (req, res, next) => {
    try{
        const {username, password} = req.body;
        const user = new User({username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, function(err) {
            if(err) return next(err);
            req.flash("success", "BuildEventへようこそ");
            res.redirect("/events");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/register");
    }
    
});

router.get("/login", nowLogin, (req, res) => {
    res.render("users/login");
});

router.post("/login", nowLogin, passport.authenticate("local", {failureFlash: true, failureRedirect: "/login"}), (req, res) => {
    req.flash("success", "おかえりなさい！")
    res.redirect("/events");
});

router.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) {
          return req.flash("error", "ログアウト失敗");
        }
        req.flash("success", "ログアウトしました");
        res.redirect("/");
    });
})

module.exports = router;