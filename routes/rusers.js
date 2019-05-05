var User = require('../entities/user');

module.exports = function (app, swig, gestorBDUsers) {
    app.get('/signup', function (req, res) {
        res.render('signup.html');
    });

    /**
     * @return {boolean}
     */
    function isNullOrWhiteSpace(value) {

        if (value == null) return true;

        return value.replace(/\s/g, '').length == 0;
    }

    app.post('/signup', function (req, res) {
        let respuesta = "ERROR";
        if (isNullOrWhiteSpace(req.body.email))
            return res.render('signup.html', {errorEmail: "El campo e-mail no puede estar vacio"});

        if (isNullOrWhiteSpace(req.body.name))
            return res.render('signup.html', {errorName: "El campo nombre no puede estar vacio"});

        if (isNullOrWhiteSpace(req.body.lastName))
            return res.render('signup.html', {errorLastName: "El campo apellido no puede estar vacio"});

        if (req.body.password !== req.body.passwordConfirm)
            return res.render('signup.html', {errorPasswordConfirm: "Las contraseñas no coinciden"});

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
                app.get('logger').info(`User ${req.session.usuario.email} has just been registered`);
                res.redirect("/");
            }
        });
    });

    app.get('/login', function (req, res) {
        res.render('login.html');
    });

    app.post('/login', function (req, res) {
        var respuesta = "ERROR 500";

        if (isNullOrWhiteSpace(req.body.username))
            return res.render('login.html', {error: "El campo e-mail no puede estar vacio"});

        if (isNullOrWhiteSpace(req.body.password))
            return res.render('login.html', {error: "El campo password no puede estar vacio"});

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
                app.get('logger').info(`User ${user.email} has logged in`);
                if (user.isAdmin)
                    res.redirect('/user/list');
                else
                    res.redirect("/");
            }
        });
    });

    app.get('/logout', function (req, res) {
        if (req.session.usuario != null)
            app.get('logger').info(`User ${req.session.usuario.email} has logged off`);
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
        });
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
                app.get('logger').info(`User ${req.session.usuario.email} has edited this user: ${id.toString()}`);
                res.redirect('/user/list');
            })
        });
    });

    app.get('/user/delete/:id', function (req, res) {
        let id = gestorBDUsers.mongo.ObjectID(req.params.id);
        gestorBDUsers.deleteUser(id, function (userDeleted) {
            if (userDeleted == null) {
                gestorBDUsers.getNormalUsers(function (users) {
                    res.render('user/list', {error: "Ha ocurrido un error al intentar eliminar el usuario", users});
                });
                return;
            }
            app.get('logger').info(`User ${req.session.usuario.email} has deleted this user: ${id.toString()}`);
            res.redirect('/user/list');
        });
    });

    app.post('/user/list/removeUsers', function (req, res) {
        let IDs = [];
        req.body.usersIDs.forEach(id => IDs.push(gestorBDUsers.mongo.ObjectID(id)));
        gestorBDUsers.deleteUsers(IDs, function (idMongo) {
            if (idMongo == null) {
                console.log("Error al intentar borrar el usuario con ID: " + idMongo);
            } else {
                app.get('logger').info(`User ${req.session.usuario.email} has deleted these users: ${IDs}`);
                res.end();
            }
        });
    });
};