const express = require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');
const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()
const prisma_functions = require("./prisma/prisma_controller")


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

app.post("/", async (req,res) => {

  await prisma_functions.publish("2938068",parseInt(req.body.pyes),parseInt(req.body.pno),parseInt(req.body.psu))

  res.redirect("/")
})

app.post("/suspend", async (req,res) => {

  await prisma_functions.suspend("2938068",parseInt(req.body.syes),parseInt(req.body.sno),parseInt(req.body.ssu))

  res.redirect("/")
})

app.get("/retrieve", async (req,res) => {
  const data = await prisma_functions.retrieve("2938068")


  for (item in data) {
    const dateObject = new Date(data[item].date);
  
    const gmtOffsetMinutes = 420; // GMT-7 offset in minutes
    dateObject.setMinutes(dateObject.getMinutes() + gmtOffsetMinutes);
    
    // Get individual components of the adjusted date
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const day = String(dateObject.getDate()).padStart(2, "0");
    const hours = String(dateObject.getHours()).padStart(2, "0");
    const minutes = String(dateObject.getMinutes()).padStart(2, "0");
    
    // Formatted date string
    data[item].date = `${year}-${month}-${day} ${hours}:${minutes}`;
    
  }

  res.render("retrieve", { data })
})

app.post("/retrieve", async (req,res) => {
  await prisma_functions.delete_suspension(parseInt(req.body.id))
  res.redirect("/retrieve")

})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
