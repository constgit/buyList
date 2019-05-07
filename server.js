const express = require('express');
const fs = require('fs')
const app = express();
const https = require('https');
const cookieParser = require('cookie-parser');
const path = require('path');
const favicon = require('serve-favicon');
const router = require('./router/router');

const PORT = 3000;
const webSiteName = 'https://localhost:' + PORT;

const server = https.createServer({
        key: fs.readFileSync('sslcert/server.key'),
        cert: fs.readFileSync('sslcert/server.crt')
    }, app)
    .listen(3000, function() {
        console.log('Server is listening on port 3000...');
    });

app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/', router);