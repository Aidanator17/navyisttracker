// Import required modules
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');

// Create an Express app
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Set up the path for static files (CSS, JavaScript, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Set up Express Session
app.use(session({
  secret: 'your-secret-key', // Change this to a secret key
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
  }
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", async (req, res) => {
    let values
    if (req.query.yes==undefined) {
      values = {
        yes:0,
        eyes:0,
        no:0,
        np:0
      }
    }
    else {
      values = {
        yes:req.query.yes,
        no:req.query.eyes,
        no:req.query.no,
        np:req.query.np
      }
    }
    res.render("index", {values})
  })

  
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
