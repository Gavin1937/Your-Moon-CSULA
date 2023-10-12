const router = require('express').Router();
const passport = require('passport');

router.get("/google",
 passport.authenticate("google", {
    scope : ['email']
 })
)

router.get("/google/callback", passport.authenticate(
    "google",{
        successRedirect:"http://localhost:5173/upload", //replace with actual URL
        failureRedirect:"/login/failed"
    }
 ))


router.get('/github', passport.authenticate(
    'github', { scope: [ 'user:email' ] }
));

router.get("/github/callback", passport.authenticate(
    "github",{
        successRedirect:"http://localhost:5173/upload", //replace with actual URL
        failureRedirect:"/login/failed"
    }
))


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