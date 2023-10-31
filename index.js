const http = require('http')
const url = require('url')
const bcrypt = require('bcrypt')
const mysql = require('mysql')
const express = require('express')
const app = express()

const passwordSaltRounds = 10

app.use(express.json())

var con = mysql.createConnection({
  host: "localhost",
  port: 3307,
  user: "root",
  password: ""
})

con.connect(function(err) {
  if (err) throw err
  console.log("Connected!")
})

app.get('/', function(req, res) { 
  res.json({ 
    body: "Server up"
  })
})

app.get('/user', function(req, res) {
  let request = req.body
  con.query(`SELECT (email, name, surname) FROM acme.users WHERE email = '${request.email}'`, function (err, result) {
    if (err) throw err
    res.json(result)
  })
})

app.post('/user/register', async function(req, res) {
  let request = req.body
  let hashedPassword = await bcrypt.hash(request.password, passwordSaltRounds)
  con.query(`INSERT INTO acme.users (email, name, surname, password) VALUES ('${request.email}', '${request.name}', '${request.surname}', '${hashedPassword}')`, function(err, result) {
    if (err) throw err
    res.json({result: result, message: "Successfully registered the new user."})
  })
})

app.get('/user/authenticate', async function(req, res) {
  let request = req.body
  con.query(`SELECT password FROM acme.users WHERE email = '${request.email}'`, async function(err, result) {
    if (err) throw err
    let passwordCorrect = await bcrypt.compare(request.password, result[0].password)
    if (!passwordCorrect) return res.json({authenticated: false, message: 'Invalid credentials'})
    res.json({result: true, message: "Authentication successful."})
  })
})

app.get('/parts/models', function(req, res) { 
  con.query("SELECT * FROM acme.part_models", function (err, result) {
    if (err) throw err
    res.json(result)
  })
})
  
app.get('/parts/units', function(req, res) { 
  con.query("SELECT * FROM acme.part_units", function (err, result) {
    if (err) throw err
    res.json(result)
    console.log(result)
  })
})
  
const PORT = process.env.PORT || 3000
app.listen(PORT, function(req, res) { 
  console.log(`Server is running on port ${PORT}`)
})

/**
const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url).pathname
  if(reqUrl == '/') {
    res.write('hello world')
    res.end()
  }
  else if(reqUrl == "/parts/models") {
    let response
    con.query("SELECT * FROM acme.part_models", function (err, result) {
      if (err) throw err
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.write(result)
      console.log(result)
    });
    
    res.end()
  }
  else if(reqUrl == "/parts/units") {
    res.write('hello parts')
    res.end()
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
*/