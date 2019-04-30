var Offer = require('../entities/offer');
var User = require('../entities/user');
var Message = require('../entities/message');

module.exports = function (app, gestorBDUsers, gestorBDOffers, gestorBDConvers) {

    app.post("/api/login", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email: req.body.email,
            password: seguro
        };
        gestorBDUsers.getUser(criterio, function (usuario) {
            if (usuario == null) {
                res.status(401); // Unauthorized
                res.json({autenticado: false});
            } else {
                let token = app.get('jwt').sign({usuario: usuario, tiempo: Date.now() / 1000}, "shhh!IsASecret");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }
        });
    });

    app.get('/api/offer/list', function (req, res) {
        gestorBDOffers.getOffersExceptUserOnes(res.usuario, function (offers) {
            if (offers == null) {
                res.status(500);
                return res.json({error: "Se ha producido un error"});
            }
            res.status(200);
            res.send(JSON.stringify(offers));
        });
    });

    app.post('/api/offer/message', function (req, res) {
        if (req.body.receiverID == null || req.body.content == null || req.body.offerID == null) {
            res.status(400);
            return res.json({error: "Faltan campos"});
        }

        let message = new Message(gestorBDConvers.mongo.ObjectID(res.usuario._id), gestorBDConvers.mongo.ObjectID(req.body.receiverID), req.body.content);

        gestorBDConvers.sendMessage(message, req.body.offerID, function (offer) {
            if (offer == null) {
                res.status(500);
                return res.json({error: "Ha ocurrido un error"});
            }
            res.status(200);
            res.send();
        });
    });

    app.get('/api/offer/listConversation/:offerID', function (req, res) {
        let offerID = gestorBDOffers.mongo.ObjectID(req.params.offerID);

        gestorBDConvers.getConversation(offerID, gestorBDConvers.mongo.ObjectID(res.usuario._id), function (conversation) {
            if (conversation == null) {
                res.status(404);
                return res.send();
            }
            res.status(200);
            res.send(JSON.stringify(conversation));
        });
    });

};