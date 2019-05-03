var Conversation = require('../entities/conversation');

module.exports = {
    mongo: null,
    app: null,

    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },

    sendMessage: function (message, offerID, receiverID, funcionCallback) {
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
                        oferta.conversations.push(new Conversation(message.senderID, oferta.owner._id))
                    } else if (oferta.owner._id.toString() === message.receiverID.toString() && oferta.owner._id.toString() !== message.senderID.toString() &&
                        !oferta.conversations.find(conversation => (conversation.buyerID.toString() === message.senderID.toString())))
                        oferta.conversations.push(new Conversation(message.senderID, oferta.owner._id));
                    if (oferta.owner._id.toString() === message.receiverID.toString())
                        oferta.conversations.find(conversation => conversation.sellerID.toString() === receiverID.toString()).messages.push(message);
                    else
                        oferta.conversations.find(conversation => conversation.buyerID.toString() === receiverID.toString()).messages.push(message);
                    db.collection('ofertas').findOneAndReplace({_id: oferta._id}, oferta, {returnOriginal: false})
                        .then(value => funcionCallback(value), reason => funcionCallback(null))
                        .finally(db.close());
                }
            });
        });
    },

    getConversation: function (offerID, buyerID, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas').findOne({_id: t.mongo.ObjectID(offerID)}, function (err, offer) {
                if (err || offer == null || offer.conversations == null || offer.conversations.length <= 0) {
                    funcionCallback(null);
                    return db.close();
                }
                let converFound = offer.conversations.find(conv => conv.buyerID.toString() === buyerID.toString());
                db.close();
                if (converFound)
                    return funcionCallback(converFound);
                else
                    return funcionCallback(null);
            });
        });
    },

    getUsersEmails: function (conversations, db, funcionCallback) {
        let promesas = [];
        conversations.forEach((conver) => {
            promesas.push(db.collection('usuarios').findOne({_id: this.mongo.ObjectID(conver.buyerID)}));
        });
        Promise.all(promesas).then(users => {
            let emails = [];
            users.forEach(user => emails.push(user.email));
            funcionCallback(emails);
        });
    },

    getOfferConversations: function (offerID, funcionCallback) {
        let t = this;
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas').findOne({_id: offerID}, function (err, offer) {
                if (err || offer == null) {
                    funcionCallback(null);
                    return db.close();
                }
                if (offer.conversations == null || offer.conversations.length <= 0) {
                    funcionCallback("No hay ofertas");
                    return db.close();
                }
                t.getUsersEmails(offer.conversations, db, function (usersEmails) {
                    funcionCallback(offer, usersEmails);
                    db.close();
                });
            });
        });
    },

};