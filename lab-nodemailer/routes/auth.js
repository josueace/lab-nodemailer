const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const nodemailer = require('nodemailer');

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});


router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
let token = '';
for (let i = 0; i < 8; i++) {
    token += characters[Math.floor(Math.random() * characters.length )];
}

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode:token
    });

    newUser.save()
    .then((user) => {
      let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'josueacev2@gmail.com',
          pass: 'josue.1030'
        }
      });
      transporter.sendMail({
        from: '"My Awesome Project 👻" <myawesome@project.com>',
        to: user.email, 
        subject:"practice", 
        text: `http://localhost:3000/auth/confirm/${user.confirmationCode}`,
        html: `<b>http://localhost:3000/auth/confirm/${user.confirmationCode}</b>`
      })
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });
});


router.get("/confirm/:confirmCode", (req, res, next) => {
  User.findOne({ confirmationCode:req.params.confirmCode}, (err, user) => {
    
    if (user == null) {
      res.render("auth/signup", { message: "The username does not exist" });
      return;
    }

    User.updateOne({ _id: user._id} , {status:'Active'})
  .then(successCallback =>{
    res.render("confirmation");
  })
  .catch(errorCallback =>{
    res.render("auth/signup", { message: "Something went wrong" });
  });
   
      
    })
    .catch(err => {
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });

  router.get("/profile", (req, res, next) => {
    res.render("profile",req.user);
  });

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
