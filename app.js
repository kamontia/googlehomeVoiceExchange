var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const crypto = require("crypto");
var fs = require('fs');
var conf = require('./conf');
var https = require('https');

// Line Message API
const env = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, './', 'config.json'))[env];

const lineUrl = config.lineUrl;
const lineChannelAccessToken = config.lineChannelAccessToken;
const lineChannelSecret = config.lineChannelSecret;
console.log(lineChannelSecret);
console.log(lineChannelAccessToken);



var options = { 
key: fs.readFileSync(conf.key),
     cert: fs.readFileSync(conf.fullchain)
}

var app = express();

// urlencodedとjsonは別々に初期化する
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var server = https.createServer(options,app);


console.log('Server is online.');

// signatureのvalidation
const validate_signature = function(signature, body) {
    return signature == crypto.createHmac('sha256', lineChannelSecret).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
};

app.get('/', function( req, res ){
    res.write( 'ハローワールド' );
    res.end();
    });

app.post('/', function(req, res) {
    console.log(req.body);
    //console.log(req.body.text);
    // リクエストボディを出力
    // パラメータ名、nameを出力
    //console.log(JSON.parse(req.body));
    //res.writeHead(200,{"Content-type":"text/plain"});
    //res.write(data);
    //res.end();
    res.send('POST request to the homepage');
    });


app.post('/webhook',function(req,res){
    // signatureのvalidation
    if (!validate_signature(req.headers['x-line-signature'], req.body)) {
      console.log("Error:Validation");
    res.status(401);
    return null;
    }
    var  webhookEventObject = req.body.events[0];
    console.log(webhookEventObject);
    res.writeHead(200,{"Content-type":"text/plain"});
    res.end();
    });

server.listen(9000);
