# Maria — Visual Consistency Reference

このファイルは `assets/characters/maria/reference/*.png`(ユーザー提供のAI生成参照画像4枚)を基に、
すべての画像・動画生成プロンプトで**固定すべき見た目のパラメータ**を言語化したものです。
Phase2以降のプロンプト自動生成は、必ずこのシートの記述をベースプロンプトに含めてください。

## 参照画像
- `reference/ref-01.png` — ビーチ、黄色のトライアングルビキニ、正面セルフィー構図
- `reference/ref-02.png` — ビーチ、麦わら帽子、ミントグリーンのビキニ、ネックレス
- `reference/ref-03.png` — ヤシの木の下、赤のビキニ、横顔〜正面
- `reference/ref-04.png` — ヤシの木の下、赤のビキニ(セットアップ)、全身に近い構図

## 固定ビジュアルパラメータ

| 項目 | 内容 |
|---|---|
| 髪 | 長い黒髪〜ダークブラウン、ストレート〜ゆるいウェーブ、センター分け、艶のある質感 |
| 目 | ダークブラウンの瞳、アーモンドアイ、自然なメイク(ナチュラルなアイライン) |
| 眉 | 自然な太さの整った黒眉 |
| 肌 | オリーブ〜タンスキン、健康的な小麦色、均一なトーン、うっすら光沢感(汗ではなく健康的なツヤ) |
| 顔立ち | 卵型の輪郭、笑うと見える八重歯のない自然な白い歯、笑顔がデフォルト表情 |
| 体型 | スレンダーアスレチック、腹筋がうっすら見える引き締まったウエスト、筋トレ女子らしい健康的なライン |
| 身長・体重の目安 | 165cm前後 / 52kg前後(スレンダー・アスレチック体型と一致させる) |
| アクセサリー | 華奢なゴールドのネックレス・小さめのピアス(控えめ) |
| 表情のデフォルト | 自然な笑顔、目が笑っている、親しみやすい雰囲気 |
| 撮影スタイル | 自然光、屋外が多い、セルフィー構図または三脚構図、色調は明るく彩度高め(SNS映え) |

## プロンプトテンプレートでの固定記述(英語版・そのままベースプロンプトに挿入)

```
a young woman, mixed Japanese-Brazilian ethnicity, early 20s, long dark brown straight-to-wavy hair
center-parted, warm olive tan skin, dark brown almond-shaped eyes, natural full brows, athletic slender
toned physique with a defined waist, genuine warm smile showing teeth, delicate gold necklace and small
earrings, consistent facial identity across all images
```

## 撮影シチュエーション追加(学生生活)
留学生としてのリアリティを出すため、`ROOM_SELFIE`(寮/学生アパートでの自撮り)と`LIBRARY_STUDY`(図書館での勉強シーン)をジャンルに追加。屋外のビーチ/ジム系コンテンツと、室内の等身大な学生生活コンテンツを織り交ぜることで、フォロワーとの共感ポイント(学費を自分で払っている苦労など)を可視化する。

## 禁止事項(キャラクター崩壊防止)
- 髪色・髪型を画像ごとに変えない(暗色ロングヘア固定)
- 体型を極端に変えない(過度な筋肉質化・過度な痩身化はNG)
- 顔の骨格を変えるようなアングル・レンズ歪みは避ける
- 実在の有名人に似せるような追加指示はしない
