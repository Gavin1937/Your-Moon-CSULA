require('dotenv').config();
var config = null;
if (process.env.NODE_ENV === "production") {
	config = require("../config/production.config.json");
} else {
	config = require("../config/dev.config.json");
}

const router = require('express').Router();
const passport = require('passport');

router.get("/google",
 passport.authenticate("google", {
    scope : ['email']
 })
)

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.cookie('token', req.user, {
      httpOnly: true,
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000 
    });
    res.redirect(config.cors_origin_whitelist+'/upload'); 
  }
);


router.get('/github', passport.authenticate(
    'github', { scope: [ 'user:email' ] }
));

router.get("/github/callback", 
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
    res.cookie('token', req.user, {
        httpOnly: true,
        secure: true,
        maxAge: 2 * 24 * 60 * 60 * 1000 
    });
    res.redirect(config.cors_origin_whitelist+'/upload'); 
    }
);


router.get("/login/success", (req,res) =>{
    if(req.user){
        res.status(200).json({
            user:req.user
        })
    }
})

router.get("login/failed", (req, res) =>{
    res.status(401).json({
        message: "login failed"
    })
})


 router.get("/logout", (req,res) =>{
    req.logout();
    res.redirect("/")
 })

 module.exports = router