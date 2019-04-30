module.exports = class Message {

    constructor(senderID, receiverID, content, date = new Date()) {
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


