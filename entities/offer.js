module.exports = class Offer {

    constructor(owner, title, details, value, date = new Date(), buyer = null) {
        this.owner = owner;
        this.title = title;
        this.details = details;
        this.value = value;
        this.date = date;
        this.buyer = buyer;
    }

};


