const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const User = require('../models/user');
const {isLoggedIn} = require("../middleware");
function translateWeatherCode(code) {
    if (code === 0) return '快晴';
    if (code >= 1 && code <= 3) return '晴れ時々曇り';
    if (code >= 45 && code <= 48) return '霧';
    if (code >= 51 && code <= 67) return '雨';
    if (code >= 71 && code <= 77) return '雪';
    if (code >= 80 && code <= 82) return 'にわか雨';
    if (code >= 95 && code <= 99) return '雷雨';
    return '不明';
};

async function getWeatherForDate(lat, lon, dateStr) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&start_date=${dateStr}&end_date=${dateStr}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.daily && data.daily.weathercode) {
            return {
                date: data.daily.time[0],
                weather: translateWeatherCode(data.daily.weathercode[0]),
                maxTemp: data.daily.temperature_2m_max[0],
                minTemp: data.daily.temperature_2m_min[0]
            };
        }
        return null;
    } catch (e) {
        console.error("天気APIエラー:", e);
        return null;
    }
}

router.get("/", isLoggedIn, async (req, res) => {  //イベントの作成、一覧の表示ページ
    const user = await User.findById(req.user._id).populate('events'); //各ユーザーに保存されているイベント
    res.render("events/index", { events: user.events }); 
});

router.get("/:id", isLoggedIn, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate({
            path: 'members',
            populate: { path: 'user', model: 'User' }
        });

        if (!event) {
            req.flash('error', 'イベントが見つかりませんでした。');
            return res.redirect('/events');
        }

        const totalMembers = event.members.length;
        const availabilityCounts = {};
        event.members.forEach(member => {
            member.availableDates.forEach(date => {
                const dateStr = date.toISOString().split("T")[0];
                availabilityCounts[dateStr] = (availabilityCounts[dateStr] || 0) + 1;
            });
        });

        const datesToFetch = [];
        for (const dateStr in availabilityCounts) {
            const count = availabilityCounts[dateStr];
            if (count >= totalMembers - 1 && totalMembers > 0) {
                datesToFetch.push(dateStr);
            }
        }

        let weatherResults = [];
        if (event.place && event.place.lat && datesToFetch.length > 0) {
            const weatherPromises = datesToFetch.map(dateStr =>
                getWeatherForDate(event.place.lat, event.place.lon, dateStr)
            );
            weatherResults = await Promise.all(weatherPromises);
        }

        const weatherDataMap = new Map();
        weatherResults.filter(r => r).forEach(result => {
            weatherDataMap.set(result.date, result);
        });

        // 5. 最終的なリストを作成
        const perfectMatchDays = [];
        const semiMatchDays = [];
        for (const dateStr in availabilityCounts) {
            const count = availabilityCounts[dateStr];
            const weatherData = weatherDataMap.get(dateStr);

            if (weatherData) {
                const dayData = {
                    date: new Date(dateStr),
                    weather: weatherData.weather,
                    maxTemp: weatherData.maxTemp,
                    minTemp: weatherData.minTemp
                };
                if (count === totalMembers) {
                    perfectMatchDays.push(dayData);
                } else if (count === totalMembers - 1) {
                    semiMatchDays.push(dayData);
                }
            }
        }

        res.render("events/show", { event, perfectMatchDays, semiMatchDays });

    } catch (e) {
        console.error("詳細ページエラー:", e);
        req.flash('error', 'ページの表示中にエラーが発生しました。');
        res.redirect('/events');
    }
});

router.post("/", isLoggedIn, async (req, res) => { //新しいイベントの追加
    try {
        const placeName = req.body.place;
        const event = new Event(req.body);

        if(placeName) {
            const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=jsonv2&countrycodes=jp&limit=1`;
            
            const geoResponse = await fetch(geoUrl);
            console.log("APIレスポンスのステータス:", geoResponse.status); // ← ログ追加

            // ステータスがOKでない場合を考慮
            if (!geoResponse.ok) {
                throw new Error(`Nominatim APIがエラーステータスを返しました: ${geoResponse.status}`);
            }

            const geoData = await geoResponse.json();
            if (geoData.length > 0) {
                const location = geoData[0];
                event.place = {
                    placeName: location.display_name,
                    lat: location.lat,
                    lon: location.lon
                };
            } else {
                event.place = { placeName };
            }
        } 

        event.author = req.user._id;
            const userId = req.user._id;
            event.members.push({
                user: req.user._id,
                availableDates: [] 
            });
            await event.save();
            await User.findByIdAndUpdate(userId, { $addToSet: { events: event._id } });
            req.flash("success", "新しいイベントを追加しました。")
            res.redirect(`/events/${event._id}`);//作成したイベントの詳細ページに飛ぶ
    } catch (e) {
        req.flash("error", "イベント作成中にエラーが起きました");
        console.error("イベント作成エラー:", e);
        res.redirect('/events');
    }
   
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
        const isAlreadyParticipant = event.members.some(p => p.user.equals(currentUser._id));
        if (isAlreadyParticipant) {
            req.flash('info', 'あなたは既にこのイベントに参加しています。');
            return res.redirect(`/events/${event._id}`);
        }

        //  イベントに参加させる処理
        event.members.push({ user: currentUser._id, availableDates: [] });
        currentUser.events.push(event._id);
        await event.save();
        await currentUser.save();

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
    const { availableDates } = req.body;
    const userId = req.user._id; 

    const event = await Event.findById(id);
    const existingMember = event.members.find(member =>
        member.user.equals(userId)
    );
    if (existingMember) {
        // 既存のユーザーなら availableDates を更新
        if(availableDates) {
            existingMember.availableDates = Array.isArray(availableDates) ? availableDates : [availableDates];
        } else {
            existingMember.availabileDates = [];
        }
    } else {
        req.flash("error", "あなたはこのイベントのメンバーではありません。");
    }
    await event.save(); 
    res.redirect(`/events/${id}`);
});

router.delete("/:id", isLoggedIn,  async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (event.members && event.members.length > 0) {
        const memberIds = event.members.map(member => member.user);
        await User.updateMany(
            { _id: { $in: memberIds } },
            { $pull: { events: id } }
        );
    }

    await Event.findByIdAndDelete(id);
    req.flash('success', 'イベントを削除しました。');
    res.redirect(`/events`);
});


module.exports = router;