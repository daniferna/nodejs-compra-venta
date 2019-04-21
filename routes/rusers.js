var User = require('../entities/user');

module.exports = function (app, swig, gestorBDUsers) {
    app.get('/signup', function (req, res) {
        res.render('signup.html');
    });

    app.post('/signup', function (req, res) {
        let respuesta = "ERROR";
        if (req.body.password !== req.body.passwordConfirm) {
            res.render('signup.html', {errorPasswordConfirm: "Las contraseñas no coinciden"});
            return;
        }

        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        var usuario = new User(req.body.email, req.body.name, req.body.lastName, seguro);

        gestorBDUsers.saveUser(usuario, function (id) {
            if (id == null) {
                res.render('signup.html', {error: "Se ha producido un error"});
            } else if (typeof id === 'string') {
                res.render('signup.html', {error: id});
            } else {
                console.log(id);
                req.session.usuario = usuario;
                res.redirect("/");
            }
        });
    });


    app.get('/test', function (req, res) {
        gestorBDUsers.getUser({email: 'daniferna@outlook.com'}, function (user) {
            console.log(user);
            res.send(user);
        });
    });


    app.get('/login', function (req, res) {
        res.render('login.html');
    });

    app.post('/login', function (req, res) {
        var respuesta = "ERROR 500";
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
        var criterio = {
            email: req.body.username,
            password: seguro
        };

        gestorBDUsers.getUser(criterio, function (user) {
            if (user == null) {
                res.render('login.html', {error: "Email o contraseña incorrectos"});
            } else {
                req.session.usuario = user;
                if (user.isAdmin)
                    res.redirect('/user/list');
                else
                    res.redirect("/");
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.session.usuario = null;
        res.redirect('login');
    });

    app.get('/user/list', function (req, res) {
        gestorBDUsers.getNormalUsers(function (users) {
            res.render('user/list', {users})
        });
    });

    app.get('/user/edit/:id', function (req, res) {
        gestorBDUsers.getUser({_id: gestorBDUsers.mongo.ObjectID(req.params.id)}, function (userFound) {
            if (userFound == null) {
                gestorBDUsers.getNormalUsers(function (users) {
                    res.render('user/list', {error: "Ha ocurrido un error al intentar modificar el usuario", users});
                });
                return;
            }
            res.render('user/edit', {userToModify: userFound});
        })
    });

    app.post('/user/edit/:id', function (req, res) {
        let id = gestorBDUsers.mongo.ObjectID(req.params.id);
        gestorBDUsers.getUser({_id: id}, function (userFound) {
            if (userFound == null) {
                gestorBDUsers.getNormalUsers(function (users) {
                    res.render('user/list', {error: "Ha ocurrido un error al intentar modificar el usuario", users});
                });
                return;
            }
            userFound.email = req.body.email;
            userFound.name = req.body.name;
            userFound.lastname = req.body.lastName;
            gestorBDUsers.modifyUser(userFound, function (userAdded) {
                if (userFound == null) {
                    gestorBDUsers.getNormalUsers(function (users) {
                        res.render('user/list', {error: "Ha ocurrido un error al intentar modificar el usuario", users});
                    });
                    return;
                }
                res.redirect('/user/list');
            })
        });
    });

    app.get('/user/delete/:id', function (req, res) {
        let id = gestorBDUsers.mongo.ObjectID(req.params.id);
        gestorBDUsers.removeUser(id, function (userDeleted) {
            if (userDeleted == null) {
                gestorBDUsers.getNormalUsers(function (users) {
                    res.render('user/list', {error: "Ha ocurrido un error al intentar eliminar el usuario", users});
                });
                return;
            }
            res.redirect('/user/list');
        });
    });

};