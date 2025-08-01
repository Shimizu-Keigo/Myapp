# BuildEvent - 予定調整アプリ

予定を立てるときに、メンバーの都合が合う日を簡単に見つけるための、シンプルな予定調整ウェブアプリケーションです。

イベントを作成し、目的地を設定して招待コードを友達に共有するだけで、全員の都合が良い日と、その日の天気を簡単に見つけることができます。

# デモ

デプロイしたアプリケーションはこちらから触ることができます。

**URL**: https://myapp-ewpp.onrender.com

# 主な機能

主な機能は以下の通りです。

* **ユーザー認証機能**: Passport.jsを利用した、ユーザー登録・ログイン・ログアウト機能。
* **イベント作成機能**: イベント名、候補期間、目的地を設定して、新しいイベントを作成できます。
* **目的地の地図表示機能**: 設定した目的地を地図上にピンで表示し、場所を視覚的に確認できます。
* **招待コード機能**: イベント作成時に、nanoidを利用してユニークな招待コードを自動で発行します。
* **イベント参加機能**: 共有された招待コードを入力することで、誰でもイベントに参加できます。
* **可能日の登録**: 各イベント参加者は、候補期間内で自分の都合の良い日を複数選択・登録できます。
* **最適な日程と天気の自動表示**:
    * 全員の都合が合う日（Perfect Match）と、一人だけが参加できない日（Semi Match）を自動で算出します。
    * 算出された候補日が16日以内であれば、その日の**天気予報と最高・最低気温**を自動で表示します。

# 使用技術

このアプリケーションは、以下で構築されています。

* **フロントエンド**: EJS, ejs-mate, Bootstrap 5,
* **バックエンド**: Node.js, Express.js
* **データベース**: MongoDB, Mongoose
* **認証**: Passport.js (passport-local, passport-local-mongoose)
* **外部API**: **MapTiler**, **Open-Meteo API**
* **デプロイ**: Render
* **その他**: connect-flash, express-session, connect-mongo, method-override, dotenv

# インストールと実行方法

このプロジェクトをあなたのローカル環境で動かすには、以下の手順に従ってください。

1.  **リポジトリをクローンする**
    ```bash
    git clone [https://github.com/kegokego55/Myapp.git](https://github.com/kegokego55/Myapp.git)
    ```

2.  **ディレクトリに移動する**
    ```bash
    cd Myapp
    ```

3.  **必要なパッケージをインストールする**
    ```bash
    npm install
    ```

4.  **.env ファイルを作成する**
    プロジェクトのルートに`.env`ファイルを作成し、以下の内容を記述してください。MongoDB Atlasの接続URLと、任意の秘密鍵を設定します。
    ```
    DB_URL=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/
    SECRET=thisisnotagoodsecret
    ```

5.  **アプリケーションを起動する**
    ```bash
    node index.js
    ```
    これで、`http://localhost:3000`でアプリケーションにアクセスできるようになります。
