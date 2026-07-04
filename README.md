# ai-influencer

AIインフルエンサー運営システム

## 現在の状態

- TypeScript / Prisma(PostgreSQL) / Express の基盤、設定管理・ロギング・エラーハンドリング
- キャラクター管理(`src/services/characterService.ts` + `/api/characters`)
- 画像/リール/ストーリーのプロンプト・キャプション自動生成(`/api/content/generate-today`)、
  13ジャンル対応(GYM, MORNING_ROUTINE, COFFEE, TENNIS, BEACH, MIRROR_SELFIE, HEALTHY_FOOD,
  TRAVEL, CASUAL_DATE, BEHIND_THE_SCENES, ROOM_SELFIE, LIBRARY_STUDY, MOTIVATION)
- 画像・動画の実生成(`/api/content/generate-assets`) — 下記「画像・動画生成」参照
- 365日コンテンツカレンダー(`/api/calendar`)
- Instagram Graph API連携・Fanvue文案生成・週次分析レポート
- ダッシュボード(Next.js, `dashboard/`)
- テスト基盤 (Vitest, 41テスト)

## セットアップ

```bash
cp .env.example .env
npm install
npx prisma generate --schema=database/schema.prisma
npx prisma migrate dev --schema=database/schema.prisma --name init
npm run dev
```

`http://localhost:4000/health` にアクセスして `{"status":"ok"}` が返れば起動確認は完了です。

## AI開示について(重要)

このシステムが生成するキャラクターは**すべてAI生成**であることを前提に設計されています。
`Character.isAI` は常に `true` で、投稿・DM・UGC納品物には `shared/aiDisclosure.ts` の開示文言を
自動的に付与する設計です。Instagram・Fanvue・UGC案件先いずれについても、プラットフォーム規約や
広告表示に関するガイドライン(例:米国FTCの推奨・保証に関するガイドライン等)を遵守できるよう、
開示の追加・修正を最優先の非機能要件として扱ってください。

## Fanvueリンクについて

`.env` の `FANVUE_PROFILE_URL` にFanvueプロフィールURLを設定すると、Instagramキャプション/バイオの
誘導文言(`GET /api/fanvue/funnel-copy`)に実際のリンクが反映されます。未設定の場合はプレースホルダー
(`https://www.fanvue.com/[set-your-handle]`)のまま出力されるので、後から設定しても既存の生成物には
影響しません(呼び出し時点の値が使われます)。

## 画像・動画生成について

`POST /api/content/generate-today` はプロンプト・キャプションのみを生成します(実際の画像/動画ファイルは
作りません)。実ファイルを生成するには `POST /api/content/generate-assets`(`assetIds` 配列を渡す、
最大20件/リクエスト)を呼び出します。どのプロバイダを使うかは `.env` で切り替えます:

| 用途 | `.env` | 説明 |
|---|---|---|
| 画像(デフォルト) | `IMAGE_GEN_PROVIDER=local-stub` | 課金なし。プレースホルダーSVGを書き出すだけ |
| 画像 | `IMAGE_GEN_PROVIDER=stability` + `IMAGE_GEN_API_KEY` | Stability AI |
| 画像 | `IMAGE_GEN_PROVIDER=nano-banana` + `IMAGE_GEN_API_KEY`(Gemini APIキー) | Google Nano Banana 2 |
| 動画(デフォルト) | `VIDEO_GEN_PROVIDER=local-stub` | 課金なし。作業チケットのJSONを書き出すだけ |
| 動画 | `VIDEO_GEN_PROVIDER=seedance` + `VIDEO_GEN_API_KEY`(Volcengine Arkキー) | ByteDance Seedance 2.0(非同期タスク、生成に数分かかる場合あり) |

生成したファイルは `assets/images/` `assets/videos/` 配下に保存されます(いずれも生成物なので
`.gitignore` 済み)。`POST /api/content/generate-assets` はバッチ内の一部が失敗しても残りの結果を
返します(全成功=201、一部失敗=207、全失敗=502)。

## Instagram APIへの接続について

`src/services/instagramService.ts` はMeta公式のInstagram Graph API(Content Publishing API)を
ラップしています。接続には以下がコード外で必要です:

1. InstagramアカウントをBusiness/Creatorアカウントに変換
2. Meta Developerアプリを作成し、Instagram Graph API製品を追加
3. `instagram_business_basic` + `instagram_business_content_publish` 権限を申請
4. Meta App Review(審査、2〜4週間)を通過
5. 長期アクセストークンを取得し `.env` の `IG_ACCESS_TOKEN` / `IG_BUSINESS_ACCOUNT_ID` に設定

制限: 24時間あたり最大100投稿、投稿メディアは公開URLでホストされている必要あり、DMはこのAPIの対象外
(別のInstagram Messaging APIが必要なため、DM機能は文案生成のみ)。

## 分析・週次レポート

`AnalyticsSnapshot` テーブルに週次の生データを記録し、`buildWeeklyReport()` が前週との比較から
ルールベースで改善提案を生成します(LLM呼び出しなし、決定論的・無料)。

```bash
# 1. 週次データを記録(手動入力。IG/Fanvueの実測値を集計して渡す)
curl -X POST http://localhost:4000/api/analytics/snapshot \
  -H "Content-Type: application/json" \
  -d '{"periodStart":"2026-06-29","periodEnd":"2026-07-05","igReach":12000,"igSaveRate":0.03,"igRetentionRate":0.45,"igFollowerGrowth":85,"fanvueRevenue":420,"fanvueCvr":0.018,"ugcDealCloseRate":0.25}'

# 2. レポート生成(analytics/{periodEnd}/report.md に出力)
npm run analytics:weekly-report
```

`.github/workflows/weekly-analytics.yml` で毎週月曜に自動実行する設定も用意しています(要`DATABASE_URL` secret設定)。

## ダッシュボード(Web UI)

`dashboard/` ディレクトリに Next.js アプリケーションが含まれており、**AI開示ポリシーを最優先に設計**しています。

### セットアップ・実行

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:3000 にアクセス
```

### ダッシュボード主要機能

1. **AI開示バナー(常時表示)**: 「このシステムはAI生成コンテンツを運用しています」という警告を最上部に表示
2. **今日のタスク**: 画像20枚 + リール3本 + ストーリー5本を一括生成。生成時に自動的にAI開示タグが付与される
3. **Instagram投稿前チェックリスト**: 投稿前に「AI開示タグが入っているか?」を確認
4. **Fanvue管理**: Fanvueプロフィール全体にAI開示テキストが必須であることを警告表示
5. **生成状況パイプライン**: PLANNED → PROMPT_GENERATED → SCHEDULED → PUBLISHED の進行状況を可視化
6. **分析ダッシュボード**: 週次レポート・改善提案を表示

### AI開示ポリシーの組み込み

ダッシュボード内の各セクションにはAI開示に関する以下の情報が自動表示されます:

- **キャプション自動タグ**: `#AI #DigitalCharacter`
- **Fanvueプロフィール開示**: 「This profile features an AI-generated persona...」をプロフィール欄に必須記入
- **投稿前チェック**: 各投稿に「AI開示タグ確認済み」の確認が必須

### APIとの連携

ダッシュボードは以下のAPIエンドポイントを呼び出します:
- `GET /api/characters` - キャラクター情報取得
- `POST /api/content/generate-today` - 本日の投稿を一括生成
- `GET /api/prompts/assets` - 生成済みアセット一覧
- `POST /api/instagram/daily-ops` - 投稿をスケジュール状態に更新
- `GET /api/analytics/snapshots` - 週次分析スナップショット表示
