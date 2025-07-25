module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.flash("error", "ログインしてください");
        return res.redirect("/login");
    }
    next();
}

module.exports.nowLogin = (req, res, next) => {
    if(req.isAuthenticated()) {
        return res.redirect("/events")
    }
    next();
}