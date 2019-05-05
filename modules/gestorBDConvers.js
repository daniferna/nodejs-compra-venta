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
                    console.log(oferta);
                    console.log(message);
                    if (oferta.owner._id.toString() === message.senderID.toString())
                        oferta.conversations.find(conversation =>
                            conversation.sellerID.toString() === message.senderID.toString() &&
                            conversation.buyerID.toString() === message.receiverID.toString())
                            .messages.push(message);
                    else
                        oferta.conversations.find(conversation =>
                            conversation.buyerID.toString() === message.senderID.toString() &&
                            conversation.sellerID.toString() === message.receiverID.toString())
                            .messages.push(message);
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
                let needUpdateOffer = false;
                if (err || offer == null) {
                    funcionCallback(null);
                    return db.close();
                } else if (offer.conversations == null || offer.conversations.length <= 0) {
                    offer.conversations = [];
                    offer.conversations.push(new Conversation(buyerID, offer.owner._id.toString()));
                    needUpdateOffer = true;
                }
                let converFound = offer.conversations.find(conv => conv.buyerID.toString() === buyerID.toString());
                if (converFound == null) {
                    converFound = new Conversation(buyerID, offer.owner._id.toString());
                    offer.conversations.push(converFound);
                    needUpdateOffer = true;
                }
                if (needUpdateOffer)
                    db.collection('ofertas').replaceOne({_id: offer._id}, offer);
                db.close();
                if (converFound)
                    return funcionCallback(converFound);
                else
                    return funcionCallback(null);
            });
        });
    },

    deleteConversation: function (offerID, buyerID, sellerID, funcionCallback) {
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
                // Control de permisos
                if (converFound.senderID !== buyerID && converFound.senderID !== sellerID && converFound.buyerID !== buyerID && converFound.buyerID !== sellerID) {
                    db.close();
                    return funcionCallback(null);
                }
                offer.conversations.splice(offer.conversations.indexOf(converFound), 1);
                db.collection('ofertas').findOneAndReplace({_id: t.mongo.ObjectID(offerID)}, offer)
                    .then(value => funcionCallback(value), reason => funcionCallback(null))
                    .finally(db.close());
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

    markAsRead: function (message, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err)
                return funcionCallback(null);
            db.collection('ofertas').findOne({
                "conversations.messages.content": message.content,
                "conversations.messages.senderID": message.senderID,
                "conversations.messages.receiverID": message.receiverID
            })
                .then(offer => {
                    console.log(offer);
                    offer.conversations.find(c => c.messages.find(m => {
                        if (m.content === message.content && m.senderID === message.senderID && m.receiverID === message.receiverID) {
                            m.readed = true;
                            return true;
                        }
                    }));
                    db.collection('ofertas').replaceOne({_id: offer._id}, offer)
                        .then(value => funcionCallback(value), reason => funcionCallback(null))
                        .finally(db.close());
                }, reason => {
                    funcionCallback(null);
                    db.close()
                });
        });
    },

};