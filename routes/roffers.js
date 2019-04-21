var Offer = require('../entities/offer');
var User = require('../entities/user');

module.exports = function (app, swig, gestorBDOffers) {

    app.get('/offer/add', function (req, res) {
       res.render('offer/add');
    });

    app.post('offer/add', function (req, res) {
        if (req.session.usuario == null) {
            res.send("ERROR 500");
            return;
        }

       var offer = new Offer(req.session.usuario, req.body.title, req.body.details, req.body.value);

        gestorBDOffers.saveOffer(offer, function (offerID) {
            if (offerID == null)
                res.render('offer/add', {error: "Ha ocurrido un error al registrar la oferta"});
            else if (typeof offerID === 'string')
                res.render('offer/add', {error: offerID});
            else {
                console.log(offerID);
                res.redirect('offer/list');
            }
        });

    });

};