const express = require('express');
const fs = require('fs')
const app = express();
const https = require('https');
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
app.use(expressValidator());
app.use(favicon(path.join(__dirname, 'src/img', 'favicon.ico')));

app.use('/src', express.static('src'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());
app.use(require('cookie-parser')('myServerSecret54'));

var cookieOptions = {
    maxAge: 600000,
    secure: true,
    signed: true
};
var MongoStore = require('connect-mongo')(session);
app.use(session({
    secret: 'myServerSecret55',
    //store: store,
    cookie: { maxAge: 600000 },
    store: new MongoStore({ url: 'mongodb://localhost:27017/session' })
}));



app.get('/', function(req, res) {
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (users != null && req.session.username) {
            res.render('index');
        } else {
            res.render('index');
        }
    });
});
app.post('/', function(req, res) {
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (users != null && req.session.username) {
            res.render('index');
        } else {
            res.render('index');
        }
    });
});

app.get('/register', function(req, res) {
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (users != null && req.session.username) {
            res.render('register');
        } else {
            res.render('register');
        }
    });

});
app.post('/register', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (users != null && req.session.username) {
            res.render('register', { message: 'you are already registered', authorised: true });
        } else {
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
                                res.render('register');
                            } else {
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
                                var confirmLink = webSiteName + '/regConfirm/' + newUser._id;
                                moduleEmail(email, 'Register confirmation', confirmLink);
                                res.end('Confirmation letter sent on your email');
                            }
                        } else
                            res.render('register');
                    });
                } else {
                    res.render('register');
                }
            });
        }
    });
});

app.get('/regConfirm/:id', function(req, res) {
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
    } else {
        res.render('404');
    }
});
app.get('/add', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (err) throw err;
        if (users != null && req.session.username) {
            res.render('add');
        } else {
            res.render('pleaseLogin');
        }
    });
});
app.post('/add', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (err) throw err;
        if (users != null && req.session.username) {
            let name = req.body.name;
            let price = req.body.price;
            let shop = req.body.shop;
            let now = new Date();
            let time = '';
            if (now.getDate() < 10)
                time += ('0' + now.getDate());
            else
                time += now.getDate();
            let month = now.getMonth() + 1;
            if (month < 10)
                time += ('.0' + month);
            else
                time += ('.' + month);
            if (now.getHours() < 10)
                time += (' / 0' + now.getHours());
            else
                time += (' / ' + now.getHours());
            if (now.getMinutes() < 10)
                time += (':0' + now.getMinutes());
            else
                time += (':' + now.getMinutes());
            let comment = req.body.comment;
            let category = req.body.category;
            req.checkBody('name', 'Name is required').notEmpty();
            req.checkBody('price', 'Price is required').notEmpty();
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
            res.redirect('login');
        }
    });
});
app.get('/check', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (err) throw err;
        if (users != null && req.session.username) {
            res.render('check');
        } else {
            res.render('pleaseLogin');
        }
    });
});

app.post('/check', function(req, res) {
    if (!req.body) return res.sendStatus(400);
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (err) throw err;
        if (users != null && req.session.username) {
            let regex = new RegExp(req.body.keyword, 'i');
            Items.find({ name: regex }, function(err, items) {
                if (err) throw err;
                res.send(items);
            });
        } else {
            res.render('searchResult');
        }
    });
});

app.get('/checking', function(req, res) {
    if (req.query.username)
        Users.findOne({ username: req.query.username }, function(err, users) {
            if (users != null) res.send({ username: true });
            else res.send({ username: false });
        });
    if (req.query.email)
        Users.findOne({ email: req.query.email }, function(err, users) {
            if (users != null) res.send({ email: true });
            else res.send({ email: false });
        });
    if (req.query.keyword) {
        Users.findOne({ username: req.signedCookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null && req.session.username) {


                let regex = new RegExp(req.query.keyword, 'i');
                Items.find({ name: regex }, function(err, items) {
                    if (err) throw err;
                    console.log(items);
                    res.send(items);
                });

            } else {
                res.render('login');
            }
        });
    }




});
app.get('/login', function(req, res) {
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (err) throw err;
        if (users != null && req.session.username) {
            res.redirect('/');
        } else {
            res.render('login');
        }
    });

});
app.post('/login', function(req, res) {
    Users.findOne({ username: req.body.username }, function(err, users) {
        if (err) throw err;
        if (users != null) {
            var a = bcrypt.compareSync(req.body.password, users.password);
            if (a && users.confirmation == true) {
                req.session.username = users.username;
                res.cookie('username', users.username, cookieOptions);
                res.redirect('/');
            } else if (users.confirmation == true) {
                //res.status(403);
                //res.send('Uncorrect password');
                res.render('login');
            } else {
                res.render('login');
            }
        } else {
            res.render('login');
        }
    });
});

app.get('/deletePost/:id', function(req, res) {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        if (!req.body) return res.sendStatus(400);
        Users.findOne({ username: req.signedCookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null && req.session.username) {
                Items.remove({ _id: req.params.id }, function(err, items) {
                    if (err) throw err;
                    if (items != null) {
                        console.log(items);
                        res.redirect('/check');
                    } else {
                        res.render('check');
                    }
                });
            } else {
                res.render('pleaseLogin');
            }
        });
    } else {
        res.render('404');
    }
});

app.get('/editPost/:id', function(req, res) {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        if (!req.body) return res.sendStatus(400);
        Users.findOne({ username: req.signedCookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null && req.session.username) {
                Items.findOne({ _id: req.params.id }, function(err, items) {
                    if (err) throw err;
                    if (items != null) {
                        console.log(items);
                        res.render('edit', { items: items });
                    } else {
                        res.render('check');
                    }
                });
            } else {
                res.render('pleaseLogin');
            }
        });
    } else {
        res.render('404');
    }
});
app.post('/editPost/:id', function(req, res) {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        if (!req.body) return res.sendStatus(400);
        Users.findOne({ username: req.signedCookies.username }, function(err, users) {
            if (err) throw err;
            if (users != null && req.session.username) {
                Items.findById({ _id: req.params.id }, function(err, items) {
                    if (err) throw err;
                    if (items != null) {
                        console.log(items);
                        items.name = req.body.name;
                        items.price = req.body.price;
                        items.shop = req.body.shop;
                        items.comment = req.body.comment;
                        items.category = req.body.category;
                        items.save(function(err) { if (err) throw err; });
                        res.redirect('/check');
                    } else {
                        res.render('check');
                    }
                });
            } else {
                res.render('pleaseLogin');
            }
        });
    } else {
        res.render('404');
    }
});


app.get('/logout', function(req, res) {
    res.clearCookie('username');
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
    });
    res.redirect('/');
});

app.get('/jquery', function(req, res) {
    res.render('jquery');
});
app.get('/auth', function(req, res) {
    Users.findOne({ username: req.signedCookies.username }, function(err, users) {
        if (users != null && req.session.username) {
            res.send({ username: req.signedCookies.username });
        } else {
            res.send({ username: 'guest' });
        }
    });
});


app.get('*', function(req, res) {
    res.render('404');
});