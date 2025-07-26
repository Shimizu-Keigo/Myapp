# BuildEvent - 予定調整アプリ
予定を立てるときに、メンバーの都合が合う日を簡単に見つけるために開発した、シンプルな予定調整ウェブアプリケーションです。

イベントを作成し、発行された招待コードを友達に共有するだけで、全員の都合が良い日を簡単に見つけることができます。

# デモ
デプロイしたアプリケーションはこちらから触ることができます。

URL: https://thawing-earth-12068-01dda5e03674.herokuapp.com/


# 主な機能
主な機能は以下の通りです。

ユーザー認証機能: Passport.jsを利用した、安全なユーザー登録・ログイン・ログアウト機能。

イベント作成機能: イベント名と候補期間を設定して、新しいイベントを作成できます。

招待コード機能: イベント作成時に、nanoidを利用してユニークな招待コードを自動で発行します。

イベント参加機能: 共有された招待コードを入力することで、誰でもイベントに参加できます。

可能日の登録: 各イベント参加者は、候補期間内で自分の都合の良い日を複数選択・登録できます。

最適な日程の自動算出: 全参加者が登録した可能日を元に、全員の都合が合う日（Perfect Match）と、一人だけが参加できない日（Semi Match）を自動で算出して表示します。

# 使用技術 
このアプリケーションは、以下の技術スタックで構築されています。

フロントエンド: EJS, ejs-mate, Bootstrap 5

バックエンド: Node.js, Express.js

データベース: MongoDB, Mongoose

認証: Passport.js (passport-local, passport-local-mongoose)

デプロイ: Heroku

その他: connect-flash, express-session, connect-mongo, method-override, dotenv

# インストールと実行方法
このプロジェクトをあなたのローカル環境で動かすには、以下の手順に従ってください。

リポジトリをクローンする

git clone https://github.com/kegokego55/Myapp.git

ディレクトリに移動する

cd Myapp

必要なパッケージをインストールする

npm install

.env ファイルを作成する
プロジェクトのルートに.envファイルを作成し、以下の内容を記述してください。MongoDB Atlasの接続URLと、任意の秘密鍵を設定します。

DB_URL=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/
SECRET=thisisnotagoodsecret

アプリケーションを起動する

node index.js

これで、http://localhost:3000でアプリケーションにアクセスできるようになります。
