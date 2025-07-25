const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    events: [{
        type: Schema.Types.ObjectId,
        ref: "Event"
    }]
});

userSchema.plugin(passportLocalMongoose, {
    errorMessages: {
        UserExistsError: "そのユーザー名はすでに使われています。",
        MissingPasswordError: 'パスワードが設定されていません',
        AttemptTooSoonError: 'アカウントが現在停止中です。後ほど試してみてください',
        TooManyAttemptsError: 'ログイン失敗が続いたため、アカウントをロックしました',
        NoSaltValueStoredError: '認証ができませんでした',
        IncorrectPasswordError: 'パスワードまたはユーザー名が間違っています',
        IncorrectUsernameError: 'パスワードまたはユーザー名が間違っています',
        MissingUsernameError: 'No username was given',
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
