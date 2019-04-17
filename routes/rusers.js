var User = require('../entities/user');

module.exports = function (app, swig, gestorBDUsers) {
    app.get('/signup', function (req, res) {
        var respuesta = swig.renderFile('views/signup.html', {});
        res.send(respuesta);
    });

    app.post('/signup', function (req, res) {
        let respuesta = "ERROR";
        if (req.body.password !== req.body.passwordConfirm) {
            respuesta = swig.renderFile('views/signup.html', {errorPasswordConfirm: "Las contraseñas no coinciden"});
            res.send(respuesta);
            return;
        }

        var seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');

        var usuario = new User(req.body.email, req.body.name, req.body.lastName, seguro);

        gestorBDUsers.saveUser(usuario, function (id) {
            if (id == null) {
                respuesta = swig.renderFile('views/signup.html', {errorGeneral: "Se ha producido un error"});
                res.send(respuesta);
            } else if (typeof id === 'string') {
                respuesta = swig.renderFile('views/signup.html', {errorGeneral: id});
                res.send(respuesta);
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
        var respuesta = swig.renderFile('views/login.html', {});
        res.send(respuesta);
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
                respuesta = swig.renderFile('views/login.html', {errorGeneral: "Email o contraseña incorrectos"});
                res.send(respuesta);
            } else {
                req.session.usuario = user;
                if (user.isAdmin)
                    res.redirect('/users');
                else
                    res.redirect("/");
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.session.usuario = null;
        res.redirect('login');
    });

};