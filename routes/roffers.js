var Offer = require('../entities/offer');
var User = require('../entities/user');
var Cookies = require('../public/javascripts/cookie');

module.exports = function (app, swig, gestorBDOffers, gestorBDConvers) {

    app.get('/', function (req, res) {
        if (req.session.usuario == null)
            return res.redirect('/login');
        gestorBDOffers.getUserOffers(req.session.usuario, function (ofertas) {
            if (ofertas == null)
                return res.render('home', {error: "Ha habido un error al obtener las ofertas del usuario"});
            res.render('home', {offers: ofertas});
        });
    });

    app.get('/offer/list', function (req, res) {
        if (req.session.usuario == null)
            return res.redirect('/login');

        let criterio = {owner: {$ne: req.session.usuario}};
        if (req.query.busqueda != null)
            criterio = {
                title: {$regex: ".*" + req.query.busqueda + ".*", $options: 'i'},
                owner: {$ne: req.session.usuario}
            };

        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) // Puede no venir el param
            pg = 1;

        gestorBDOffers.searchOffersPg(criterio, pg, function (ofertas, totalPaginas) {
            if (ofertas == null)
                return res.render('offer/list', {error: "Ha ocurrido un error"});

            let ultimaPg = totalPaginas / 5;
            if (totalPaginas % 5 > 0) { // Sobran decimales
                ultimaPg = Math.trunc(ultimaPg + 1);
            }

            let paginas = []; // paginas mostrar
            for (let i = pg - 5; i <= pg + 5; i++) {
                if (i > 0 && i <= ultimaPg) {
                    paginas.push(i);
                }
            }
            res.render('offer/list', {offers: ofertas, paginas: paginas, actual: pg, ultimaPg: ultimaPg});
        });
    });

    app.get('/offer/bought', function (req, res) {
        if (req.session.usuario == null)
            return res.redirect('/login');

        gestorBDOffers.getBoughtOffers(req.session.usuario, function (ofertas) {
            if (ofertas == null)
                return res.render('offer/bought', {error: "Ha ocurrido un error"});
            res.render('offer/bought', {offers: ofertas});
        });
    });

    app.get('/offer/buy/:id', function (req, res) {
        let idOffer = gestorBDOffers.mongo.ObjectID(req.params.id);
        gestorBDOffers.buyOffer(req.session.usuario, idOffer, function (dinero) {
            if (dinero == null)
                return res.render('home', {error: "Ha ocurrido un error al intentar comprar la oferta"});
            if (typeof dinero == 'string')
                return res.render('home', {error: dinero});
            req.session.usuario.dinero = dinero;
            app.get('logger').info(`User ${req.session.usuario.email} has just bought this offer: ${idOffer.toString()}`);
            res.redirect('/offer/list');
        });
    });

    app.get('/offer/add', function (req, res) {
        res.render('offer/add');
    });

    app.post('/offer/add', function (req, res) {
        if (req.session.usuario == null)
            return res.render('offer/add', {error: "Su sesión ha caducado, vuelva a iniciar sesión"});

        if (req.body.value < 0)
            return res.render('offer/add', {error: "El precio de la oferta no puede ser negativo"});

        if (req.body.date != null && new Date(req.body.date) < Date.now())
            return res.render('offer/add', {error: "La fecha no puede ser anterior al día de hoy"});

        var offer = new Offer(req.session.usuario, req.body.title, req.body.details, req.body.value, req.body.date);

        gestorBDOffers.saveOffer(offer, function (offerID) {
            if (offerID == null)
                res.render('offer/add', {error: "Ha ocurrido un error al registrar la oferta"});
            else if (typeof offerID === 'string')
                res.render('offer/add', {error: offerID});
            else {
                app.get('logger').info(`User ${req.session.usuario.email} has added this offer: ${offerID.toString()}`);
                res.redirect('/');
            }
        });

    });

    app.get('/offer/delete/:id', function (req, res) {
        let id = gestorBDOffers.mongo.ObjectID(req.params.id);
        gestorBDOffers.removeOffer(id, function (removedOffer) {
            if (removedOffer == null)
                return res.render("home", {error: "Ha ocurrido un error al intentar borrar la oferta."});
            app.get('logger').info(`User ${req.session.usuario.email} has deleted this offer: ${id.toString()}`);
            res.redirect('/');
        })
    });

    app.get('/offer/return/:id', function (req, res) {
        let idOffer = gestorBDOffers.mongo.ObjectID(req.params.id);
        gestorBDOffers.returnOffer(idOffer, function (returnedOffer) {
            if (returnedOffer == null)
                return res.render('home', {error: "Ha habido un error al devolver la oferta."});
            req.session.usuario.dinero += returnedOffer.value;
            app.get('logger').info(`User ${req.session.usuario.email} has returned this offer: ${idOffer.toString()}`);
            res.redirect('/offer/bought');
        });
    });

    /*
    *   CHAT Y CONVERSACIONES
    * */

    function getTokenREST(rest, req, funcionCallack) {
        let token = "";
        let configuracion = {
            url: "http://localhost:8081/api/login",
            method: "post",
            form: {
                email: req.session.usuario.email,
                seguro: req.session.usuario.password
            },
            dataType: 'json'
        };
        rest(configuracion, function (error, response, body) {
            let objetoRespuesta = JSON.parse(body);
            token = objetoRespuesta.token;
            funcionCallack(token);
        });
    }

    function getConversationREST(rest, token, offerID, buyerID, funcionCallback) {
        let configuracion = {
            url: "http://localhost:8081/api/offer/listConversation/" + offerID + "&" + buyerID,
            method: "get",
            headers: {
                'token': token,
            },
            dataType: 'json'
        };
        rest(configuracion, function (error, response, body) {
            if (error || response.statusCode === 404)
                return funcionCallback({});
            let objetoRespuesta = JSON.parse(body).conversation;
            funcionCallback(objetoRespuesta);
        });
    }

    function deleteConversationREST(rest, token, offerID, buyerID, funcionCallback) {
        let configuracion = {
            url: "http://localhost:8081/api/offer/deleteConversation/" + offerID + "&" + buyerID,
            method: "get",
            headers: {
                'token': token,
            },
            dataType: 'json'
        };
        rest(configuracion, function (error, response, body) {
            if (error || response.statusCode === 500)
                return funcionCallback({});
            let objetoRespuesta = JSON.parse(body).conversation;
            funcionCallback(objetoRespuesta);
        });
    }

    app.get('/offer/chat/:offerID&:buyerID', function (req, res) {
        let rest = app.get("rest");
        let buyerID = req.params.buyerID;
        let offerID = req.params.offerID;

        gestorBDOffers.getOffer({_id: gestorBDOffers.mongo.ObjectID(offerID)}, function (oferta) {
            if (oferta == null)
                return res.render('conversation', {error: "Ha ocurrido un error."});

            getTokenREST(rest, req, function (token) {
                getConversationREST(rest, token, offerID, buyerID, function (conversation) {
                    res.render('conversation', {
                        offer: oferta,
                        messages: conversation.messages,
                        conversation: conversation,
                        token: token,
                        buyerID: buyerID
                    });
                });
            });
        });
    });

    app.get('/offer/chat/delete/:offerID&:buyerID', function (req, res) {
        let rest = app.get("rest");
        let buyerID = req.params.buyerID;
        let offerID = req.params.offerID;

        gestorBDOffers.getOffer({_id: gestorBDOffers.mongo.ObjectID(offerID)}, function (oferta) {
            if (oferta == null)
                return res.render('conversation', {error: "Ha ocurrido un error."});

            getTokenREST(rest, req, function (token) {
                deleteConversationREST(rest, token, offerID, buyerID, function (conversation) {
                    res.redirect('/offer/conversations/' + offerID);
                });
            });
        });
    });

    app.get('/offer/conversations/:offerID', function (req, res) {
        gestorBDConvers.getOfferConversations(gestorBDOffers.mongo.ObjectID(req.params.offerID), function (offer, usersEmails) {
            if (offer == null)
                return res.render('offer/listConversations', {error: "Ha habido un error al cargar las conversaciones de esta oferta"});
            for (i = 0; i < offer.conversations.length; i++) {
                offer.conversations[i].userEmail = usersEmails[i];
            }
            res.render('offer/listConversations', {
                conversations: offer.conversations,
                offer: offer,
            });
        });
    });

    // app.get('/offer/chat/part/:offerID&:buyerID', function (req, res) {
    //     let rest = app.get("rest");
    //     let buyerID = req.params.buyerID;
    //     let offerID = req.params.offerID;
    //
    //     gestorBDOffers.getOffer({_id: gestorBDOffers.mongo.ObjectID(offerID)}, function (oferta) {
    //         if (oferta == null)
    //             return res.render('conversation', {error: "Ha ocurrido un error."});
    //
    //         getTokenREST(rest, req, function (token) {
    //             getConversationREST(rest, token, offerID, buyerID, function (conversation) {
    //                 res.status(200);
    //                 res.render('conversationPart', {offer: oferta, messages: conversation.messages, token: token, buyerID: buyerID});
    //             });
    //         });
    //     });
    //
    // });

};