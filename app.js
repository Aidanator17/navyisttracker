const express = require('express')
const path = require('path')
const ejs = require('ejs')
const session = require('express-session')
const PrismaClient = require('@prisma/client').PrismaClient
const prisma = new PrismaClient()
const prisma_functions = require("./prisma/prisma_controller")
const { stat } = require('fs');
const url = "https://wild-rose-antelope-veil.cyclic.cloud/"
const net = require('net');
const { PromiseSocket } = require("promise-socket")
const { parseISO, format, weeksToDays } = require('date-fns')
const { da } = require('date-fns/locale')

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
    res.render("index", { values })
  }
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
  let weekStats = {
    sunday: {
      str:"Sunday",
      yes: 0,
      no: 0,
      su: 0
    },
    monday: {
      str:"Monday",
      yes: 0,
      no: 0,
      su: 0
    },
    tuesday: {
      str:"Tuesday",
      yes: 0,
      no: 0,
      su: 0
    },
    wednesday: {
      str:"Wednesday",
      yes: 0,
      no: 0,
      su: 0
    },
    thursday: {
      str:"Thursday",
      yes: 0,
      no: 0,
      su: 0
    },
    friday: {
      str:"Friday",
      yes: 0,
      no: 0,
      su: 0
    },
    saturday: {
      str:"Saturday",
      yes: 0,
      no: 0,
      su: 0
    },
  }
  let weekFacts = {
    most_trans:0,
    most_trans_str:"",
    best_signup:0,
    best_signup_str:"",
    best_usage:0,
    best_usage_str:"",
    best_conv:0,
    best_conv_str:"",
  }
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
    data[item].datestring = data[item].date.toISOString().split('T')[0]
    data[item].dateDay = format(parseISO(data[item].datestring), 'EEEE')
    if (data[item].dateDay === "Sunday") {
      weekStats.sunday.yes += data[item].yes;
      weekStats.sunday.no += data[item].no;
      weekStats.sunday.su += data[item].su;
    }
    else if (data[item].dateDay === "Monday") {
      weekStats.monday.yes += data[item].yes;
      weekStats.monday.no += data[item].no;
      weekStats.monday.su += data[item].su;
    }
    else if (data[item].dateDay === "Tuesday") {
      weekStats.tuesday.yes += data[item].yes;
      weekStats.tuesday.no += data[item].no;
      weekStats.tuesday.su += data[item].su;
    }
    else if (data[item].dateDay === "Wednesday") {
      weekStats.wednesday.yes += data[item].yes;
      weekStats.wednesday.no += data[item].no;
      weekStats.wednesday.su += data[item].su;
    }
    else if (data[item].dateDay === "Thursday") {
      weekStats.thursday.yes += data[item].yes;
      weekStats.thursday.no += data[item].no;
      weekStats.thursday.su += data[item].su;
    }
    else if (data[item].dateDay === "Friday") {
      weekStats.friday.yes += data[item].yes;
      weekStats.friday.no += data[item].no;
      weekStats.friday.su += data[item].su;
    }
    else if (data[item].dateDay === "Saturday") {
      weekStats.saturday.yes += data[item].yes;
      weekStats.saturday.no += data[item].no;
      weekStats.saturday.su += data[item].su;
    }

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

  for (day in weekStats) {
    let total = weekStats[day].yes + weekStats[day].no + weekStats[day].su
    let yes_percentage = (weekStats[day].yes / total) * 100
    let su_percentage = ((weekStats[day].yes+weekStats[day].su) / total) * 100
    let conv_percentage = ((weekStats[day].yes) / (weekStats[day].yes+weekStats[day].no)) * 100
    weekStats[day].signup_per = String(yes_percentage.toFixed(2))+"%"
    weekStats[day].usage_per = String(su_percentage.toFixed(2))+"%"
    weekStats[day].conv_per = String(conv_percentage.toFixed(2))+"%"
  }
  stats.signup_per = String(((stats.total_yes / stats.trans_count) * 100).toFixed(2)) + "%"
  stats.usage_per = String((((stats.total_yes + stats.total_su) / stats.trans_count) * 100).toFixed(2)) + "%"
  stats.conv_per = String((((stats.total_yes) / (stats.total_yes + stats.total_no)) * 100).toFixed(2)) + "%"

  stats.recent_signup_per = String(((stats.recent_yes / stats.recent_trans_count) * 100).toFixed(2)) + "%"
  stats.recent_usage_per = String((((stats.recent_yes + stats.recent_su) / stats.recent_trans_count) * 100).toFixed(2)) + "%"
  stats.recent_conv_per = String((((stats.recent_yes) / (stats.recent_yes + stats.recent_no)) * 100).toFixed(2)) + "%"

  for (day in weekStats) {
    if ((weekStats[day].yes+weekStats[day].no+weekStats[day].su)>weekFacts.most_trans){
      weekFacts.most_trans = weekStats[day].yes+weekStats[day].no+weekStats[day].su
      weekFacts.most_trans_str = weekStats[day].str
    }
    if (parseFloat(weekStats[day].signup_per.replace('%',''))>weekFacts.best_signup){
      weekFacts.best_signup = parseFloat(weekStats[day].signup_per.replace('%',''))
      weekFacts.best_signup_str = weekStats[day].str
    }
    if (parseFloat(weekStats[day].usage_per.replace('%',''))>weekFacts.best_usage){
      weekFacts.best_usage = parseFloat(weekStats[day].usage_per.replace('%',''))
      weekFacts.best_usage_str = weekStats[day].str
    }
    if (parseFloat(weekStats[day].conv_per.replace('%',''))>weekFacts.best_conv){
      weekFacts.best_conv = parseFloat(weekStats[day].conv_per.replace('%',''))
      weekFacts.best_conv_str = weekStats[day].str
    }
  }

  function calculateTotal(obj) {
    return obj.yes + obj.no + obj.su;
  }

  const byTotal = { ...weekStats };
  const bySignupPer = { ...weekStats };
  const byUsagePer = { ...weekStats };
  const byConvPer = { ...weekStats };

  const sortedByTotal = Object.entries(byTotal).sort((a, b) => calculateTotal(b[1]) - calculateTotal(a[1]));
  const sortedBySignupPer = Object.entries(bySignupPer).sort((a, b) => parseFloat(b[1].signup_per) - parseFloat(a[1].signup_per));
  const sortedByUsagePer = Object.entries(byUsagePer).sort((a, b) => parseFloat(b[1].usage_per) - parseFloat(a[1].usage_per));
  const sortedByConvPer = Object.entries(byConvPer).sort((a, b) => parseFloat(b[1].conv_per) - parseFloat(a[1].conv_per));
  
  const weekStats_trans = Object.fromEntries(sortedByTotal);
  const weekStats_signup = Object.fromEntries(sortedBySignupPer);
  const weekStats_usage = Object.fromEntries(sortedByUsagePer);
  const weekStats_conv = Object.fromEntries(sortedByConvPer);

  res.render("rundown", { data, stats, recent_cap, weekStats, weekStats_trans, weekStats_signup, weekStats_usage, weekStats_conv,weekFacts })
})

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
