module.exports = class Offer {

    constructor(owner, title, details, value, date = new Date(), buyer = null) {
        this.owner = owner;
        this.title = title;
        this.details = details;
        this.value = parseFloat(value);
        this.setDate(date);
        this.buyer = buyer;
    }

    setDate(date) {
        if (date != null && date != "")
            this.date = date;
        else
            this.date = new Date();
    }

};


