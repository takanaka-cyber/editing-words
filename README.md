# EDITING WORDS

動画編集者と共通言語で話すための、編集用語学習Webアプリです。

## 現在の実装

- React 18 + Vite + TypeScript
- 用語一覧、カテゴリ、検索
- 用語詳細、前後移動
- ブックマーク、閲覧進捗のローカル保存
- 4形式を混ぜた5問の選択式クイズ
  - 依頼例から用語を選ぶ
  - 意味から用語を選ぶ
  - 用語から意味を選ぶ
  - 曖昧な依頼を具体的な依頼へ直す
- PC / SPレスポンシブ
- `prefers-reduced-motion`対応

## コンテンツの扱い

見た目は支給されたPC/SPプロトタイプ、挙動は実装指示書、用語本文は次のGoogleスプレッドシートを正本とします。

<https://docs.google.com/spreadsheets/d/11nx6T1PglvvA1SsnDMjfYnaWjC90mkz81wwqUZJIPfo/edit?gid=0#gid=0>

`src/data/terms.ts` は仮共有版の19語スナップショットです。スプレッドシートの更新完了後、read-onlyで再取得して差し替えます。実行時のSheets接続は行いません。

## ローカル起動

```bash
npm install
npm run dev
```

## 検証

```bash
npm run check
```

クイズ生成と主要画面操作の自動テスト、TypeScript、本番ビルドをまとめて実行します。

## 公開

`main` ブランチへのpush時に、GitHub Actionsがテストとproduction buildを実行し、GitHub Pagesへ反映します。
