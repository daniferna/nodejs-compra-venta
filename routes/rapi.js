var Offer = require('../entities/offer');
var User = require('../entities/user');
var Message = require('../entities/message');

module.exports = function (app, gestorBDUsers, gestorBDOffers, gestorBDConvers) {

    app.post("/api/login", function (req, res) {
        let seguro = "";
        if (!req.body.seguro)
            seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        else
            seguro = req.body.seguro;
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
                app.get('logger').info(`User ${req.body.email} has just gained access to the API with this token: ${token}`);
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
            app.get('logger').info(`User ${res.usuario.email} has requested the list of available offers using the API`);
            res.send(JSON.stringify(offers));
        });
    });

    app.post('/api/offer/message', function (req, res) {
        if (req.body.content == null || req.body.offerID == null || req.body.offerOwnerID == null || req.body.conversation == null) {
            res.status(400);
            return res.json({error: "Faltan campos"});
        }

        let conversation = JSON.parse(req.body.conversation);
        let senderID = conversation.buyerID;
        let receiverID = conversation.sellerID;
        if (req.body.offerOwnerID === res.usuario._id.toString()) {
            senderID = conversation.sellerID;
            receiverID = conversation.buyerID;
        }

        let message = new Message(req.body.content, senderID, receiverID);

        gestorBDConvers.sendMessage(message, req.body.offerID, function (offer) {
            if (offer == null) {
                res.status(500);
                return res.json({error: "Ha ocurrido un error"});
            }
            res.status(200);
            app.get('logger').info(`User ${res.usuario.email} has just sended a message to: ${req.body.receiverID} throught the API`);
            res.json({success: "Updated Successfully", status: 200});
        });
    });

    app.post('/api/message/markAsRead', function (req, res) {
        if (req.body.message == null) {
            res.status(400);
            return res.json({error: "Faltan campos"});
        }

        let message = JSON.parse(req.body.message);

        if (res.usuario._id.toString() !== message.receiverID.toString()) {
            res.status(403);
            return res.json({error: "Este usuario no puede marcar como leido este mensaje, no es su receptor"});
        }

        gestorBDConvers.markAsRead(message, function (msg) {
            if (msg == null) {
                res.status(500);
                return res.json({error: "Ha ocurrido un error"});
            }
            res.status(200);
            app.get('logger').info(`User ${res.usuario.email} has just mark as readad this message: '${message.content}' throught the API`);
            res.json({success: "Operation Completed", status: 200});
        });
    });

    app.get('/api/offer/listConversation/:offerID&:buyerID', function (req, res) {
        let offerID = req.params.offerID;
        let buyerID = req.params.buyerID;

        gestorBDConvers.getConversation(offerID, buyerID, function (conversation) {
            if (conversation == null) {
                res.status(404);
                return res.send();
            }
            res.status(200);
            app.get('logger').info(`User ${res.usuario.email} has requested the conversation throught the API between him and ${req.params.buyerID} about this offer: ${req.params.offerID}`);
            res.json({success: "Getted Successfully", status: 200, conversation: conversation});
        });
    });

    app.get('/api/offer/deleteConversation/:offerID&:buyerID', function (req, res) {
        let offerID = req.params.offerID;
        let buyerID = req.params.buyerID;

        gestorBDConvers.deleteConversation(offerID, buyerID, res.usuario._id.toString(), function (conversation) {
            if (conversation == null) {
                res.status(500);
                return res.send();
            }
            res.status(200);
            app.get('logger').info(`User ${res.usuario.email} has deleted the conversation throught the API between him and ${req.params.buyerID} about this offer: ${req.params.offerID}`);
            res.json({success: "Deleted Successfully", status: 200, conversation: conversation});
        });
    });

    app.get('/api/resetDatabase', function (req, res) {
        let mongo = gestorBDOffers.mongo;
        mongo.MongoClient.connect(app.get('db'), function (err, db) {
            if (err) {
                res.send("ERROR");
            } else {
                let collection = db.collection('ofertas');
                collection.findOne({_id: mongo.ObjectID("5cc5ce18c6b8d80c1c76bde9")}).then(offer => {
                    offer.conversations = null;
                    collection.findOneAndReplace({_id: offer._id}, offer).then(value => res.send("COMPLETADO"),
                        reason => res.send(reason)).finally(db.close());
                }, reason => {
                    res.send(reason);
                    db.close();
                });
            }
        });
    });

};