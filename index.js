const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const morgan = require("morgan");


const Event = require("./models/event")

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

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(morgan("tiny"));
app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
});


app.get("/events", async (req, res) => {
    const events = await Event.find({});
    res.render("events/index", { events });
});

app.get("/events/:id", async (req, res) => {
    const event = await Event.findById(req.params.id);
    res.render("events/show", { event });
});

app.post("/events" , async (req, res) => {
    const event = new Event(req.body.event);
    await event.save();
    res.redirect(`/events/${event._id}`);
});

app.put("/events/:id", async (req, res) => {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(id, {...req.body.event});
    res.redirect(`/events/${event._id}`);
});

app.delete("/events/:id", async(req, res) => {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    res.redirect(`/events`);
})



app.listen(3000, () => {
    console.log("ポート3000でリクエスト待受中...");
})