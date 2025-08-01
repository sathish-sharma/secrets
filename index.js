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


const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  secret: [String]
});
const User = mongoose.model("User", userSchema);
let currentUserId = null;

app.get("/", (req, res) => res.render("home"));

app.get("/register", (req, res) => {
  const error = req.query.error;
  res.render("register", { error });
});

app.get("/login", (req, res) => {
  const error = req.query.error;
  res.render("login", { error });
});

app.get("/submit", (req, res) => {
  if (!currentUserId) 
  return res.redirect("/login");
  const error = req.query.error;
  res.render("submit", { error });
});


app.get("/logout", (req, res) => {
  currentUserId = null;
  res.redirect("/");
});

app.get("/secrets", (req, res) => {
  if (!currentUserId) 
    return res.redirect("/login");
  User.findById(currentUserId)
    .then(user => {
      if (user) {
        res.render("secrets", { secret: user.secret });
      } else {
        res.render("error", { message: "User not found." });
      }
    })
    .catch(() => res.render("error", { message: "Error fetching secret." }));
});



app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: username });
    if (existingUser) {
      return res.redirect("/register?error=" + encodeURIComponent("Email is already registered."));
    }
    const newUser = new User({ name, email: username, password });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.redirect("/register?error=" + encodeURIComponent("Registration error."));
  }
});



app.post("/login", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ email: username })
    .then(user => {
      if (!user) {
        return res.redirect("/login?error=" + encodeURIComponent("User not found."));
      } else if (user.password !== password) {
        return res.redirect("/login?error=" + encodeURIComponent("Incorrect password."));
      } else {
        currentUserId = user._id;
        return res.redirect("/submit");
      }
    })
    .catch(() => res.redirect("/login?error=" + encodeURIComponent("Login error.")));
});



app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  if (!currentUserId) 
    return res.redirect("/login");
  User.findById(currentUserId)
    .then(user => {
      if (user) {
        user.secret.push(submittedSecret.trim());
        return user.save();
      } else {
        res.render("error", { message: "User not found." });
      }
    })
    .then(() => res.redirect("/secrets"))
    .catch(() => res.redirect("/submit?error=" + encodeURIComponent("Error submitting secret.")));
});


app.listen(2000, () => {
  console.log("Server started on port 2000");
});
