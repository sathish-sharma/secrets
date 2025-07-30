const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const MONGO_URI = "mongodb+srv://maruthisathish03:Mohana123@project1.v1qksi8.mongodb.net/?retryWrites=true&w=majority&appName=project1";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.log("MongoDB Connection Error:", err));

// Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  secret: [String]
});
const User = mongoose.model("User", userSchema);
let currentUserId = null;

app.get("/", (req, res) => res.render("home"));

app.get("/register", (req, res) => res.render("register"));

app.get("/login", (req, res) => res.render("login"));

app.get("/submit", (req, res) => {
  if (!currentUserId) return res.redirect("/login");
  res.render("submit");
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.get("/secrets", (req, res) => {
  if (!currentUserId) return res.redirect("/login");

  User.findById(currentUserId)
    .then(user => {
      if (user) {
        res.render("secrets", { secret: user.secret });
      } else {
        res.send("User not found.");
      }
    })
    .catch(() => res.send("Error fetching secret."));
});

app.post("/register", (req, res) => {
  const { name, username, password } = req.body;

  const newUser = new User({ name, email: username, password });

  newUser.save()
    .then(() => res.redirect("/login"))
    .catch(() => res.send("Error registering user."));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  User.findOne({ email: username })
    .then(user => {
      if (!user) {
        res.send("User not found.");
      } else if (user.password !== password) {
        res.send("Incorrect password.");
      } else {
        currentUserId = user._id;
        res.redirect("/submit");
      }
    })
    .catch(() => res.send("Login error."));
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  if (!currentUserId) return res.redirect("/login");
  User.findById(currentUserId)
  .then(user => {
    if (user) {
      user.secret.push(submittedSecret);
      return user.save();
    } else {
      res.send("User not found.");
    }
  })
  .then(() => res.redirect("/secrets"))
  .catch(() => res.send("Error submitting secret."));

});
app.listen(2000, () => {
  console.log("Server started on port 2000");
});
