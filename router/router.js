const express = require('express');
const router = express.Router();


router.get('/', function(req, res) {
    res.render('index');
});
router.get('/register', function(req, res) {
    res.render('register');
});
router.get('/add', function(req, res) {
    res.render('add');
});
router.get('/check', function(req, res) {
    res.render('check');
});
router.get('/login', function(req, res) {
    res.render('login');
});
router.get('/logout', function(req, res) {
    res.render('logout');
});

module.exports = router;
