module.exports = function(app, swig, gestorBDUsers) {

    app.get('/signup', function (req, res) {
       var respuesta = swig.renderFile('views/signup.html', {});
       res.send(respuesta);
    });

    app.get('/login', function (req, res) {
        var respuesta = swig.renderFile('views/login.html', {});
        res.send(respuesta);
    });

};