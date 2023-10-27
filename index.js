const http = require('http')
const url = require('url')
const mysql = require('mysql')
const express = require('express'); 
const app = express(); 

var con = mysql.createConnection({
  host: "localhost",
  port: 3307,
  user: "root",
  password: ""
})

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!")
})

app.get('/', function(req, res) { 
  res.json({ 
    body: "Server up"
  }); 
}); 

app.get('/parts/models', function(req, res) { 
  con.query("SELECT * FROM acme.part_models", function (err, result) {
    if (err) throw err
    res.json(result)
    console.log(result)
  });
});
  
app.get('/parts/units', function(req, res) { 
  con.query("SELECT * FROM acme.part_units", function (err, result) {
    if (err) throw err
    res.json(result)
    console.log(result)
  });
}); 
  
const PORT = process.env.PORT || 3000
app.listen(PORT, function(req, res) { 
  console.log(`Server is running on port ${PORT}`); 
});

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