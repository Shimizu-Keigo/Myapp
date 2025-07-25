const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const User = require('../models/user');
const {isLoggedIn} = require("../middleware");

router.get("/", isLoggedIn, async (req, res) => {  //イベントの作成、一覧の表示ページ
    const user = await User.findById(req.user._id).populate('events'); //各ユーザーに保存されているイベント
    console.log("EJSに渡されるデータ:", JSON.stringify(user.events, null, 2));
    res.render("events/index", { events: user.events }); 
});

router.get("/:id", isLoggedIn,  async (req, res) => {  //イベントの詳細ページ
    const event = await Event.findById(req.params.id).populate({
        path: 'members',
        populate: {
            path: 'name', // members配列の中の "name" フィールドを対象にする
            model: 'User'  // Userモデルから情報を取得
        }
    });
    // 全員の可能日を見つける
    const totalMembers = event.members.length;
    const availabilityCounts = {};
    event.members.forEach((member) => {
        member.availableDates.forEach(date => {
            const dateStr = date.toISOString().split("T")[0];
            availabilityCounts[dateStr] = (availabilityCounts[dateStr] || 0) + 1;
        });
    });
    const perfectMatchDays = [];
    const semiMatchDays = [];
    for (const dateStr in availabilityCounts) {
        const count = availabilityCounts[dateStr];

        if (count === totalMembers && totalMembers > 0) {
            perfectMatchDays.push(new Date(dateStr));
        } else if (count === totalMembers - 1 && totalMembers > 0) {
            semiMatchDays.push(new Date(dateStr));
        }
    }
  
    res.render("events/show", { event, perfectMatchDays, semiMatchDays });
});

router.post("/", isLoggedIn, async (req, res) => { //新しいイベントの追加
    const event = new Event(req.body);
    event.author = req.user._id;
    const userId = req.user._id;
    event.members.push({
        name: req.user._id,
        availableDates: [] 
    });
    await event.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { events: event._id } });
    req.flash("success", "新しいイベントを追加しました。")
    res.redirect(`/events/${event._id}`);//作成したイベントの詳細ページに飛ぶ
});

router.post('/join', async (req, res) => {  //イベントへの参加
    try {
        const { eventCode } = req.body;
        const currentUser = req.user;

        if (!currentUser) {
            req.flash('error', 'イベントに参加するにはログインしてください。');
            return res.status(401).redirect('/login');
        }

        const event = await Event.findOne({ eventCode: eventCode });

        if (!event) {
            req.flash('error', 'そのコードのイベントは見つかりませんでした。');
            return res.status(404).redirect('/events'); // イベント一覧ページなどに戻す
        }

        //  ユーザーが既にそのイベントに参加済みかチェック
        const isAlreadyParticipant = event.members.some(p => p.name.equals(currentUser._id));
        if (isAlreadyParticipant) {
            req.flash('info', 'あなたは既にこのイベントに参加しています。');
            return res.redirect(`/events/${event._id}`);
        }

        //  イベントに参加させる処理
        //    - Eventモデルのmembers配列にユーザーを追加
        event.members.push({ name: currentUser._id, availableDates: [] });
        //    - Userモデルのevents配列にイベントIDを追加
        currentUser.events.push(event._id);

        //  両方のモデルの変更をデータベースに保存
        await event.save();
        await currentUser.save();

        //  参加したイベントの詳細ページにリダイレクト
        req.flash('success', `${event.title}に参加しました！`);
        res.redirect(`/events/${event._id}`);

    } catch (e) {
        console.error(e);
        req.flash('error', 'エラーが発生しました。');
        res.redirect('/events');
    }
});



router.get("/:id/selectDate", isLoggedIn,  async (req, res) => {//可能日の設定の画面
    const event = await Event.findById(req.params.id)
    res.render("events/selectDate", { event });
});

router.patch("/:id", isLoggedIn, async (req, res) => { //可能日の設定
    const { id } = req.params;
    const { name, availableDates } = req.body;
    const userId = req.user._id; 

    const event = await Event.findById(id);
    const existingMember = event.members.find(member =>
        member.name.equals(userId)
    );
    if (existingMember) {
        // 既存のユーザーなら availableDates を更新
        existingMember.availableDates = Array.isArray(availableDates) ? availableDates : [availableDates];
    } else {
        req.flash("error", "あなたはこのイベントのメンバーではありません。");
    }
    await event.save(); 
    res.redirect(`/events/${id}`);
});

router.delete("/:id", isLoggedIn,  async (req, res) => {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    res.redirect(`/events`);
});


module.exports = router;