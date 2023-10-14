const router = require('express').Router();
const passport = require('passport');


  
  
router.get("/google",
 passport.authenticate("google", {
    scope : ['email']
 }),
//  console.log(first)
)

// router.get('/status', (req, res) => {
//     // If the user is authenticated, send a response indicating so
//     // if(req.isAuthenticated()) res.json({ isAuthenticated: true, user: req.user });
//     // else res.json({ isAuthenticated: false})
//     console.log(req.session.passport)
//     console.log(req.session.id)
//   });

router.get('/status',passport.authenticate('session'),
  function(req,res,next){
    if(req.user){
        res.json({
            isAuthenticated: true
        })
    }
  }
)
router.get("/login/success", (req,res) => {
    if(req.session.id){
        res.status(200).json({
            success:true,
            user: req.user,
        })
    }
})

router.get("/google/callback", passport.authenticate(
    "google",{
        successRedirect:"http://localhost:5173/upload", //replace with actual URL
        failureRedirect:"/login/failed"
    },
    // function(req, res){
    //     console.log(req.isAuthenticated());
    //     res.redirect("http://localhost:5173/upload")
    // }
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


// router.get("/login/success", (req,res) =>{
//     if(req.user){
//         res.status(200).json({
//             user:req.user
//         })
//     }
// })

// router.get("login/failed", (req, res) =>{
//     res.status(401).json({
//         message: "login failed"
//     })
// })


 router.get("/logout", (req,res) =>{
    req.logout();
    res.redirect("/")
 })

 module.exports = router