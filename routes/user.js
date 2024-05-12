const express = require("express");
const path = require("path");
const router = express.Router();
const { createApi } = require("unsplash-js");

const User = require("../models/user");
const { createTokenForUser } = require("../services/authentication");
const {
  checkForAuthenticationCookie,
} = require("../middlewares/authentication");

const unsplash = createApi({
  accessKey: process.env.ACCESS_KEY,
});

router.get("/signup", (req, res) => {
  res.render("signup.ejs", {
    sign: "Signin",
  });
});

router.get("/profile", async (req, res) => {
  if (!req.user) return res.redirect("/");
  const user = await User.findOne({ _id: req.user._id });
  return res.render("profile.ejs", {
    user,
  });
});

router.get("/logout", (req, res) => {
  return res.clearCookie("token").redirect("/");
});

router.get("/search", async (req, res) => {
  const photos = await unsplash.photos.getRandom({ count: 30 });
  const response = photos.response;
  res.render("search.ejs", {
    response,
    user: req.user,
  });
  // res.send(response);
});

router.post("/signup", async (req, res) => {
  const { name, email, username, password, contact, birth } = req.body;
  const user = await User.create({
    name,
    email,
    username,
    password,
    contact,
    dob: birth,
  });

  const token = createTokenForUser(user);
  return res.cookie("token", token).redirect("profile");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(username, password);

    return res.cookie("token", token).redirect("profile");
  } catch (err) {
    return res.redirect("/");
  }
});

router.post("/search", async (req, res) => {
  const { search } = req.body;
  const user = await User.findOne({ _id: req.user._id });
  user.searchHistory.push(search);
  user.lastUpdated.push(Date.now());
  await user.save();
  const num = Math.floor(Math.random() * 30);
  const photos = await unsplash.search.getPhotos({
    query: search,
    per_page: num,
  });
  const response = photos.response;
  res.render("search.ejs", {
    search,
    response,
    user,
  });
  // res.send(response);
});

module.exports = router;
