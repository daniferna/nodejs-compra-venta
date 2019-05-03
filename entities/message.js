module.exports = class Message {

    constructor(content, senderID, receiverID, date = new Date()) {
        this.senderID = senderID;
        this.receiverID = receiverID;
        this.content = content;
        this.setDate(date);
        this.readed = false;
    }

    setDate(date) {
        if (date != null && date != "")
            this.date = date;
        else
            this.date = new Date();
    }

};


