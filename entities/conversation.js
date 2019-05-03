module.exports = class Conversation {

    constructor(buyerID, sellerID, startDate = new Date()) {
        this.buyerID = buyerID;
        this.sellerID = sellerID;
        this.setDate(startDate);
        this.messages = [];
    }

    setDate(date) {
        if (date != null && date != "")
            this.startDate = date;
        else
            this.startDate = new Date();
    }

};


