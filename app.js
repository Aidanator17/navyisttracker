const express = require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');
const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()


const app = express();


app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: 'c619251a-1695-4c7d-bad7-180c3bc3093b',
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
  if (req.query.yes == undefined) {
    values = {
      yes: 0,
      no: 0,
      su: 0
    }
  }
  else {
    values = {
      yes: req.query.yes,
      no: req.query.no,
      su: req.query.su
    }
  }
  res.render("index", { values })
})


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
