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
                        collection.insertOne(user).then(result => funcionCallback(result.insertedId), err => funcionCallback(null));
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
    }
    ,

}
;