export type Category = '映像' | '音'

export type Term = {
  id: string
  name: string
  en: string
  cat: Category
  tile: string
  meaning: string
  example: string
  badExample?: string
  goodExample?: string
}

// 初期実装用の19語スナップショット。
// 公開前に、ユーザーが更新完了を示したGoogleスプレッドシートから再取得する。
export const TERMS: Term[] = [
  {
    id: 'jumpcut',
    name: 'ジャンプカット',
    en: 'JUMP CUT',
    cat: '映像',
    tile: 'assets/tiles/tile-scissors.png',
    meaning:
      '同じカットの途中を切り詰め、映像が少し飛んだように繋ぐカット手法。無言の間や言い直しを詰めてテンポを上げる。',
    example: '「話の間が空いているところは、ジャンプカットで詰めてください」',
    badExample: 'もっとテンポ良くして',
    goodExample: '冒頭5秒はジャンプカットで間（無音）を極限まで詰めてください',
  },
  {
    id: 'insert',
    name: 'インサート',
    en: 'INSERT',
    cat: '映像',
    tile: 'assets/tiles/tile-insert.png',
    meaning:
      'メイン映像の途中に、別のカット（商品アップ・手元・資料など）を差し込むこと。単調さを避け、説明を補強する。',
    example: '「ここで商品パッケージのアップをインサートしてください」',
    badExample: 'ずっと顔が映っていて退屈',
    goodExample:
      '00:05からの解説シーンに、泡立てているインサートを被せてください',
  },
  {
    id: 'colorgrade',
    name: 'カラグレ',
    en: 'COLOR GRADE',
    cat: '映像',
    tile: 'assets/tiles/tile-color.png',
    meaning:
      'カラーグレーディングの略。色味・明るさ・コントラストを調整し、映像全体のトーンを作る仕上げ作業。',
    example: '「全体を少し暖色寄りにカラグレをお願いします」',
    badExample: 'いい感じの綺麗な色にして',
    goodExample:
      '透明感を出したいので、やや青み寄りにカラグレしてください',
  },
  {
    id: 'zabuton',
    name: '座布団',
    en: 'BASE PLATE',
    cat: '映像',
    tile: 'assets/tiles/tile-zabuton.png',
    meaning:
      'テロップの下に敷く帯や背景のこと。背景が騒がしい場面でも文字を読みやすくする。',
    example: '「白文字が背景に溶けているので、座布団を敷いてください」',
    badExample: '文字が背景と同化して見にくい',
    goodExample:
      '白文字の下に、不透明度50%の黒い座布団を敷いてください',
  },
  {
    id: 'edge',
    name: 'エッジ',
    en: 'EDGE',
    cat: '映像',
    tile: 'assets/tiles/tile-edge.png',
    meaning:
      '文字の縁取り。テロップの輪郭に色を付けて、背景から文字を際立たせる。太さと色で印象が変わる。',
    example: '「このテロップに白のエッジを細めに付けてください」',
    badExample: '文字をもっと目立たせて',
    goodExample: 'タイトル文字に白いエッジを細めに付けてください',
  },
  {
    id: 'dropshadow',
    name: 'ドロップシャドウ',
    en: 'DROP SHADOW',
    cat: '映像',
    tile: 'assets/tiles/tile-shadow.png',
    meaning:
      '文字やオブジェクトの後ろに落とす影。立体感を出し、可読性を上げる。濃すぎると野暮ったくなる。',
    example: '「タイトルにドロップシャドウを薄めに入れてください」',
  },
  {
    id: 'timecode',
    name: 'タイムコード',
    en: 'TIMECODE',
    cat: '映像',
    tile: 'assets/tiles/tile-timecode.png',
    meaning:
      '映像上の時間位置を示す数値（例：00:02:15）。修正指示で「どこ」を正確に伝えるための共通の物差し。',
    example: '「00:02:15のカットを、別テイクに差し替えてください」',
    badExample: '動画の真ん中あたりのテロップを直して',
    goodExample: '00:15のテロップを赤色に変更してください',
  },
  {
    id: 'transition',
    name: 'トランジション',
    en: 'TRANSITION',
    cat: '映像',
    tile: 'assets/tiles/tile-transition.png',
    meaning:
      'カットとカットの切り替え効果。ディゾルブ（重ねて溶かす）、ワイプなど。多用すると安っぽくなる。',
    example:
      '「場面転換のところだけ、ディゾルブのトランジションでお願いします」',
    badExample: 'カットの切り替えをカッコよくして',
    goodExample:
      '場面転換（00:08）で、ズームインするトランジションを入れてください',
  },
  {
    id: 'telop',
    name: 'テロップ',
    en: 'TELOP',
    cat: '映像',
    tile: 'assets/tiles/tile-caption.png',
    meaning:
      '画面に載せる文字情報の総称。発言の強調、補足、タイトルなど。フォント・色・座布団とセットで指示する。',
    example: '「ここの発言、テロップで強調してください」',
    badExample: 'フォントを「毛穴ケア」に変えて',
    goodExample:
      'テロップの文言を「毛穴ケア」に変更し、表示タイミングを0.5秒早めてください',
  },
  {
    id: 'kerning',
    name: 'カーニング',
    en: 'KERNING',
    cat: '映像',
    tile: 'assets/tiles/tile-kerning.png',
    meaning:
      '文字と文字の間隔の調整。詰めると引き締まり、空けるとゆったりした印象になる。タイトルで特に効く。',
    example: '「タイトルのカーニングを少し詰めてください」',
    badExample: '文字のデザインがまとまって見えない',
    goodExample:
      'メインキャッチのカーニングを少し詰め、まとまり感を出してください',
  },
  {
    id: 'weight',
    name: 'ウェイト',
    en: 'WEIGHT',
    cat: '映像',
    tile: 'assets/tiles/tile-weight.png',
    meaning:
      'フォントの太さのこと（Light・Regular・Boldなど）。同じフォントでもウェイトで強弱を付けられる。',
    example: '「見出しのウェイトを一段太くしてください」',
    badExample: '大事な単語を目立たせて',
    goodExample:
      '「無料」の文字だけフォントのウェイトをBoldに変更してください',
  },
  {
    id: 'glow',
    name: 'グロー',
    en: 'GLOW',
    cat: '映像',
    tile: 'assets/tiles/tile-glow.png',
    meaning:
      '文字やオブジェクトをふんわり発光させる効果。キーワードの強調や、ネオン風の演出に使う。',
    example: '「決めゼリフのテロップに、軽くグローをかけてください」',
    badExample: '美白感やツヤ感を文字で表現したい',
    goodExample:
      '「透明感」のテロップに薄い青のグローをかけ、ツヤ感を出してください',
  },
  {
    id: 'font',
    name: 'フォント',
    en: 'FONT',
    cat: '映像',
    tile: 'assets/tiles/tile-font.png',
    meaning:
      '書体のこと。ゴシック・明朝などの種類と太さで動画の印象が決まる。案件ごとに指定を統一する。',
    example: '「テロップのフォントは、指定のゴシックに統一してください」',
    badExample: '文字の雰囲気が安っぽい',
    goodExample:
      '親近感を出すため、テロップを手書き風のフォントに変更してください',
  },
  {
    id: 'rough',
    name: '粗編集',
    en: 'ROUGH CUT',
    cat: '映像',
    tile: 'assets/tiles/tile-timeline.png',
    meaning:
      'カット割りだけを終えた仮の編集。テロップや色調整の前に、構成と尺をすり合わせるための状態。',
    example: '「まず粗編集で一度、構成の確認をさせてください」',
    badExample: '最初から完璧に作り込んで見せて',
    goodExample:
      '構成とテンポを確認したいので、テロップなしの粗編集で一度見せてください',
  },
  {
    id: 'tonemana',
    name: 'トンマナ',
    en: 'TONE & MANNER',
    cat: '映像',
    tile: 'assets/tiles/tile-tonmana.png',
    meaning:
      'トーン＆マナーの略。色・フォント・演出の一貫した雰囲気のルール。シリーズものでは揃えるのが前提。',
    example: '「前回の動画とトンマナを合わせてください」',
    badExample: 'なんか、うちの商品っぽくない',
    goodExample:
      'ブランドのトンマナに合わせ、テロップをピンクと明朝体で統一してください',
  },
  {
    id: 'ducking',
    name: 'ダッキング',
    en: 'DUCKING',
    cat: '音',
    tile: 'assets/tiles/tile-waveform.png',
    meaning:
      'ナレーションやセリフの間だけ、BGMの音量を自動的に下げる処理。声を聞き取りやすくする。',
    example: '「ナレーション部分はBGMをダッキングしてください」',
    badExample: '声がBGMにかき消されて聞こえない',
    goodExample:
      'セリフが入る箇所にダッキングをかけ、BGMの音量を下げてください',
  },
  {
    id: 'se',
    name: 'SE（効果音）',
    en: 'SOUND EFFECT',
    cat: '音',
    tile: 'assets/tiles/tile-se.png',
    meaning:
      'Sound Effectの略。テロップ出しや場面転換に合わせて入れる効果音。入れすぎると騒がしくなる。',
    example: '「テロップの出現に合わせてSEを入れてください」',
  },
  {
    id: 'ma',
    name: 'MA（整音）',
    en: 'MIXING',
    cat: '音',
    tile: 'assets/tiles/tile-ma.png',
    meaning:
      '音の仕上げ工程の総称。声量を揃える、ノイズを取る、BGM・SEのバランスを取るなど。',
    example: '「声の大きさがばらついているので、MAで揃えてください」',
  },
  {
    id: 'normalize',
    name: 'ノーマライズ',
    en: 'NORMALIZE',
    cat: '音',
    tile: 'assets/tiles/tile-normalize.png',
    meaning:
      '音量を規定のレベルまで自動で揃える処理。動画ごとの音量差をなくし、視聴環境で聞きやすくする。',
    example: '「書き出し前に音声をノーマライズしてください」',
  },
]
