module.exports = class Conversation {

    constructor(senderID, startDate = new Date()) {
        this.senderID = senderID;
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


