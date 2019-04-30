module.exports = {
    mongo: null,
    app: null,

    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },

    saveOffer: function (offer, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('ofertas');
                collection.insertOne(offer).then(result => funcionCallback(result.insertedId), err => funcionCallback(err));
            }
            db.close();
        });
    },

    getOffer: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('ofertas');
                collection.findOne(criterio).then(value => funcionCallback(value), reason => funcionCallback(null));
            }
            db.close();
        });
    },

    removeOffer: function (offerID, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('ofertas');
                collection.findOneAndDelete({_id: offerID}).then(value => funcionCallback(value), reason => funcionCallback(null));
            }
            db.close();
        });
    },

    getUserOffers: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                funcionCallback(null);
            else {
                var collection = db.collection('ofertas');
                collection.find({owner: usuario}).toArray((mongoError, offers) => funcionCallback(offers));
            }
            db.close();
        });
    },

    getOffersExceptUserOnes: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                funcionCallback(null);
            else {
                var collection = db.collection('ofertas');
                collection.find({"owner._id": {$ne: usuario._id}}).toArray((mongoError, offers) => funcionCallback(offers));
            }
            db.close();
        });
    },

    getBoughtOffers: function (usuario, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                funcionCallback(null);
            else {
                let collection = db.collection('ofertas');
                collection.find({buyer: usuario._id}).toArray((mongoError, offers) => {
                    funcionCallback(offers);
                    db.close();
                });
            }
        });
    },

    returnOffer: function (offerID, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas', function (err, ofertas) {
                ofertas.findOne({_id: {$eq: offerID}}, function (err, oferta) {
                    if (oferta == null || oferta.buyer == null)
                        funcionCallback(null);
                    else {
                        let replaceOffer = db.collection('ofertas').findOneAndUpdate({_id: {$eq: oferta._id}}, {$set: {buyer: null}});
                        let replaceUser = db.collection('usuarios').findOneAndUpdate({_id: {$eq: t.mongo.ObjectID(oferta.buyer)}},
                            {$inc: {dinero: oferta.value}}, {returnOriginal: false});
                        Promise.all([replaceOffer, replaceUser]).then(values => {

                            let resultadoReplaceOffer = values[0];
                            let resultadoReplaceUsser = values[1];

                            funcionCallback(resultadoReplaceOffer.value);

                        }).catch(reason => {
                            console.log(reason);
                            funcionCallback(null);
                        }).finally(db.close());
                    }
                });
            });
        });
    },

    searchOffersPg: function (criterio, pg, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                funcionCallback(null);
            else {
                let collection = db.collection('ofertas');
                let count = 0;
                collection.find(criterio).count().then(value => count = value);
                collection.find(criterio).skip((pg - 1) * 5).limit(5)
                    .toArray(function (err, canciones) {
                        if (err) {
                            funcionCallback(null);
                        } else {
                            funcionCallback(canciones, count);
                        }
                    });
            }
            db.close();
        });
    },

    buyOffer: function (usuario, idOferta, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                funcionCallback(null);
            else {
                db.collection('ofertas', function (err, ofertas) {
                    ofertas.findOne({_id: idOferta}, function (err, oferta) {
                        if (oferta == null || usuario.dinero < oferta.value || oferta.buyer != null)
                            funcionCallback(null);
                        else {
                            let replaceOffer = db.collection('ofertas').findOneAndUpdate({_id: {$eq: idOferta}}, {$set: {buyer: usuario._id}});
                            let replaceUser = db.collection('usuarios').findOneAndUpdate({_id: {$eq: t.mongo.ObjectID(usuario._id)}},
                                {$set: {dinero: usuario.dinero - oferta.value}}, {returnOriginal: false});
                            Promise.all([replaceOffer, replaceUser]).then(values => {

                                let resultadoReplaceOffer = values[0];
                                let resultadoReplaceUsser = values[1];

                                funcionCallback(resultadoReplaceUsser.value.dinero);

                            }).catch(reason => {
                                console.log(reason);
                                funcionCallback(null);
                            }).finally(db.close());
                        }
                    });
                });
            }
        });
    },


};