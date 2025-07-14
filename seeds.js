const mongoose = require("mongoose");
const Event = require("./models/event");

main()
.then(() => {                    
    console.log("mongoDBコネクションok");
})
.catch(err => {
    console.log("mongoDBコネクションエラー");
    console.log(err);
});
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/eventStand');
  }

const seedDB = async () => {
    await Event.deleteMany({});
    
    await Event.insertMany(seedEvents);
};

seedDB().then(() => {
    console.log("データのシードが完了しました！");
    mongoose.connection.close();
});
const seedEvents = [
    {
        title: "東京旅行",
        startDate: "2025-07-01",
        endDate: "2025-08-01"
    },
    {
        title: "大阪旅",
        startDate: "2025-11-01",
        endDate: "2025-12-25"
    },
    {
        title: "沖縄観光",
        startDate: "2026-01-01",
        endDate: "2026-03-23"
    },
    
];

