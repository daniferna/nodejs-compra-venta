module.exports = {
    mongo: null,
    app: null,

    init: function (app, mongo) {
        this.mongo = mongo;
        this.app = app;
    },

    saveUser: function (user, funcionCallback) {
        var t = this;
        this.getUser({email: user.email}, function (usuarioExistente) {
            if (usuarioExistente != null) //Ya existe
                funcionCallback("Ya existe un usuario con el E-Mail introducido");
            else {
                t.mongo.MongoClient.connect(t.app.get('db'), function (err, db) {
                    if (err) {
                        funcionCallback(null);
                    } else {
                        var collection = db.collection('usuarios');
                        collection.insertOne(user).then(result => funcionCallback(result.insertedId), err => funcionCallback(err));
                    }
                    db.close();
                });
            }
        });
    },

    getUser: function (criterio, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.findOne(criterio).then(value => funcionCallback(value), reason => funcionCallback(null));
            }
            db.close();
        });
    },

    modifyUser: function(newUser, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.findOneAndReplace({_id: newUser._id}, newUser).then(value => funcionCallback(value), reason => funcionCallback(null));
            }
            db.close();
        });
    },

    removeUser: function(userID, funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
            if (err) {
                funcionCallback(null);
            } else {
                var collection = db.collection('usuarios');
                collection.findOneAndDelete({_id: userID}).then(value => funcionCallback(value), reason => funcionCallback(null));
            }
            db.close();
        });
    },

    getNormalUsers: function (funcionCallback) {
        this.mongo.MongoClient.connect(this.app.get('db'), function (err, db) {
           if (err)
               funcionCallback(null);
           else {
               var collection = db.collection('usuarios');
               collection.find({isAdmin: false}).toArray((mongoError, users) => funcionCallback(users));
           }
        });
    },

}
;