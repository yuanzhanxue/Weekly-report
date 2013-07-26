/*
 * GET home page.
 */
var crypto = require('crypto');
var User = require('../models/user.js');
var Report = require('../models/report.js');

module.exports = function (app) {
    app.get('/', function (req, res) {
      User.getAll(function(uErr, users) {
        if(uErr) {
          users = [];
        }

        Report.get(null, null, null, function(rErr, reports) {
            if (rErr) {
                reports = [];
            }
            res.render('index', {
                title: 'Home',
                users: users,
                reports: reports
            });
        });
      });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: 'Register'
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        if (req.body['password-repeat'] != req.body['password']) {
            req.flash('error', 'Repeat is different to password');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');

        var newUser = new User({
            name: req.body.username,
            password: password
        });

        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', err);
                return res.redirect('/reg');
            }

            newUser.save(function (err) {
                if (err) {
                    req.flash('error', err);
                }
                req.session.user = newUser;
                req.flash('success', 'register success');
                res.redirect('/');
            });
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: 'User Login'
        });
    });

    app.post('/verifyUser', function(req, res, next) {
        res.header('Content-Type', 'text/plain');
        User.get(req.body.username, function(err, user) {
            var isExists='false';
            if (user) {
                isExists = 'true';
            }
            res.end(isExists)
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('base64');

        User.get(req.body.username, function(err, user) {
            if (!user) {
                req.flash('error', 'User doesn\'t exist');
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', 'Password is wrong');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', 'login success');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', 'logout success');
        res.redirect('/');
    });
    
    app.get('/u/:user', checkLogin);
    app.get('/u/:user', function(req, res) {
        User.get(req.params.user, function(err, user) {
            if (!user) {
                req.flash('error', 'User doesn\'t exist');
                return res.redirect('/');
            }
            Report.get(user.name, null, null, function(err, reports) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    reports: reports
                });
            });
        });
    });
    
    app.post('/week_report', checkLogin);
    app.post('/week_report', function(req, res) {
        Report.get(null, req.body.start, req.body.end, function(err, reports) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('reports', {
                layout: false,      // For partial refresh, layout is unnecessary.
                reports: reports
            });
        });
    });
    
    app.get('/report/:id/remove', checkLogin);
    app.get('/report/:id/remove', function(req, res) {
      var id= req.params.id;
      var user = req.session.user;
      Report.delete(id, user, function(err) {
      	var isSucc = 'true';
        if (err) {
          isSucc = 'false';
        }
          
        res.end(isSucc)
      });
    });
    
    app.post('/updateReport', checkLogin);
    app.post('/updateReport', function(req, res) {
      var user = req.session.user;
      Report.update(req.body._id, user, req.body.newreport, function(err) {
        var isSucc = 'true';
        if (err) {
          isSucc = 'false';
        }
          
        res.end(isSucc);
      });
    });
    
    app.post('/report', checkLogin);
    app.post('/report', function(req, res) {
        var currentUser = req.session.user;
        var report = new Report(currentUser.name, req.body.report);
        report.save(function(err) {
          if (err) {
            req.flash('error', err);
            return res.redirect('/');
          }
          req.flash('success', 'Report success');
          res.redirect('/u/' + currentUser.name);
        });
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', 'Unlogged in');
            return res.redirect('/login');
        }
        next();
    }
    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', 'Logged in');
            return res.redirect('/');
        }
        next();
    }
};