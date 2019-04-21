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

    removeOffer: function(offer, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('ofertas');
                collection.findOneAndDelete({_id : offer._id}).then(value => funcionCallback(value), reason => funcionCallback(null));
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
               collection.find({buyer: usuario._id.toString()}).toArray((mongoError, offers) => funcionCallback(offers));
           }
           db.close();
        });
    },


};