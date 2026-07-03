# デプロイ手順 (Vercel + Railway)

## 1. GitHubにアップロード

1. https://github.com/new で新規リポジトリ作成
2. 「Repository name」に `ai-influencer` と入力
3. 「Create repository」をクリック
4. 表示される指示に従って、ローカルからpush

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-influencer.git
git push -u origin main
```

## 2. ダッシュボード (Vercel - 無料)

1. https://vercel.com/signup → GitHubでログイン
2. 「Add new」→「Project」
3. 「ai-influencer」を選択
4. **Root Directory**: `dashboard` に変更
5. Environment Variable を追加:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://xxxxx.railway.app
   ```
   (Railway APIのURLに置き換え — Step 3後に設定)
6. 「Deploy」をクリック

完了後、**https://ai-influencer.vercel.app** のようなURLが発行されます。

## 3. バックエンド API (Railway - 無料)

1. https://railway.app/signup → GitHubでログイン
2. 「New Project」→「Deploy from GitHub repo」
3. 「ai-influencer」を選択
4. Railway自動検出 → 「Deploy」をクリック

完了後、自動でAPIが起動し、**https://xxxxx.railway.app** のようなURLが発行されます。

## 4. ダッシュボード環境変数を更新

Vercelダッシュボード → Settings → Environment Variables:
- `NEXT_PUBLIC_API_BASE_URL` に Railway のURL を設定
- Redeploy をクリック

## 5. アクセス確認

ブラウザで https://ai-influencer.vercel.app を開く ✅

---

## 注意

- Railway無料枠:月5ドルまで無料
- SQLiteは一時的なため、データベースを永続化するにはPostgreSQLへの切り替えが必要
- 本運用には`DATABASE_URL=postgresql://...`をRailwayで設定してください
