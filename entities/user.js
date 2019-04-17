module.exports = class User {

    constructor(email, name, lastname, password, dinero = 100, isAdmin = false) {
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
        this.dinero = dinero;
        this.isAdmin = isAdmin;
    }

};


