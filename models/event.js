const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { nanoid } = require('nanoid');


const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    eventCode: {
        type: String,
        unipue: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: "User"
            },
            availableDates: [Date]
        }
    ]
});

eventSchema.pre('save', function(next) {
    if (this.isNew && !this.eventCode) {
      this.eventCode = nanoid(8); 
    }
    next(); 
  });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;