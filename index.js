const http = require('http')
const url = require('url')
const bcrypt = require('bcrypt')
const mysql = require('mysql')
const express = require('express')
const app = express()

const passwordSaltRounds = 10

// ------------
// Server setup
// ------------

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
    body: "Server up."
  })
})

// -----------
// User routes
// -----------

app.get('/user', function(req, res) {
  let request = req.body
  con.query(`SELECT (email, name, surname) FROM acme.users WHERE email = '${request.email}'`, function (err, result) {
    if (err) return res.status(400).json({error: "AUTH_ERROR", message: "Error while checking user."})
    res.json(result)
  })
})

app.post('/user/register', async function(req, res) {
  let request = req.body
  let hashedPassword = await bcrypt.hash(request.password, passwordSaltRounds)
  con.query(`INSERT INTO acme.users (email, name, surname, password) VALUES ('${request.email}', '${request.name}', '${request.surname}', '${hashedPassword}')`, function(err, result) {
    if (err) return res.status(400).json({error: "AUTH_ERROR", message: "Error while registering user."})
    res.json({result: result, message: "Successfully registered the new user."})
  })
})

app.get('/user/authenticate', async function(req, res) {
  let request = req.body
  con.query(`SELECT password FROM acme.users WHERE email = '${request.email}'`, async function(err, result) {
    if (err) return res.status(400).json({error: "AUTH_ERROR", message: "Error while authenticating user."})
    let passwordCorrect = await bcrypt.compare(request.password, result[0].password)
    if (!passwordCorrect) return res.json({authenticated: false, message: 'Invalid credentials'})
    res.json({result: true, message: "Authentication successful."})
  })
})

// ------------
// Parts routes
// ------------

app.get('/parts/models', function(req, res) { 
  con.query("SELECT * FROM acme.part_models", function (err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while checking part models."})
    res.json(result)
  })
})

app.post('/parts/models', function(req, res) {
  let request = req.body
  con.query(`INSERT INTO acme.part_models (category, brand, model) VALUES ('${request.category}', '${request.brand}', '${request.model}')`, function(err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while creating part model."})
    res.json({result: result, message: "Successfully created new part model."})
  })
})
  
app.get('/parts/units', function(req, res) { 
  con.query("SELECT * FROM acme.part_units", function (err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while checking part units."})
    res.json(result)
  })
})

app.post('/parts/units', async function(req, res) {
  let request = req.body
  let partExists = false

  partExists = con.query(`SELECT * FROM acme.part_units WHERE model_id = '${request.model_id}' AND id = '${request.id}'`, function(err, result) {
    return result.length > 0
  })

  if(partExists){
    con.query(`UPDATE acme.part_units SET availability = 'AVAILABLE' WHERE model_id = '${request.model_id}' AND id = '${request.id}'`, function(err, result) {
      if (err) return res.status(400).json({error: err, message: "Error while setting availability for the part unit."})
      return res.json({result: result, message: "Successfully set availability for part unit."})
    })
  } else {
    con.query(`INSERT INTO acme.part_units (model_id, id, current_airport_id) VALUES ('${request.model_id}', '${request.id}', '${request.current_airport_id}')`, function(err, result) {
      if (err) return res.status(400).json({error: err, message: "Error while creating the part unit."})
      res.json({result: result, message: "Successfully created new part unit."})
    })
  }
})

app.delete('/parts/units', function(req, res) {
  let request = req.body
  con.query(`DELETE FROM acme.part_units WHERE model_id = '${request.model_id}' AND id = '${request.id}'`, function(err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while deleting the part unit."})
    res.json({result: result, message: "Successfully deleted part unit."})
  })
})

app.post('/parts/units/availability', function(req, res) {
  let request = req.body
  con.query(`UPDATE acme.part_units SET availability = '${request.availability}' WHERE model_id = '${request.model_id}' AND id = '${request.id}'`, function(err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while setting availability for the part unit."})
    res.json({result: result, message: "Successfully set availability for part unit."})
  })
})

// --------------
// Airship routes
// --------------

app.get('/airships', function(req, res) {
  con.query(`SELECT * FROM acme.airships`, function (err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while checking airships."})
    res.json(result)
  })
})

app.post('/airships', function(req, res) {
  let request = req.body
  request.last_maintenance ? request.last_maintenance = "'" + request.last_maintenance + "'" : request.last_maintenance = 'NULL'
  request.current_airport_id ? request.current_airport_id = "'" + request.current_airport_id + "'" : request.current_airport_id = 'NULL'
  con.query(`INSERT INTO acme.airships (model, brand, last_maintenance, current_airport_id) VALUES ('${request.model}', '${request.brand}', ${request.last_maintenance}, ${request.current_airport_id})`, function(err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while creating the airship."})
    res.json({result: result, message: "Successfully created new airship."})
  })
})

// ------------------
// Maintenance routes
// ------------------

app.post('/maintenance', function(req, res) {
  let request = req.body
  con.query(`INSERT INTO acme.maintenances (affected_airship_id, motive_title, motive_description, instructions, requester_email, status) VALUES ('${request.airship}', '${request.title}', '${request.description}', '${request.instructions}', '${request.requester}', 'OPEN')`, function(err, result) {
    if (err) return res.status(400).json({error: err, message: "Error while creating the maintenance."})
    res.json({result: result, message: "Successfully created new maintenance."})
  })
})
  
const PORT = process.env.PORT || 3000
app.listen(PORT, function(req, res) { 
  console.log(`Server is running on port ${PORT}`)
})
