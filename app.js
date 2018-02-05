const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const fs = require('fs');
const conf = require('./conf');
const https = require('https');
const googlehome = require('google-home-notifier');


// load config
const env = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, './', 'config.json'))[env];

const lineUrl = config.lineUrl;
const lineChannelAccessToken = config.lineChannelAccessToken;
const lineChannelSecret = config.lineChannelSecret;
const serverIpAddress = config.serverIpAddress;
const serverPort = config.serverPort;

// load letsencrypt files.(build https server)
var options = {
  key: fs.readFileSync(conf.key),
  cert: fs.readFileSync(conf.fullchain)
}


var app = express();
// initialization
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// run server
var server = https.createServer(options, app);


console.log('Server is online. Port:' + serverPort);
console.log("debug ::");
console.log("lineChannelAccessToken:" + lineChannelAccessToken);
console.log("lineChannelSecret:" + lineChannelSecret);

// Validate signature
function validate_signature(signature, body) {
  return signature == crypto.createHmac('sha256', lineChannelSecret).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
};

app.get('/', function(req, res) {
  res.write('Hello world');
  res.end();
});

app.post('/', function(req, res) {
  console.log(req.body);
  res.send('POST request to the homepage');
});


// recieve POST message. Endpoint /webhook
app.post('/webhook', function(req, res) {
  console.log(req.body);
  // Validate signature
  if (!validate_signature(req.headers['x-line-signature'], req.body)) {
    console.log("Error:Validation");
    res.status(401);
    return null;
  }
  console.log(req.body);
  var text = req.body.text;
  console.log("text:" + text);
  if (text) {
    try {
      googlehome.notify(text, function(notifyRes) {
        console.log("Success");
        console.log(notifyRes);
        res.send(deviceName + ' will say: ' + text + '\n');
      });
    } catch (err) {
      console.log("Error");
      console.log(err);
      res.sendStatus(500);
      res.send(err);
    }
  } else {
    console.log("else phase");
    res.send('Please POST "text=Hello Google Home"');
  }
  // res.writeHead(200, {
  //   "Content-type": "text/plain"
  // });
  res.end();
});

// server listen
server.listen(serverPort);
