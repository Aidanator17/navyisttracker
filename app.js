const express = require('express');
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');
const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()
const prisma_functions = require("./prisma/prisma_controller");
const { stat } = require('fs');
const url = "https://wild-rose-antelope-veil.cyclic.cloud/"
const net = require('net');
const { PromiseSocket } = require("promise-socket")

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


  const socket = new net.Socket()
  const promiseSocket = new PromiseSocket(socket)
  let alive = true
  try {
    await promiseSocket.connect(parseInt(process.env.testPORT), String(process.env.testIP))
  }
  catch {
    alive = false
  }
  
  if (alive) {
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
  res.render("index", { values })}
  else {
    res.render("offline")
  }
})

app.post("/", async (req, res) => {

  await prisma_functions.publish("2938068", parseInt(req.body.pyes), parseInt(req.body.pno), parseInt(req.body.psu))

  res.redirect("/")
})

app.post("/suspend", async (req, res) => {

  await prisma_functions.suspend("2938068", parseInt(req.body.syes), parseInt(req.body.sno), parseInt(req.body.ssu))

  res.redirect("/")
})

app.get("/retrieve", async (req, res) => {
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

  res.render("retrieve", { data, url })
})

app.post("/retrieve", async (req, res) => {
  await prisma_functions.delete_suspension(parseInt(req.body.id))
  res.redirect("/retrieve")
})

app.get("/rundown", async (req, res) => {
  let recent_cap = 5

  const data = (await prisma_functions.rundown("2938068")).reverse()
  const stats = {
    trans_count: 0,
    total_yes: 0,
    total_no: 0,
    total_su: 0,
    signup_per: undefined,
    usage_per: undefined,
    recent_trans_count: 0,
    recent_yes: 0,
    recent_no: 0,
    recent_su: 0,
    recent_signup_per: undefined,
    recent_usage_per: undefined,
  }

  for (item in data) {

    stats.trans_count = stats.trans_count + data[item].total_trans
    stats.total_yes = stats.total_yes + data[item].yes
    stats.total_no = stats.total_no + data[item].no
    stats.total_su = stats.total_su + data[item].su
    if (item < recent_cap) {
      stats.recent_trans_count = stats.recent_trans_count + data[item].total_trans
      stats.recent_yes = stats.recent_yes + data[item].yes
      stats.recent_no = stats.recent_no + data[item].no
      stats.recent_su = stats.recent_su + data[item].su
    }

    const dateObject = new Date(data[item].date);
    const gmtOffsetMinutes = 420; // GMT-7 offset in minutes
    dateObject.setMinutes(dateObject.getMinutes() + gmtOffsetMinutes);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const day = String(dateObject.getDate()).padStart(2, "0");
    data[item].date = `${year}-${month}-${day}`;

  }

  stats.signup_per = String(((stats.total_yes / stats.trans_count) * 100).toFixed(2)) + "%"
  stats.usage_per = String((((stats.total_yes + stats.total_su) / stats.trans_count) * 100).toFixed(2)) + "%"

  stats.recent_signup_per = String(((stats.recent_yes / stats.recent_trans_count) * 100).toFixed(2)) + "%"
  stats.recent_usage_per = String((((stats.recent_yes + stats.recent_su) / stats.recent_trans_count) * 100).toFixed(2)) + "%"

  res.render("rundown", { data, stats, recent_cap })
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
