var express = require('express');
var router = express.Router();
const usermodel=require("./user")
const postmodel=require('../routes/posts')
const passport=require('passport')
const localStrategy=require('passport-local');
const upload=require('./multer')
const storymodel=require("./story")

passport.use(new localStrategy(usermodel.authenticate()));

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  const posts=await postmodel.find().populate('user')
  // console.log(posts)

  const story=await storymodel.find({user:{$ne:user._id}}).populate("user") // bol rha h ki mujhe na add krke sbko add kr dena 
  // console.log(story)
  var obj={};
  let storynumber=story.filter(function(elem){
     if(!obj[elem.user._id]){
      obj[elem.user.id]="fghjkl"
      return true
     }
  })
  // console.log(story,"ft")
  res.render('feed', {footer: true,posts,user,story:storynumber});
});

router.get('/profile',isLoggedin,async function(req, res) {
 const user=await usermodel
 .findOne({username:req.session.passport.user})
 .populate("posts")

  res.render('profile', {footer: true, user:user});
});

/* profile picture update */
router.post("/profile/picture",isLoggedin,upload.single('file'),async(req,res)=>{
  if(!req.file){
   return res.status(400).send("no files were uploaded")

  }
  const user=await usermodel.findOne({username:req.session.passport.user});/* phale dekha ki konsa user h  */
  user.profilepicture=req.file.filename
  await user.save();
  res.redirect("/edit")
})




router.get('/search',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  res.render('search', {footer: true,user});
});

router.get('/username/:inputsearch',isLoggedin,async function(req, res) {
  const regexPattern = new RegExp(`${req.params.inputsearch}`, 'i');
  /* in this params inputsearch could be search here  */
  const user=await usermodel.find({username:regexPattern})
  res.json(user);
  // yaha se data ko bheja h jo mongodb me search hoke aya by regex
});

router.get('/edit',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  res.render('edit', {footer: true,user:user});
});

router.get('/upload',isLoggedin, function(req, res) {
  res.render('upload', {footer: true,user: req.user});
});

router.post('/register',(req,res,next)=>{
  var newuser=new usermodel({
    username:req.body.username,
    name:req.body.name,
    email:req.body.email,

   
  })
  usermodel.register(newuser,req.body.password).then(function(u){
    passport.authenticate('local')(req,res,()=>{
      res.redirect("/profile")
    })
  })
})

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      // Handle error
      return next(err);
    }
    if (!user) {
      // User authentication failed
      return res.redirect('/login');
    }
    // User authentication succeeded
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/feed');
    });
  })(req, res, next);
});



router.get('/logout',function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})
function isLoggedin(req,res,next){
  if(req.isAuthenticated ()){
    return next();
  }
  else{
    res.redirect('/login')
  }
}
/*  profile update */
router.post('/profile/update', isLoggedin, async function(req, res) {
  try {
    console.log('Session username:', req.session.passport.user);
    console.log('Update data:', req.body.username, req.body.name, req.body.bio);

     const user = await usermodel.findOneAndUpdate(
      { username: req.session.passport.user },
      { username: req.body.username, name: req.body.name, bio: req.body.bio },
      { new: true }
    );

   

    // Log in the user again to update the session

      res.redirect("/profile");
  
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send('Error updating profile');
  }
});



/* for post  */

router.post("/upload", isLoggedin, upload.single('image'), async function (req, res) {
  const user = await usermodel.findOne({username: req.session.passport.user});
  if(req.body.type === "post"){
    const post = await postmodel.create({
      caption: req.body.caption,
      image: req.file.filename,
      user: user._id
    })
    user.posts.push(post._id);
  }
  else if(req.body.type === "story"){
    const story = await storymodel.create({
      image: req.file.filename,
      user: user._id
    })
    user.stories.push(story._id);
  }

  await user.save();
  res.redirect("/feed");
});



router.get('/searchy',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  res.render('footer', {footer: true,user});
});


/* for likes update  */
router.get('/likes/:postid',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  const post=await postmodel.findOne({_id:req.params.postid})//post dhudo jis pr like aya hh 
  if(post.likes.indexOf(user._id) === -1){

    post.likes.push(user._id) // likes ke array me user ki id push kr do jisne bhi id le like aya ho 
  }
  else{
    post.likes.splice(post.likes.indexOf(user._id),1) // .post.likes.pust(userr) show there the index of array 
  }
  await post.save();
  res.json(post)
});

router.get('/save/:dataid',isLoggedin,async function(req, res) {
  const user=await usermodel.findOne({username:req.session.passport.user})
  const post=await postmodel.findOne({_id:req.params.dataid})
 

     user.saved.push(req.params.dataid);
    
  await user.save();
  res.json(user)
  
});

/* for story */
router.get("/story/:number", isLoggedin, async function (req, res) {
  const storyuser = await usermodel.findOne({ username: req.session.passport.user }).populate("stories")
  // console.log(storyuser)

  const image = storyuser.stories[req.params.number];

  if(storyuser.stories.length > req.params.number){
    res.render("story", { footer: false, storyuser: storyuser, storyimage : image, number: req.params.number });
  }
  else{
    res.redirect("/feed");
  } 
});


router.get("/story/:id/:number", isLoggedin, async function (req, res) {
  const storyuser = await usermodel.findOne({ _id: req.params.id })
  .populate("stories")

  const image = storyuser.stories[req.params.number];

  if(storyuser.stories.length > req.params.number){
    res.render("story", { footer: false, storyuser: storyuser, storyimage : image, number: req.params.number });
  }
  else{
    res.redirect("/feed");
  }

});



module.exports = router;
