// Import dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");

const app = express();

// Middleware setup
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
 
const MONGO_URI = "mongodb+srv://maruthisathish03:Mohana123@project1.v1qksi8.mongodb.net/?retryWrites=true&w=majority&appName=project1";

// Secret for JWT
const JWT_SECRET = "mySuperSecretKey";

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  secret: String
});

const User = mongoose.model("User", userSchema);

// Middleware to protect routes
function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.redirect("/login");

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect("/login");
    req.user = user;
    next();
  });
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Atlas");
  });

// GET routes
app.get("/", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/submit", authenticateToken, (req, res) => res.render("submit"));

// Protected secrets page
app.get("/secrets", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.render("secrets", { secret: user.secret });
  } catch (err) {
    res.redirect("/login");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

// Register route
app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!emailRegex.test(username)) {
    return res.send("Invalid email format.");
  }

  if (!passwordRegex.test(password)) {
    return res.send("Password must contain uppercase, lowercase, a number, and be at least 6 characters.");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email: username, password: hashedPassword });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    res.send("Error registering user.");
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ email: username });
    if (!user) return res.send("User not found.");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Incorrect password.");

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
    });

    res.redirect("/secrets");
  } catch (err) {
    res.send("Login error.");
  }
});

// Submit secret route
app.post("/submit", authenticateToken, async (req, res) => {
  const submittedSecret = req.body.secret;
  try {
    await User.findByIdAndUpdate(req.user.id, { secret: submittedSecret });
    res.redirect("/secrets");
  } catch (err) {
    res.send("Error submitting secret.");
  }
});

// Start server
app.listen(2000, () => {
  console.log("Server started on port 2000");
});