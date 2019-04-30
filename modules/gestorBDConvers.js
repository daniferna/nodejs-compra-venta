var Conversation = require('../entities/conversation');

module.exports = {
    mongo: null,
    app: null,

    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },

    sendMessage: function (message, offerID, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas').findOne({_id: t.mongo.ObjectID(offerID)}, function (err, oferta) {
                if (err || oferta == null) {
                    funcionCallback(null);
                    db.close();
                } else {
                    if (!oferta.conversations) {
                        oferta.conversations = [];
                        oferta.conversations.push(new Conversation(message.senderID))
                    } else if (!oferta.conversations.find(conversation => conversation.senderID.toString() === message.senderID.toString()))
                        oferta.conversations.push(new Conversation(message.senderID));

                    oferta.conversations.find(conversation => conversation.senderID.toString() === message.senderID.toString()).messages.push(message);
                    db.collection('ofertas').findOneAndReplace({_id: oferta._id}, oferta, {returnOriginal: false})
                        .then(value => funcionCallback(value), reason => funcionCallback(null))
                        .finally(db.close());
                }
            });
        });
    },

    getConversation: function (offerID, userID, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas').findOne({_id: offerID}, function (err, offer) {
                if (err || offer == null || offer.conversations == null || offer.conversations.length <= 0) {
                    funcionCallback(null);
                    return db.close();
                }
                let converFound = offer.conversations.find(conv => conv.senderID.toString() === userID.toString());
                db.close();
                if (converFound)
                    return funcionCallback(converFound);
                else
                    return funcionCallback(null);
            });
        });
    },

};