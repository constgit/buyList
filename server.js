const express = require('express');
const fs = require('fs')
const app = express();
const https = require('https');
const Cookies = require('cookies');
const cookieParser = require('cookie-parser');
const path = require('path');
const favicon = require('serve-favicon');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const moduleEmail = require('./modules/moduleEmail');
const expressValidator = require('express-validator');

const PORT = 3000;
const webSiteName = 'https://localhost:' + PORT;

const server = https.createServer({
        key: fs.readFileSync('sslcert/server.key'),
        cert: fs.readFileSync('sslcert/server.crt')
    }, app)
    .listen(PORT, function() {
        console.log('Server is listening on port ' + PORT + '...');
    });

mongoose.connect('mongodb://localhost:27017/buyList');
let db = mongoose.connection;
let Users = require('./models/users');
let Items = require('./models/items');
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to MongoDB');
});
app.use(cookieParser());
app.use(expressValidator());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/public', express.static('public'));
app.use('/src', express.static('src'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());
var MongoStore = require('connect-mongo')(session);



app.get('/', function(req, res) {
    res.render('index');
});
app.post('/', function(req, res) {
    res.render('index');
});

app.get('/register', function(req, res) {
    res.render('register', { message: '' });
});
app.post('/register', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;



    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);


    Users.find({ username: req.body.username }, function(err, users) {

        if (users[0] === undefined) {
            console.log(users[0]);
            Users.find({ email: req.body.email }, function(err, users) {
                if (users[0] === undefined) {
                    let errors = req.validationErrors();
                    if (errors) {
                        res.render('register', { errors: errors });
                    } else {
                        //если нет, то записываем данные пользователя в базу	
                        var newUser = new Users({
                            _id: new mongoose.Types.ObjectId(),
                            name: name,
                            email: email,
                            username: username,
                            password: password,
                            confirmation: false
                        });
                        bcrypt.genSalt(14, function(err, salt) {
                            bcrypt.hash(newUser.password, salt, function(err, hash) {
                                if (err) throw err;
                                newUser.password = hash;
                                newUser.save(function(err) {
                                    if (err) throw err;
                                });
                            });
                        });
                        //подтверждение по почте
                        var confirmLink = webSiteName + '/regConfirm/' + newUser._id;
                        moduleEmail(email, 'Register confirmation', confirmLink);
                        res.end('Confirmation letter sent on your email');
                    }
                } else
                    res.render('register', { message: 'User with this email already registered' });
            });
        } else {
            res.render('register', { message: 'User with this login already registered' });

        }
    });
});

app.get('/regConfirm/:id', function(req, res) {
    //проверяем, является ли id объектом _id
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        Users.findById(req.params.id, function(err, users) {
            if (users != null) {
                if (err) throw err;
                users.confirmation = true;
                users.save(function(err) {
                    if (err) throw err;
                    res.end('Successfully confirmed');
                });
            } else {
                res.status(403);
                res.end('403: Uncorrect link');
            }
        });
    }
});
app.get('/add', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    if (req.cookies.username) {
        Users.findOne({ username: req.cookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null) {
                res.render('add');
            } else {
                res.render('pleaseLogin', { message: 'please log in' });
            }
        });
    } else {
        res.render('pleaseLogin', { message: 'please log in' });
    }


});
app.post('/add', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    if (req.cookies.username) {
        Users.findOne({ username: req.cookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null) {
                let name = req.body.name;
                let price = req.body.price;
                let shop = req.body.shop;
                let now = new Date();
                let time='';
                if (now.getDate()<10)
                time += ('0'+now.getDate());
                else
                time += now.getDate();
            	let month=now.getMonth()+1;
            	if (month<10)
                time += ('.0'+month);
                else
                time += ('.'+month);
            	if (now.getHours()<10)
                time += (' / 0'+now.getHours());
                else
                time += (' / '+now.getHours());
                if (now.getMinutes()<10)
                time += (':0'+now.getMinutes());
                else
                time += (':'+now.getMinutes());         	

                let comment = req.body.comment;
                let category = req.body.category;


                req.checkBody('name', 'Name is required').notEmpty();
                req.checkBody('price', 'Price is required').isNumeric();
                req.checkBody('shop', 'Shop is required').notEmpty();
                req.checkBody('category', 'Category is required').notEmpty();



                let currentItem = new Items({
                    _id: new mongoose.Types.ObjectId(),
                    name: name,
                    price: price,
                    shop: shop,
                    time: time,
                    comment: comment,
                    category: category
                });

                currentItem.save(function(err) {
                    if (err) throw err;
                    console.log('New item successfully added.');
                    console.log(currentItem);
                });
                res.redirect('add');


            } else {
                res.redirect('login', { message: 'please log in' });
            }
        });
    } else {
        res.redirect('login', { message: 'please log in' });
    }



});
app.get('/check', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    if (req.cookies.username) {
        Users.findOne({ username: req.cookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null) {
                res.render('check');
            } else {
                res.render('pleaseLogin', { message: 'please log in' });
            }
        });
    } else {
        res.render('pleaseLogin', { message: 'please log in' });
    }


});

app.post('/check', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body.keyword);

    if (!req.body) return res.sendStatus(400);
    if (req.cookies.username) {
        Users.findOne({ username: req.cookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null) {


                console.log(users);
                let regex = new RegExp(req.body.keyword, 'i');

                Items.find({ name: regex }, function(err, items) {
                    if (err) throw err;
                    console.log(items);
                    res.render('searchResult', items);

                });



            } else {
                res.render('searchResult', { message: ['nothing to show'] });
            }
        });
    } else {
        res.render('pleaseLogin', { message: 'please log in' });
    }

});
app.get('/login', function(req, res) {
    if (req.cookies.username) {
        Users.findOne({ username: req.cookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null) {

                res.redirect('/');
            } else {
                res.render('login', { message: '' });
            }
        });
    } else {
        res.render('login', { message: '' });
    }
});


app.post('/login', function(req, res) {
    var cookies = new Cookies(req, res, { "keys": ['keyboard cat'] });
    var cookieOptions = {
        maxAge: 120000000,
        secure: true,
        signed: true
    };
    //	cookies.set('username','me');
    Users.findOne({ username: req.body.username }, function(err, users) {
        if (err) throw err;
        if (users != null) {
            var a = bcrypt.compareSync(req.body.password, users.password);
            if (a && users.confirmation == true) {


                cookies.set('username', users.username, cookieOptions);
                res.redirect('/');
            } else if (users.confirmation == true) {
                //res.status(403);
                //res.send('Uncorrect password');
                res.render('login', { message: 'Uncorrect password' });
            } else {
                res.render('login', { message: 'Your email is not confirmed yet' });
            }
        } else {
            res.render('login', { message: 'This login is not registered yet' });
        }
    });
});
app.get('/logout', function(req, res) {
    res.render('logout');
});