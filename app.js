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
var fs = require('fs');
var https = require('https');
var fileUpload = require('express-fileupload');
var expressSession = require('express-session');

app.set('rest',rest);
app.set('jwt', jwt);

var initBDs = function(){
    gestorBDUsers.init(app, mongo);
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

//Rutas controladores por lógica
require("./routes/rusers.js")(app, swig, gestorBDUsers); // (app, param1, param2, etc.)
//require("./routes/rcanciones.js")(app, swig, gestorBD); // (app, param1, param2, etc.)
//require("./routes/rapicanciones")(app, gestorBD);

app.get('/', function (req, res) {
    var userLogged = false;
    var user = null;
    var datosEjemplo = [
        {
            title: "Ejemplo",
            description: "Descripcion de ejemplo",
            value: 5.6
        },
        {
            title: "Ejemplo 2",
            description: "Hola hola",
            value: 4
        }];
    if (req.session.usuario != null) {
        user = req.session.usuario;
        userLogged = true;
    }
    var respuesta = swig.renderFile('views/home.html', {offers: datosEjemplo, userLogged: userLogged, user : user});
    res.send(respuesta);
});

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