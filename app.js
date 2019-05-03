// CADENA URL BBDD MONGODB
// mongodb://admin:claveSegura@wallapop-shard-00-00-ktxou.gcp.mongodb.net:27017,wallapop-shard-00-01-ktxou.gcp.mongodb.net:27017,wallapop-shard-00-02-ktxou.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Wallapop-shard-0&authSource=admin&retryWrites=true

// Módulos
var express = require('express');
var app = express();
var rest = require('request');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var swig = require('swig');
var mongo = require('mongodb');
var gestorBDUsers = require('./modules/gestorBDUsers');
var gestorBDOffers = require('./modules/gestorBDOffers');
var gestorBDConvers = require('./modules/gestorBDConvers');
var fs = require('fs');
var https = require('https');
var fileUpload = require('express-fileupload');
var expressSession = require('express-session');

app.set('rest',rest);
app.set('jwt', jwt);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

var initBDs = function(){
    gestorBDUsers.init(app, mongo);
    gestorBDOffers.init(app, mongo);
    gestorBDConvers.init(app, mongo);
};
initBDs();

app.use(fileUpload());
app.use(expressSession({
    secret: 'shhh!IsASecret',
    resave: true,
    saveUninitialized: true
}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type , token
    // Paso el usuario logeado a todas las peticiones
    res.locals.user = req.session.usuario;
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

// Variables
app.set('port', 8081);
app.set('db', "mongodb://admin:claveSegura@wallapop-shard-00-00-ktxou.gcp.mongodb.net:27017,wallapop-shard-00-01-ktxou.gcp.mongodb.net:27017,wallapop-shard-00-02-ktxou.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Wallapop-shard-0&authSource=admin&retryWrites=true");
app.set('clave', 'superSegura');
app.set('crypto', crypto);

//Router control token API
// routerUsuarioToken
var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    var token = req.headers['token'] || req.query.token || req.body.token;
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'shhh!IsASecret', function (err, infoToken) {
            if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                res.status(403); // Forbidden
                res.json({
                    acceso: false,
                    error: 'Token invalido o caducado'
                });
            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });
    } else {
        res.status(403); // Forbidden
        res.json({
            acceso: false,
            mensaje: 'No hay Token'
        });
    }
});
// Aplicar routerUsuarioToken
app.use('/api/offer/*', routerUsuarioToken);
app.use('/api/user/*', routerUsuarioToken);


//Rutas controladores por lógica
require("./routes/rusers.js")(app, swig, gestorBDUsers); // (app, param1, param2, etc.)
require("./routes/roffers.js")(app, swig, gestorBDOffers, gestorBDConvers); // (app, param1, param2, etc.)
require("./routes/rapi.js")(app, gestorBDUsers, gestorBDOffers, gestorBDConvers);

app.use(function (err, req, res, next) {
    console.log("Error producido: " + err); //we log the error in our db
    if (!res.headersSent) {
        res.status(400);
        res.send("Recurso no disponible");
    }
});

// lanzar el servidor
app.listen(app.get('port'), function () {
    console.log("Servidor corriendo en el puerto: " + app.get('port'))
});