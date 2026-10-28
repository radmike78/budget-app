/**
 * Japanese: the everyday ways people say the same thing, casual (タメ口) and
 * polite (です・ます), with kanji, kana and digit amounts, each with what the
 * parser must make of it. Categories are passed with their Japanese names, as
 * the app does.
 */
import { ja } from '@/i18n/locales/ja';
import type { Goal } from '@/types';
import { GOALS, parseOne, runCases, type Case } from './harness';

const labels = ja.s.categoryNames as Record<string, string>;

const expenses: Case[] = [
  ['ランチに1200円使った', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['ランチ1200円', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['ランチで1,200円', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['お昼に千二百円', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['昼ごはん代1200円', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['昼飯1200円', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['ランチに1200円払いました', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['¥1,200のランチ', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['1200円のランチを食べた', { type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['お昼代で1000円かかった', { type: 'expense', amount: 1000, categoryId: 'dining' }],
  ['ランチ代千円', { type: 'expense', amount: 1000, categoryId: 'dining' }],
  ['コーヒー500円', { type: 'expense', amount: 500, categoryId: 'dining' }],
  ['コーヒー一杯500円', { type: 'expense', amount: 500, categoryId: 'dining' }],
  ['スタバで650円', { type: 'expense', amount: 650, categoryId: 'dining' }],
  ['カフェ代480円', { type: 'expense', amount: 480, categoryId: 'dining' }],
  ['昨日の夜ごはん3000円', { type: 'expense', amount: 3000, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['晩飯に2000円', { type: 'expense', amount: 2000, categoryId: 'dining' }],
  ['飲み会で5000円', { type: 'expense', amount: 5000, categoryId: 'dining' }],
  ['居酒屋で4000円使っちゃった', { type: 'expense', amount: 4000, categoryId: 'dining' }],
  ['ウーバーイーツで2000円', { type: 'expense', amount: 2000, categoryId: 'dining' }],
  ['出前を頼んで2500円', { type: 'expense', amount: 2500, categoryId: 'dining' }],
  ['後輩にランチ奢って3000円', { type: 'expense', amount: 3000, categoryId: 'dining' }],
  ['ビール3本で900円', { type: 'expense', amount: 900, categoryId: 'dining' }],
  ['いくら丼1500円', { kind: 'transaction', type: 'expense', amount: 1500 }],
  ['スーパーで3000円', { type: 'expense', amount: 3000, categoryId: 'groceries' }],
  ['スーパーで3000円買い物した', { type: 'expense', amount: 3000, categoryId: 'groceries' }],
  ['食料品を3000円分買った', { type: 'expense', amount: 3000, categoryId: 'groceries' }],
  ['野菜と肉で2000円', { type: 'expense', amount: 2000, categoryId: 'groceries' }],
  ['コンビニで500円', { type: 'expense', amount: 500, categoryId: 'groceries' }],
  ['買い出しに5千円', { type: 'expense', amount: 5000, categoryId: 'groceries' }],
  ['コストコで1万2千円', { type: 'expense', amount: 12000, categoryId: 'groceries' }],
  ['ガソリン入れて4000円', { type: 'expense', amount: 4000, categoryId: 'transport' }],
  ['ガソリン代4000円', { type: 'expense', amount: 4000, categoryId: 'transport' }],
  ['給油4000円', { type: 'expense', amount: 4000, categoryId: 'transport' }],
  ['ガソリン満タンにして5000円', { type: 'expense', amount: 5000, categoryId: 'transport' }],
  ['タクシーに2500円', { type: 'expense', amount: 2500, categoryId: 'transport' }],
  ['タクシー代二千五百円', { type: 'expense', amount: 2500, categoryId: 'transport' }],
  ['昨日タクシーで2300円', { type: 'expense', amount: 2300, categoryId: 'transport', occurredAt: '2026-09-15' }],
  ['電車代380円', { type: 'expense', amount: 380, categoryId: 'transport' }],
  ['Suicaに3000円チャージした', { type: 'expense', amount: 3000, categoryId: 'transport' }],
  ['駐車場代800円', { type: 'expense', amount: 800, categoryId: 'transport' }],
  ['新幹線で1万4千円', { type: 'expense', amount: 14000, categoryId: 'transport' }],
  ['航空券2万円', { type: 'expense', amount: 20000, categoryId: 'transport' }],
  ['車の修理に3万円かかった', { type: 'expense', amount: 30000, categoryId: 'transport' }],
  ['電気代が8000円かかった', { type: 'expense', amount: 8000, categoryId: 'utilities' }],
  ['電気代8千円', { type: 'expense', amount: 8000, categoryId: 'utilities' }],
  ['ガス代5000円払った', { type: 'expense', amount: 5000, categoryId: 'utilities' }],
  ['水道代3500円', { type: 'expense', amount: 3500, categoryId: 'utilities' }],
  ['スマホ代6000円', { type: 'expense', amount: 6000, categoryId: 'utilities' }],
  ['携帯代を払った6千円', { type: 'expense', amount: 6000, categoryId: 'utilities' }],
  ['家賃8万円払った', { type: 'expense', amount: 80000, categoryId: 'rent' }],
  ['家賃を払った、8万円', { type: 'expense', amount: 80000, categoryId: 'rent' }],
  ['家賃8万5千円', { type: 'expense', amount: 85000, categoryId: 'rent' }],
  ['病院で3000円', { type: 'expense', amount: 3000, categoryId: 'health' }],
  ['薬局で薬を買った1500円', { type: 'expense', amount: 1500, categoryId: 'health' }],
  ['歯医者3000円', { type: 'expense', amount: 3000, categoryId: 'health' }],
  ['映画を観た1800円', { type: 'expense', amount: 1800, categoryId: 'entertainment' }],
  ['映画のチケット1900円', { type: 'expense', amount: 1900, categoryId: 'entertainment' }],
  ['カラオケで2000円', { type: 'expense', amount: 2000, categoryId: 'entertainment' }],
  ['本を買った1500円', { type: 'expense', amount: 1500, categoryId: 'entertainment' }],
  ['ユニクロで服を買った5000円', { type: 'expense', amount: 5000, categoryId: 'shopping' }],
  ['靴を買いました8000円', { type: 'expense', amount: 8000, categoryId: 'shopping' }],
  ['Amazonで3000円', { type: 'expense', amount: 3000, categoryId: 'shopping' }],
  ['アマゾンで買い物3000円', { type: 'expense', amount: 3000, categoryId: 'shopping' }],
  ['プレゼントに5000円', { type: 'expense', amount: 5000, categoryId: 'shopping' }],
  ['ネットフリックス1490円', { type: 'expense', amount: 1490, categoryId: 'subscriptions' }],
  ['Netflixの月額1490円', { type: 'expense', amount: 1490, categoryId: 'subscriptions' }],
  ['Spotify980円', { type: 'expense', amount: 980, categoryId: 'subscriptions' }],
  ['カードの支払い5万円', { kind: 'transaction', type: 'expense', amount: 50000, categoryId: 'debt' }],
  ['クレカの引き落とし3万円', { kind: 'transaction', type: 'expense', amount: 30000, categoryId: 'debt' }],
  ['ローン返済4万円', { kind: 'transaction', type: 'expense', amount: 40000, categoryId: 'debt' }],
  ['お土産3000円', { type: 'expense', amount: 3000, categoryId: 'other_expense' }],
  ['ホテル代1万2千円', { type: 'expense', amount: 12000, categoryId: 'other_expense' }],
  ['募金に1000円', { type: 'expense', amount: 1000, categoryId: 'other_expense' }],
  ['送料500円', { type: 'expense', amount: 500, categoryId: 'other_expense' }],
  ['1200円払った', { kind: 'transaction', type: 'expense', amount: 1200 }],
  ['1200円使いました', { kind: 'transaction', type: 'expense', amount: 1200 }],
  ['1.5万円使った', { type: 'expense', amount: 15000 }],
  ['ATMで1万円おろした', { type: 'expense', amount: 10000 }],
  ['ランチに使ったお金は1200円', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['食費3000円', { kind: 'transaction', type: 'expense', amount: 3000 }],
  ['今日のランチ', { kind: 'transaction', type: 'expense', amount: null, categoryId: 'dining' }],
];

const income: Case[] = [
  ['給料が入った25万円', { kind: 'transaction', type: 'income', amount: 250000, categoryId: 'salary' }],
  ['給料が25万円入った', { type: 'income', amount: 250000, categoryId: 'salary' }],
  ['給料日で25万円', { type: 'income', amount: 250000, categoryId: 'salary' }],
  ['給料25万', { type: 'income', amount: 250000, categoryId: 'salary' }],
  ['給与振込25万円', { type: 'income', amount: 250000, categoryId: 'salary' }],
  ['今月の給料は25万円でした', { type: 'income', amount: 250000, categoryId: 'salary' }],
  ['ボーナス50万円', { type: 'income', amount: 500000, categoryId: 'salary' }],
  ['ボーナスが出た50万円', { type: 'income', amount: 500000, categoryId: 'salary' }],
  ['手取り22万円', { type: 'income', amount: 220000, categoryId: 'salary' }],
  ['バイト代が入った8万円', { type: 'income', amount: 80000, categoryId: 'salary' }],
  ['3万円もらった', { type: 'income', amount: 30000 }],
  ['母から1万円もらった', { type: 'income', amount: 10000, categoryId: 'gift_income' }],
  ['お小遣い5000円', { type: 'income', amount: 5000, categoryId: 'gift_income' }],
  ['お年玉1万円もらった', { type: 'income', amount: 10000, categoryId: 'gift_income' }],
  ['仕送り5万円', { type: 'income', amount: 50000, categoryId: 'gift_income' }],
  ['メルカリで売れた3000円', { type: 'income', amount: 3000, categoryId: 'freelance' }],
  ['古着を売った5000円', { type: 'income', amount: 5000 }],
  ['副業で5万円稼いだ', { type: 'income', amount: 50000, categoryId: 'freelance' }],
  ['副業の報酬3万円', { type: 'income', amount: 30000, categoryId: 'freelance' }],
  ['チップで3000円もらった', { type: 'income', amount: 3000 }],
  ['Amazonから返金1500円', { type: 'income', amount: 1500, categoryId: 'other_income' }],
  ['返金があった2000円', { type: 'income', amount: 2000, categoryId: 'other_income' }],
  ['払い戻し2000円', { type: 'income', amount: 2000, categoryId: 'other_income' }],
  ['友達から2000円返してもらった', { type: 'income', amount: 2000, categoryId: 'other_income' }],
  ['立て替えた分を返してもらった3000円', { type: 'income', amount: 3000 }],
  ['配当金が入った3000円', { type: 'income', amount: 3000, categoryId: 'other_income' }],
  ['ポイント還元500円', { type: 'income', amount: 500, categoryId: 'other_income' }],
  ['還付金が戻ってきた3万円', { type: 'income', amount: 30000, categoryId: 'other_income' }],
  ['臨時収入1万円', { type: 'income', amount: 10000 }],
  ['10万円振り込まれた', { type: 'income', amount: 100000 }],
  ['年金が入った15万円', { type: 'income', amount: 150000, categoryId: 'other_income' }],
];

const spentQuestions: Case[] = [
  ['今月いくら使った？', { kind: 'question', question: { ask: 'spent', type: 'expense', period: 'month', target: null } }],
  ['今月いくら使いましたか', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月どのくらいお金使った？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月お金いくら使った', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月どんだけ使った', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月いくら使ったっけ', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月いくら使ったか教えて', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今日いくら使った？', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['昨日いくら使った', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: null } }],
  ['先週いくら使った', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: null } }],
  ['今年いくら使った', { kind: 'question', question: { ask: 'spent', period: 'year', target: null } }],
  ['先月の出費はいくら', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', target: null } }],
  ['今月の出費を教えて', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月の支出は？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今週の支出', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['今月の合計はいくら？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今月使ったお金は？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['今週コーヒーにいくら使った？', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'コーヒー', fallbackCategoryId: 'dining' } }],
  ['今月コーヒーにどれくらい使ってる？', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'コーヒー' } }],
  ['スタバにいくら使った', { kind: 'question', question: { ask: 'spent', target: 'スタバ', fallbackCategoryId: 'dining' } }],
  ['今週は外食にいくら使ったかな', { kind: 'question', question: { ask: 'spent', period: 'week', categoryId: 'dining' } }],
  ['外食にいくら使った', { kind: 'question', question: { ask: 'spent', categoryId: 'dining' } }],
  ['食費はいくら？', { kind: 'question', question: { ask: 'spent', categoryIds: ['groceries', 'dining'] } }],
  ['今月の食費はいくら', { kind: 'question', question: { ask: 'spent', period: 'month', categoryIds: ['groceries', 'dining'] } }],
  ['今月の食費', { kind: 'question', question: { ask: 'spent', period: 'month', categoryIds: ['groceries', 'dining'] } }],
  ['交通費はいくらかかった？', { kind: 'question', question: { ask: 'spent', categoryIds: ['transport'] } }],
  ['先月の光熱費はいくらだった？', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryIds: ['utilities'] } }],
  ['今年の医療費はいくら', { kind: 'question', question: { ask: 'spent', period: 'year', categoryIds: ['health'] } }],
  ['今月の家賃はいくら？', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'rent' } }],
  ['タクシー代はいくらかかった？', { kind: 'question', question: { ask: 'spent', target: 'タクシー', fallbackCategoryId: 'transport' } }],
  ['今週タクシーにいくらかかった', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'タクシー' } }],
  ['今月サブスクにいくら払ってる？', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'subscriptions' } }],
  ['今月コンビニでいくら使った', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'コンビニ', fallbackCategoryId: 'groceries' } }],
  ['昨日の飲み会いくらだった？', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: '飲み会' } }],
  ['コーヒー代の合計', { kind: 'question', question: { ask: 'spent', target: 'コーヒー' } }],
  ['今月のガス代', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'ガス', fallbackCategoryId: 'utilities' } }],
  ['コーヒーに使った金額', { kind: 'question', question: { ask: 'spent', target: 'コーヒー' } }],
  ['買い物にいくら使ったの？', { kind: 'question', question: { ask: 'spent', categoryId: 'shopping' } }],
  ['給料日からいくら使った？', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['今回の給料期間でいくら使った', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['前回の給料日からいくら使った', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['給料日以降の出費は？', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['今までに全部でいくら使った', { kind: 'question', question: { ask: 'spent', period: 'all', target: null } }],
];

const leftQuestions: Case[] = [
  ['あといくら使える？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['あといくら使えますか', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算はあといくら', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算あとどれくらい残ってる？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['残りはいくら？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['残りいくら', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月あといくら使っていい？', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['今月あといくら残ってる', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月の予算あとどれくらい', { kind: 'question', question: { ask: 'left', target: null } }],
  ['給料日まであといくら使える？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['給料日まであといくら', { kind: 'question', question: { ask: 'left', target: null } }],
  ['使えるお金はあといくら？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['自由に使えるお金はいくら', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算内に収まってる？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月大丈夫？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月の予算は大丈夫かな', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算オーバーしてない？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['使いすぎてる？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算の状況は？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['予算はどう？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['お金まだある？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['食費はあとどのくらい？', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['食費はあといくら使える？', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['食費の残りは？', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['外食はあといくら使える', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['外食の予算あといくら残ってる？', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['食料品の予算はあといくら', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['外食の予算内に収まってる？', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['娯楽にあといくら使える？', { kind: 'question', question: { ask: 'left', categoryId: 'entertainment' } }],
];

const incomeQuestions: Case[] = [
  ['今月いくら稼いだ？', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['先月いくら稼いだ', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['今年の収入はいくら', { kind: 'question', question: { type: 'income', period: 'year', target: null } }],
  ['今月の収入は？', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['先月の稼ぎは', { kind: 'question', question: { type: 'income', period: 'lastMonth', target: null } }],
  ['今月いくら入ってきた？', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['今週いくらもらった', { kind: 'question', question: { type: 'income', period: 'week' } }],
  ['今月の入金はいくら', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['副業でいくら稼いだ？', { kind: 'question', question: { type: 'income', categoryId: 'freelance' } }],
  ['今月の副業収入はいくら', { kind: 'question', question: { type: 'income', period: 'month', categoryId: 'freelance' } }],
  ['今年ボーナスいくらもらった', { kind: 'question', question: { type: 'income', period: 'year', target: 'ボーナス', fallbackCategoryId: 'salary' } }],
  ['給料はいくら入った？', { kind: 'question', question: { type: 'income', categoryId: 'salary' } }],
  ['今月の給料はいくらだった', { kind: 'question', question: { type: 'income', period: 'month' } }],
];

const goals: Case[] = [
  ['旅行のために3000ドル貯めたい', { kind: 'goal', amount: 3000, goalKind: 'saving', goalName: '旅行' }],
  ['旅行のために30万円貯めたい', { kind: 'goal', amount: 300000, goalName: '旅行' }],
  ['車を買うために100万円貯金したい', { kind: 'goal', amount: 1000000, goalKind: 'saving' }],
  ['来年までに50万円貯めたい', { kind: 'goal', amount: 500000 }],
  ['貯金目標は100万円', { kind: 'goal', amount: 1000000 }],
  ['目標：沖縄旅行に20万円', { kind: 'goal', amount: 200000 }],
  ['新しい目標、旅行資金10万円', { kind: 'goal', amount: 100000 }],
  ['結婚資金として200万円貯めたい', { kind: 'goal', amount: 2000000, goalName: '結婚資金' }],
  ['30万円貯めたいです', { kind: 'goal', amount: 300000 }],
  ['引っ越し費用に20万円貯めたい', { kind: 'goal', amount: 200000, goalName: '引っ越し費用' }],
  ['12月までにパソコン用に15万円貯金したい', { kind: 'goal', amount: 150000, goalName: 'パソコン' }],
  ['緊急資金を50万円貯めることにした', { kind: 'goal', amount: 500000 }],
  ['夏までに10万円貯めよう', { kind: 'goal', amount: 100000 }],
  ['カードの20万円を返したい', { kind: 'goal', amount: 200000, goalKind: 'debt' }],
  ['ローンを完済したい', { kind: 'goal', goalKind: 'debt' }],
  ['奨学金を返済したい、残り200万円', { kind: 'goal', amount: 2000000, goalKind: 'debt' }],
  ['借金50万円を来年までに返す', { kind: 'goal', amount: 500000, goalKind: 'debt' }],
  ['リボ払いの30万円をなくしたい', { kind: 'goal', amount: 300000, goalKind: 'debt' }],
  ['クレカの残高10万円を3ヶ月で返済したい', { kind: 'goal', amount: 100000, goalKind: 'debt' }],
  ['車のローン120万円を返したい', { kind: 'goal', amount: 1200000, goalKind: 'debt' }],
  ['クレジットカードの借金30万円を完済したい', { kind: 'goal', amount: 300000, goalKind: 'debt' }],
];

const reminders: Case[] = [
  ['家賃を払うのをリマインドして', { kind: 'reminder' }],
  ['明日家賃を払うことを思い出させて', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['1日に家賃を払うように教えて', { kind: 'reminder', occurredAt: '2026-10-01' }],
  ['毎月1日に家賃のリマインド', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['忘れないように明日カード代払う', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['金曜日に電気代払うの忘れないようにして', { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['明日の9時に予算をチェックするよう通知して', { kind: 'reminder', reminderTime: '09:00' }],
  ['25日にカードの引き落としがあるって教えて', { kind: 'reminder', occurredAt: '2026-09-25' }],
  ['リマインダー：15日にクレカの支払い', { kind: 'reminder' }],
  ['毎週金曜にレシートを記録するようリマインドして', { kind: 'reminder', reminderRepeat: 'weekly' }],
  ['明日の朝、ジムの会費を払うのを思い出させて', { kind: 'reminder', reminderTime: '08:00' }],
  ['寝る前に家計簿つけるようにリマインドお願い', { kind: 'reminder' }],
  ['来週の月曜に保険料払うの忘れないで', { kind: 'reminder', occurredAt: '2026-09-21' }],
  ['毎月25日に貯金するようにリマインドして', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['ネットフリックス 1500円 毎月', { kind: 'transaction', amount: 1500, categoryId: 'subscriptions', repeat: 'monthly' }],
  ['家賃 8万円 毎月', { kind: 'transaction', amount: 80000, categoryId: 'rent', repeat: 'monthly' }],
  ['ジム 3000円 毎週', { kind: 'transaction', amount: 3000, repeat: 'weekly' }],
  ['保険 6万円 毎年', { kind: 'transaction', amount: 60000, repeat: 'yearly' }],
  ['明日、家賃払うの覚えておいて', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['今夜8時にアラームをセットして、家計簿をつける', { kind: 'reminder', reminderTime: '20:00' }],
  ['毎晩家計簿をつけるようにお知らせして', { kind: 'reminder', reminderRepeat: 'daily' }],
];

describe('ja: expenses', () => runCases('ja', expenses, labels));
describe('ja: income', () => runCases('ja', income, labels));
describe('ja: spending questions', () => runCases('ja', spentQuestions, labels));
describe('ja: what is left', () => runCases('ja', leftQuestions, labels));
describe('ja: income questions', () => runCases('ja', incomeQuestions, labels));
describe('ja: goals', () => runCases('ja', goals, labels));
describe('ja: reminders', () => runCases('ja', reminders, labels));

// Paying into the harness goal by its English name, the way it is shown in the app.
const englishNamed: [string, Record<string, unknown>][] = [
  ['Trip to Japanに1万円入れた', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['Trip to Japanに5000円貯金した', { kind: 'contribution', amount: 5000, goalId: 'g1' }],
  ['Trip to Japanの貯金に1万円', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
];

// A Japanese speaker usually names the goal in Japanese.
const JAPANESE_GOALS = [{ ...GOALS[0], name: '沖縄旅行' }, { ...GOALS[0], id: 'g2', name: '緊急資金' }] as Goal[];
const contributions: [string, Record<string, unknown>][] = [
  ['沖縄旅行に1万円入れた', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['沖縄旅行の貯金に5000円', { kind: 'contribution', amount: 5000, goalId: 'g1' }],
  ['沖縄旅行用に2万円貯金した', { kind: 'contribution', amount: 20000, goalId: 'g1' }],
  ['沖縄旅行の積立に3万円', { kind: 'contribution', amount: 30000, goalId: 'g1' }],
  ['沖縄旅行に1万円回した', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['今月は沖縄旅行に2万円積み立てた', { kind: 'contribution', amount: 20000, goalId: 'g1' }],
  ['沖縄旅行の資金に1万円追加', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['沖縄旅行のために5000円貯めた', { kind: 'contribution', amount: 5000, goalId: 'g1' }],
  ['昨日沖縄旅行に1万円入れました', { kind: 'contribution', amount: 10000, goalId: 'g1', occurredAt: '2026-09-15' }],
  ['緊急資金に1万円移した', { kind: 'contribution', amount: 10000, goalId: 'g2' }],
  ['緊急資金へ3万円振り込んだ', { kind: 'contribution', amount: 30000, goalId: 'g2' }],
];

describe('ja: paying into a goal', () => {
  it.each(englishNamed)('%s', (text, expected) => {
    const r = parseOne(text, 'ja', labels);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
  it.each(contributions)('%s', (text, expected) => {
    const r = parseOne(text, 'ja', labels, JAPANESE_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

describe('ja: an amount keeps a sentence an entry', () => {
  it.each([
    ['コーヒー代の合計500円', 500],
    ['今月の食費3万円', 30000],
    ['使ったお金は2000円', 2000],
    ['残りの予算で1000円のランチ', 1000],
    ['いくら丼1500円', 1500],
  ])('%s', (text, amount) => {
    const r = parseOne(text, 'ja', labels);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kind: 'transaction', amount });
  });
});

/** Fixing the last entry by voice. Only the new value may follow the opening words; anything else is a new entry. */
const CORRECTIONS: Case[] = [
  ['やっぱり1400円', { kind: 'correction', correction: { remove: false, amount: 1400, categoryId: null, date: null } }],
  ['やっぱ1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['やっぱり1400円だった', { kind: 'correction', correction: { amount: 1400 } }],
  ['やっぱり1400円でした', { kind: 'correction', correction: { amount: 1400 } }],
  ['いや、1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['いやいや、1400円だよ', { kind: 'correction', correction: { amount: 1400 } }],
  ['ごめん、1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['ごめんなさい、1400円です', { kind: 'correction', correction: { amount: 1400 } }],
  ['すみません、1400円でした', { kind: 'correction', correction: { amount: 1400 } }],
  ['あ、1400円だった', { kind: 'correction', correction: { amount: 1400 } }],
  ['訂正、1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['訂正：1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['修正、千四百円', { kind: 'correction', correction: { amount: 1400 } }],
  ['違う、1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['正しくは1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['本当は1400円だった', { kind: 'correction', correction: { amount: 1400 } }],
  ['金額は1400円に', { kind: 'correction', correction: { amount: 1400, categoryId: null } }],
  ['金額は1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['金額を1400円に変えて', { kind: 'correction', correction: { amount: 1400 } }],
  ['金額を1400円に直してください', { kind: 'correction', correction: { amount: 1400 } }],
  ['値段は1,400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['今のは1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['さっきのは1400円だった', { kind: 'correction', correction: { amount: 1400 } }],
  ['それ1400円じゃなくて1500円', { kind: 'correction', correction: { amount: 1500 } }],
  ['1200円じゃなくて1400円', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円だった、ごめん', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円でした、すみません', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円の間違い', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円の間違いでした', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円に訂正', { kind: 'correction', correction: { amount: 1400 } }],
  ['1400円に変えて', { kind: 'correction', correction: { amount: 1400 } }],
  ['カテゴリーは外食に', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['カテゴリーを外食に変更して', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['カテゴリは食料品で', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['分類は交通', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['やっぱり外食', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['いや、外食だった', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['やっぱり買い物に', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['食費じゃなくて外食', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['外食じゃなくて食料品', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['スーパーじゃなくてコンビニ', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['それは交通費', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['それはタクシーだった', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['外食に変えて', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['それは昨日', { kind: 'correction', correction: { date: '2026-09-15', amount: null, categoryId: null } }],
  ['それは昨日だった', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['今のは昨日の分', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['やっぱり昨日', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['日付は昨日', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['日付はおととい', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['今日じゃなくて昨日', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['やっぱり1400円で外食', { kind: 'correction', correction: { amount: 1400, categoryId: 'dining' } }],
  ['訂正、昨日の1400円', { kind: 'correction', correction: { amount: 1400, date: '2026-09-15' } }],
  ['それ消して', { kind: 'correction', correction: { remove: true, amount: null, categoryId: null, date: null } }],
  ['それを消して', { kind: 'correction', correction: { remove: true } }],
  ['それ消してください', { kind: 'correction', correction: { remove: true } }],
  ['今のなし', { kind: 'correction', correction: { remove: true } }],
  ['今のなしで', { kind: 'correction', correction: { remove: true } }],
  ['今のはなし', { kind: 'correction', correction: { remove: true } }],
  ['さっきのを削除', { kind: 'correction', correction: { remove: true } }],
  ['さっきのを削除してください', { kind: 'correction', correction: { remove: true } }],
  ['取り消して', { kind: 'correction', correction: { remove: true } }],
  ['取り消し', { kind: 'correction', correction: { remove: true } }],
  ['今の取り消し', { kind: 'correction', correction: { remove: true } }],
  ['やっぱりなしで', { kind: 'correction', correction: { remove: true } }],
  ['やっぱなし', { kind: 'correction', correction: { remove: true } }],
  ['最後のを消して', { kind: 'correction', correction: { remove: true } }],
  ['最後の1件を削除して', { kind: 'correction', correction: { remove: true } }],
  ['最後の一件を消して', { kind: 'correction', correction: { remove: true } }],
  ['今入れたの消して', { kind: 'correction', correction: { remove: true } }],
  ['さっき入れたやつ削除して', { kind: 'correction', correction: { remove: true } }],
  ['今のキャンセル', { kind: 'correction', correction: { remove: true } }],
  ['キャンセルして', { kind: 'correction', correction: { remove: true } }],
  ['ごめん、今の消して', { kind: 'correction', correction: { remove: true } }],
  ['間違えた、消して', { kind: 'correction', correction: { remove: true } }],
  ['それはなかったことにして', { kind: 'correction', correction: { remove: true } }],
  ['削除', { kind: 'correction', correction: { remove: true } }],
  ['それなしで', { kind: 'correction', correction: { remove: true } }],
  ['今のはランチ', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['いや、昨日のランチ', { kind: 'correction', correction: { categoryId: 'dining', date: '2026-09-15' } }],
  ['カテゴリーを外食にして', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['1400円に直して', { kind: 'correction', correction: { amount: 1400 } }],
  ['ランチじゃなくてディナー', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['やっぱり外食で', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['やっぱり1400円です', { kind: 'correction', correction: { amount: 1400 } }],
];

/** Sentences that sound a little like a correction but are new entries. */
const NOT_CORRECTIONS: Case[] = [
  ['やっぱりランチに1400円使った', { kind: 'transaction', amount: 1400, categoryId: 'dining' }],
  ['いや、ランチに1400円払った', { kind: 'transaction', amount: 1400, categoryId: 'dining' }],
  ['あ、ランチ1200円', { kind: 'transaction', amount: 1200, categoryId: 'dining' }],
  ['さっきのランチ1200円', { kind: 'transaction', amount: 1200, categoryId: 'dining' }],
  ['今のスタバ650円', { kind: 'transaction', amount: 650 }],
  ['1200円ランチ', { kind: 'transaction', amount: 1200 }],
  ['現金じゃなくてカードで3000円払った', { kind: 'transaction', amount: 3000 }],
  ['額縁3000円', { kind: 'transaction', amount: 3000 }],
  ['ネットフリックスのキャンセル料1500円', { kind: 'transaction', amount: 1500 }],
  ['サブスク解約の手数料500円', { kind: 'transaction', amount: 500 }],
  ['消しゴム100円', { kind: 'transaction', amount: 100 }],
  ['1400円だったランチ', { kind: 'transaction', amount: 1400, categoryId: 'dining' }],
  ['一番搾り350円', { kind: 'transaction', amount: 350 }],
  ['全部消して', { kind: 'transaction', amount: null }],
];

describe('ja: corrections', () => runCases('ja', CORRECTIONS, labels));
describe('ja: sentences that are not corrections', () => runCases('ja', NOT_CORRECTIONS, labels));

/** Comparing with last time, where most went, and whether something fits. */
const INSIGHTS: Case[] = [
  ['先月より使ってる？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['先月より使ってますか？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['先月より多く使ってる？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['先月よりお金使ってるかな', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['先週と比べてどう？', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['先週と比べてどうですか？', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['今週は先週より多い？', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['今月は先月より多い？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['今月は先月より少ない？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['今月と先月を比べて', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['先月と比べて外食は増えた？', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['外食は先月より増えてる？', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['先月と比べて食料品は減った？', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'groceries' } }],
  ['去年と比べて出費は増えた？', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['支出は先月より増えましたか？', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['給料日からの出費は前回と比べてどう？', { kind: 'question', question: { ask: 'compare', period: 'budget' } }],
  ['何にいちばんお金を使った？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['何に一番お金を使いましたか？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['今月何に一番使った？', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['先月は何に一番お金を使った？', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['一番大きい出費は？', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['今週いちばん大きかった出費は何？', { kind: 'question', question: { ask: 'biggest', period: 'week', target: null } }],
  ['一番お金がかかったのは何？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['出費が一番多いのは？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['お金は主に何に使ってる？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['お金は主に何に使ってますか？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['お金どこに消えた？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['先月お金はどこに行った？', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['2万円のジャケット買っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 20000, period: 'budget', target: 'ジャケット', fallbackCategoryId: 'shopping' } }],
  ['ジャケットに2万円使っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 20000, fallbackCategoryId: 'shopping' } }],
  ['夕食に8000円使っていい？', { kind: 'question', question: { ask: 'afford', price: 8000, fallbackCategoryId: 'dining' } }],
  ['夕食に8000円使ってもいいですか？', { kind: 'question', question: { ask: 'afford', price: 8000, fallbackCategoryId: 'dining' } }],
  ['12万円のパソコン買える？', { kind: 'question', question: { ask: 'afford', price: 120000, target: 'パソコン', fallbackCategoryId: 'shopping' } }],
  ['12万円のパソコンを買えるかな', { kind: 'question', question: { ask: 'afford', price: 120000, target: 'パソコン' } }],
  ['5000円使っても平気？', { kind: 'question', question: { ask: 'afford', price: 5000, target: null } }],
  ['5000円使っても大丈夫かな', { kind: 'question', question: { ask: 'afford', price: 5000, target: null } }],
  ['外食に5000円使える？', { kind: 'question', question: { ask: 'afford', price: 5000, categoryId: 'dining' } }],
  ['食料品に1万円使っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 10000, categoryId: 'groceries' } }],
  ['3万円の靴を買う余裕ある？', { kind: 'question', question: { ask: 'afford', price: 30000, target: '靴' } }],
  ['飲み会に5000円払っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 5000, fallbackCategoryId: 'dining' } }],
  ['あと5000円使える？', { kind: 'question', question: { ask: 'afford', price: 5000, target: null } }],
  ['まだ5000円使えますか', { kind: 'question', question: { ask: 'afford', price: 5000, target: null } }],
  ['5000円くらい使っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 5000, target: null } }],
  ['2万円のコート買っても良いかな', { kind: 'question', question: { ask: 'afford', price: 20000, target: 'コート', fallbackCategoryId: 'shopping' } }],
  ['8000円のディナーに行っても大丈夫？', { kind: 'question', question: { ask: 'afford', price: 8000, fallbackCategoryId: 'dining' } }],
  ['ランチに1500円かけてもいい？', { kind: 'question', question: { ask: 'afford', price: 1500, fallbackCategoryId: 'dining' } }],
  ['先月と比べて使いすぎていますか', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['前の月より出費多いですか', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['今週はいつもより使ってる？', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['普段より外食が多い？', { kind: 'question', question: { ask: 'compare', categoryId: 'dining' } }],
  ['今月の外食は先月と比べてどう？', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['いちばん出費が多いのはどれ？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['お金を一番使ってるのは何？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['一番使ったカテゴリーは？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['何に一番お金かかってる？', { kind: 'question', question: { ask: 'top', target: null } }],
  ['外食しても大丈夫？', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['ジャケット買っても大丈夫？', { kind: 'question', question: { ask: 'left' } }],
];
const INSIGHTS_STAY_ENTRIES: Case[] = [
  ['ジャケットを2万円で買った', { kind: 'transaction', amount: 20000, categoryId: 'shopping' }],
  ['パソコン12万円', { kind: 'transaction', amount: 120000, categoryId: 'shopping' }],
  ['夕食に8000円使った', { kind: 'transaction', amount: 8000, categoryId: 'dining' }],
  ['一番安いコーヒー300円', { kind: 'transaction', amount: 300, categoryId: 'dining' }],
  ['いちばん高いワイン5000円', { kind: 'transaction', amount: 5000 }],
  ['いつもより高いランチ1500円', { kind: 'transaction', amount: 1500, categoryId: 'dining' }],
  ['先月より安いガソリン5000円', { kind: 'transaction', amount: 5000, categoryId: 'transport' }],
  ['3000円分使えるクーポンを1000円で買った', { kind: 'transaction' }],
  ['大丈夫ドラッグで薬1000円', { kind: 'transaction', amount: 1000 }],
];
describe('ja: comparing, the most, affording', () => runCases('ja', INSIGHTS, labels));
describe('ja: entries near those words stay entries', () => runCases('ja', INSIGHTS_STAY_ENTRIES, labels));

// ---- Round two: more of what people actually say, mostly as dictation writes it (no punctuation, no 円). ----

/** Putting money aside with no goal named: a savings entry, never a new goal. */
const SAVING_ENTRIES: Case[] = [
  ['2万貯金した', { kind: 'transaction', type: 'expense', amount: 20000, categoryId: 'savings' }],
  ['今日5千円貯めた', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'savings', occurredAt: '2026-09-16' }],
  ['貯蓄口座に3万移した', { kind: 'transaction', type: 'expense', amount: 30000, categoryId: 'savings' }],
  ['へそくり5千円', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'savings', note: 'へそくり' }],
  ['緊急用に1万入れた', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'savings' }],
  ['旅行用に1万よけておいた', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'savings' }],
  ['積立NISAに3万3千', { kind: 'transaction', type: 'expense', amount: 33000, categoryId: 'savings' }],
  ['毎月の積立3万', { kind: 'transaction', type: 'expense', amount: 30000, categoryId: 'savings' }],
  ['貯金箱に500円', { kind: 'transaction', type: 'expense', amount: 500, categoryId: 'savings' }],
  ['タンス預金に1万', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'savings' }],
  ['定期預金に10万入れた', { kind: 'transaction', type: 'expense', amount: 100000, categoryId: 'savings' }],
  ['ビットコイン1万円分買った', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'savings' }],
  ['五百円玉貯金', { kind: 'transaction', type: 'expense', amount: 500, categoryId: 'savings' }],
];

/** "毎月2万" is a pace, not the total: the card asks for the total. */
const PACED_GOALS: Case[] = [
  ['車のために毎月2万貯めたい', { kind: 'goal', amount: null, goalKind: 'saving', goalName: '車' }],
  ['毎月3万ずつ貯金したい', { kind: 'goal', amount: null, goalKind: 'saving' }],
  ['月2万円貯めたい', { kind: 'goal', amount: null, goalKind: 'saving' }],
  ['来年までに50万貯めたい', { kind: 'goal', amount: 500000, targetDate: '2027-01-01' }],
  ['12月までに10万貯めたい', { kind: 'goal', amount: 100000 }],
];

const MORE_EXPENSES: Case[] = [
  ['ランチ1200', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['コンビニで800', { kind: 'transaction', type: 'expense', amount: 800, categoryId: 'groceries' }],
  ['昼飯に千円使った', { kind: 'transaction', type: 'expense', amount: 1000, categoryId: 'dining' }],
  ['ガソリン満タン5千円', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'transport' }],
  ['電気代払った8千円', { kind: 'transaction', type: 'expense', amount: 8000, categoryId: 'utilities' }],
  ['家賃振り込んだ9万', { kind: 'transaction', type: 'expense', amount: 90000, categoryId: 'rent' }],
  ['飲み会で4千円', { kind: 'transaction', type: 'expense', amount: 4000, categoryId: 'dining' }],
  ['タクシー2千円', { kind: 'transaction', type: 'expense', amount: 2000, categoryId: 'transport' }],
  ['スタバ600', { kind: 'transaction', type: 'expense', amount: 600, categoryId: 'dining' }],
  ['ユニクロで5千円', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'shopping' }],
  ['病院で3千円', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'health' }],
  ['薬局で1500', { kind: 'transaction', type: 'expense', amount: 1500, categoryId: 'health' }],
  ['駐車場300', { kind: 'transaction', type: 'expense', amount: 300, categoryId: 'transport' }],
  ['高速代800', { kind: 'transaction', type: 'expense', amount: 800, categoryId: 'transport' }],
  ['子どもの習い事1万', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'shopping' }],
  ['サブスク1480', { kind: 'transaction', type: 'expense', amount: 1480, categoryId: 'subscriptions' }],
  ['Amazonで3千円ポチった', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'shopping' }],
  ['ウーバーイーツ2千円', { kind: 'transaction', type: 'expense', amount: 2000, categoryId: 'dining' }],
  ['お昼は同僚とラーメン900', { kind: 'transaction', type: 'expense', amount: 900, categoryId: 'dining' }],
  ['電車代400', { kind: 'transaction', type: 'expense', amount: 400, categoryId: 'transport' }],
  ['定期代1万2千', { kind: 'transaction', type: 'expense', amount: 12000, categoryId: 'transport' }],
  ['ワンコインランチ', { kind: 'transaction', type: 'expense', amount: 500, categoryId: 'dining' }],
  ['五百円玉落とした', { kind: 'transaction', type: 'expense', amount: 500 }],
  ['朝マック500', { kind: 'transaction', type: 'expense', amount: 500, categoryId: 'dining' }],
  ['ドトールで400', { kind: 'transaction', type: 'expense', amount: 400, categoryId: 'dining' }],
  ['セブンで350', { kind: 'transaction', type: 'expense', amount: 350, categoryId: 'groceries' }],
  ['美容院8千円', { kind: 'transaction', type: 'expense', amount: 8000, categoryId: 'shopping' }],
  ['ネイル6千円', { kind: 'transaction', type: 'expense', amount: 6000, categoryId: 'shopping' }],
  ['ペットフード3千円', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'shopping' }],
  ['切手84円', { kind: 'transaction', type: 'expense', amount: 84, categoryId: 'other_expense' }],
  ['PayPayで2千円', { kind: 'transaction', type: 'expense', amount: 2000 }],
  ['洗剤とトイレットペーパー1500', { kind: 'transaction', type: 'expense', amount: 1500, categoryId: 'shopping' }],
  ['ランチ代1200円でした', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'dining' }],
  ['ガチャに3千円課金', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'entertainment' }],
  ['推しのグッズ5千円', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'entertainment' }],
  ['お菓子300', { kind: 'transaction', type: 'expense', amount: 300, categoryId: 'dining' }],
  ['歯医者で5千円払いました', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'health' }],
  ['保育園代3万', { kind: 'transaction', type: 'expense', amount: 30000, categoryId: 'other_expense' }],
  ['塾の月謝2万', { kind: 'transaction', type: 'expense', amount: 20000, categoryId: 'shopping' }],
  ['ETC代1200', { kind: 'transaction', type: 'expense', amount: 1200, categoryId: 'transport' }],
  ['レンタカー8千円', { kind: 'transaction', type: 'expense', amount: 8000, categoryId: 'transport' }],
  ['コンタクト3千円', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'health' }],
  // Given, not received: "お年玉", "お小遣い" and "チップ" are keywords, and the verb decides the direction.
  ['お年玉あげた1万', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'shopping' }],
  ['子どもにお小遣い3千円あげた', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'shopping' }],
  ['チップ渡した500円', { kind: 'transaction', type: 'expense', amount: 500 }],
];

const MORE_INCOME: Case[] = [
  ['給料入った25万', { kind: 'transaction', type: 'income', amount: 250000, categoryId: 'salary' }],
  ['給料日', { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ['給料日25万', { kind: 'transaction', type: 'income', amount: 250000, categoryId: 'salary' }],
  ['バイト代3万', { kind: 'transaction', type: 'income', amount: 30000, categoryId: 'salary' }],
  ['副業で5万', { kind: 'transaction', type: 'income', amount: 50000, categoryId: 'freelance' }],
  ['メルカリで売れた3千円', { kind: 'transaction', type: 'income', amount: 3000, categoryId: 'freelance' }],
  ['フリマで売れた2千円', { kind: 'transaction', type: 'income', amount: 2000, categoryId: 'freelance' }],
  ['返金2千円', { kind: 'transaction', type: 'income', amount: 2000, categoryId: 'other_income' }],
  ['おばあちゃんから1万もらった', { kind: 'transaction', type: 'income', amount: 10000, categoryId: 'gift_income' }],
  ['ボーナス30万', { kind: 'transaction', type: 'income', amount: 300000, categoryId: 'salary' }],
  ['還付金1万', { kind: 'transaction', type: 'income', amount: 10000, categoryId: 'other_income' }],
  ['お年玉', { kind: 'transaction', type: 'income', amount: null, categoryId: 'gift_income' }],
  ['手取り入った23万5千', { kind: 'transaction', type: 'income', amount: 235000, categoryId: 'salary' }],
  ['親から仕送り5万', { kind: 'transaction', type: 'income', amount: 50000, categoryId: 'gift_income' }],
  ['お祝い金3万もらった', { kind: 'transaction', type: 'income', amount: 30000, categoryId: 'gift_income' }],
  ['キャッシュバック1500', { kind: 'transaction', type: 'income', amount: 1500, categoryId: 'other_income' }],
  ['宝くじ当たった3千円', { kind: 'transaction', type: 'income', amount: 3000, categoryId: 'other_income' }],
  ['残業代2万', { kind: 'transaction', type: 'income', amount: 20000, categoryId: 'salary' }],
  ['経費精算で5千円戻ってきた', { kind: 'transaction', type: 'income', amount: 5000, categoryId: 'other_income' }],
];

const MORE_QUESTIONS: Case[] = [
  ['今週いくら使った', { kind: 'question', question: { ask: 'spent', type: 'expense', period: 'week', target: null } }],
  ['今日何円使った', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['今月はいくら使ったっけ', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['昨日いくら使ったか教えて', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: null } }],
  ['コーヒーに今月いくら', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'コーヒー', fallbackCategoryId: 'dining' } }],
  ['今月の外食いくら', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'dining' } }],
  ['今週コンビニいくら', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'コンビニ', fallbackCategoryId: 'groceries' } }],
  ['今日のランチいくらだった', { kind: 'question', question: { ask: 'spent', period: 'today', target: 'ランチ', fallbackCategoryId: 'dining' } }],
  ['ガス代今月いくら払った', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'ガス', fallbackCategoryId: 'utilities' } }],
  ['今月サブスクいくら', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'subscriptions' } }],
  ['今週の飲み会いくら', { kind: 'question', question: { ask: 'spent', period: 'week', target: '飲み会', fallbackCategoryId: 'dining' } }],
  ['あといくら残ってる', { kind: 'question', question: { ask: 'left', target: null } }],
  ['いくら残ってる', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月まだいくら使える', { kind: 'question', question: { ask: 'left', target: null } }],
  ['食費はあといくら', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['交通費あといくら', { kind: 'question', question: { ask: 'left', categoryIds: ['transport'] } }],
  ['今月使いすぎ？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['給料日までお金足りる？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['今月お金足りそう？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['先週より使ってる？', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['今週何に一番使った？', { kind: 'question', question: { ask: 'top', period: 'week', target: null } }],
  ['今月一番大きかった出費は', { kind: 'question', question: { ask: 'biggest', period: 'month', target: null } }],
  ['先週の水曜日にいくら使った', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: null } }],
  ['先週の水曜日にスタバでいくら使った', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: 'スタバ' } }],
  ['先月いちばん大きかった出費は何', { kind: 'question', question: { ask: 'biggest', period: 'lastMonth', target: null } }],
  ['8千円の靴買える？', { kind: 'question', question: { ask: 'afford', price: 8000, target: '靴', fallbackCategoryId: 'shopping' } }],
  ['1万円の靴買っても大丈夫', { kind: 'question', question: { ask: 'afford', price: 10000, target: '靴', fallbackCategoryId: 'shopping' } }],
  ['今週いくら稼いだ', { kind: 'question', question: { type: 'income', period: 'week', target: null } }],
  ['今月の収入いくら', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['バイト代今月いくら', { kind: 'question', question: { type: 'income', period: 'month', fallbackCategoryId: 'salary' } }],
  ['先月の給料いくらだった', { kind: 'question', question: { type: 'income', period: 'lastMonth', categoryId: 'salary' } }],
];

/** Fixes by voice, some naming the entry they mean ("ウーバー消して", "ランチ1500に直して"). */
const MORE_CORRECTIONS: Case[] = [
  ['やっぱ1400だった', { kind: 'correction', correction: { remove: false, target: null, amount: 1400 } }],
  ['金額1400に', { kind: 'correction', correction: { amount: 1400 } }],
  ['1500円に修正', { kind: 'correction', correction: { amount: 1500 } }],
  ['1200じゃなくて1400', { kind: 'correction', correction: { amount: 1400, target: null } }],
  ['千四百円の間違い', { kind: 'correction', correction: { amount: 1400 } }],
  ['それ1400円に直して', { kind: 'correction', correction: { amount: 1400, target: null } }],
  ['外食にして', { kind: 'correction', correction: { categoryId: 'dining', amount: null, target: null } }],
  ['やっぱ交通費', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['昨日のだった', { kind: 'correction', correction: { date: '2026-09-15', amount: null, categoryId: null } }],
  ['昨日の分だった', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['おとといの分', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['さっきの消して', { kind: 'correction', correction: { remove: true, target: null } }],
  ['あれ消して', { kind: 'correction', correction: { remove: true, target: null } }],
  ['ウーバー消して', { kind: 'correction', correction: { remove: true, target: 'ウーバー' } }],
  ['スタバのやつ消して', { kind: 'correction', correction: { remove: true, target: 'スタバ' } }],
  ['コンビニのやつ削除して', { kind: 'correction', correction: { remove: true, target: 'コンビニ' } }],
  ['ランチ1500に直して', { kind: 'correction', correction: { remove: false, target: 'ランチ', amount: 1500, categoryId: null } }],
  ['さっきのランチ1500に直して', { kind: 'correction', correction: { target: 'ランチ', amount: 1500 } }],
  ['ウーバー2300じゃなくて3200', { kind: 'correction', correction: { target: 'ウーバー', amount: 3200 } }],
  ['ランチ1400円だった、ごめん', { kind: 'correction', correction: { target: 'ランチ', amount: 1400 } }],
];

/** Said in passing, these stay entries: a plain "was 1200" is how people log, and "全部" names no entry. */
const STILL_ENTRIES: Case[] = [
  ['ランチ1200円だった', { kind: 'transaction', amount: 1200, categoryId: 'dining' }],
  ['全部消して', { kind: 'transaction', amount: null }],
  ['全部で3千円', { kind: 'transaction', amount: 3000 }],
  ['毎月の家賃8万', { kind: 'transaction', amount: 80000, categoryId: 'rent' }],
  ['月額980円のサブスク', { kind: 'transaction', amount: 980, categoryId: 'subscriptions' }],
  ['毎週のジム代1万', { kind: 'transaction', amount: 10000, categoryId: 'health' }],
  ['先月の電気代8千円払った', { kind: 'transaction', amount: 8000, categoryId: 'utilities', occurredAt: '2026-08-16' }],
  ['貯金から1万おろした', { kind: 'transaction', type: 'expense', amount: 10000 }],
  ['クリーニング代1200', { kind: 'transaction', amount: 1200 }],
];

const MORE_REMINDERS: Case[] = [
  ['1日に家賃リマインドして', { kind: 'reminder', occurredAt: '2026-10-01', reminderText: '家賃' }],
  ['金曜に電気代忘れないように', { kind: 'reminder', occurredAt: '2026-09-18', reminderText: '電気代' }],
  ['20時にレシート入力って言って', { kind: 'reminder', reminderTime: '20:00', reminderText: 'レシート入力' }],
  ['毎週月曜に予算チェックのリマインド', { kind: 'reminder', reminderRepeat: 'weekly', reminderText: '予算チェック' }],
  ['明日の朝9時に振込って教えて', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '09:00' }],
  ['毎月25日カード引き落としのリマインダー', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['来週月曜に保険料払うようリマインド', { kind: 'reminder', occurredAt: '2026-09-21' }],
  ['毎朝家計簿つけるのを思い出させて', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '08:00' }],
  ['夜8時に家計簿リマインド', { kind: 'reminder', reminderTime: '20:00' }],
];

/** Kanji, kana, commas, "万" with a decimal, and the 500-yen coin. */
const NUMBER_FORMS: Case[] = [
  ['千二百円', { kind: 'transaction', amount: 1200 }],
  ['1,200円', { kind: 'transaction', amount: 1200 }],
  ['二千五百', { kind: 'transaction', amount: 2500 }],
  ['1.2万', { kind: 'transaction', amount: 12000 }],
  ['一万二千', { kind: 'transaction', amount: 12000 }],
  ['12万', { kind: 'transaction', amount: 120000 }],
  ['八百円', { kind: 'transaction', amount: 800 }],
  ['¥3,500', { kind: 'transaction', amount: 3500 }],
  ['ワンコイン', { kind: 'transaction', amount: 500 }],
  ['ランチ千二百', { kind: 'transaction', amount: 1200, categoryId: 'dining' }],
  ['三万五千円の家賃', { kind: 'transaction', amount: 35000, categoryId: 'rent' }],
  ['2.5万使った', { kind: 'transaction', amount: 25000 }],
  ['1万2千円のコート', { kind: 'transaction', amount: 12000, categoryId: 'shopping' }],
  ['15,000円の靴', { kind: 'transaction', amount: 15000, categoryId: 'shopping' }],
  ['12.5万のパソコン', { kind: 'transaction', amount: 125000, categoryId: 'shopping' }],
];

describe('ja: putting money aside', () => runCases('ja', SAVING_ENTRIES, labels));
describe('ja: an amount per month is a pace', () => runCases('ja', PACED_GOALS, labels));
describe('ja: more expenses, as dictated', () => runCases('ja', MORE_EXPENSES, labels));
describe('ja: more income', () => runCases('ja', MORE_INCOME, labels));
describe('ja: more questions', () => runCases('ja', MORE_QUESTIONS, labels));
describe('ja: more corrections, some naming the entry', () => runCases('ja', MORE_CORRECTIONS, labels));
describe('ja: still entries', () => runCases('ja', STILL_ENTRIES, labels));
describe('ja: more reminders', () => runCases('ja', MORE_REMINDERS, labels));
describe('ja: the ways a number is said', () => runCases('ja', NUMBER_FORMS, labels));

/** Paying into a goal named in Japanese, with "用に", a bare verb after the amount, or the goal's own words. */
const MORE_CONTRIBUTIONS: [string, Record<string, unknown>][] = [
  ['沖縄旅行の貯金に2千円足した', { kind: 'contribution', amount: 2000, goalId: 'g1' }],
  ['沖縄旅行に3千円貯金', { kind: 'contribution', amount: 3000, goalId: 'g1' }],
  ['沖縄旅行に1万円貯めた', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['旅行用に1万よけておいた', { kind: 'contribution', amount: 10000, goalId: 'g1' }],
  ['昨日沖縄旅行用に5千円入れた', { kind: 'contribution', amount: 5000, goalId: 'g1', occurredAt: '2026-09-15' }],
  ['緊急用に1万入れた', { kind: 'contribution', amount: 10000, goalId: 'g2' }],
  ['緊急資金5千円追加', { kind: 'contribution', amount: 5000, goalId: 'g2' }],
  ['緊急資金に2万足した', { kind: 'contribution', amount: 20000, goalId: 'g2' }],
];
describe('ja: paying into a goal, round two', () => {
  it.each(MORE_CONTRIBUTIONS)('%s', (text, expected) => {
    const r = parseOne(text, 'ja', labels, JAPANESE_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
  it('Trip to Japanに2千円足した', () => {
    const r = parseOne('Trip to Japanに2千円足した', 'ja', labels);
    expect(r[0]).toMatchObject({ kind: 'contribution', amount: 2000, goalId: 'g1' });
  });
});

/** Misreads a reviewer reproduced: a tip given, "いや待って", spending on payday, terse questions, the phone bill, a weekday two weeks back. */
const REVIEWED_MISREADS: Case[] = [
  // A tip is money at the table; only a verb of receiving ("もらった") makes it income.
  ['チップ1000円', { kind: 'transaction', type: 'expense', amount: 1000, categoryId: 'dining' }],
  ['チップ', { kind: 'transaction', type: 'expense', amount: null, categoryId: 'dining' }],
  ['チップで3000円もらった', { kind: 'transaction', type: 'income', amount: 3000 }],
  ['いや待って、1500', { kind: 'correction', correction: { amount: 1500 } }],
  ['待って、1500', { kind: 'correction', correction: { amount: 1500 } }],
  ['えっと1500', { kind: 'correction', correction: { amount: 1500 } }],
  // Payday says when: the supermarket stays spending and the note keeps only the place.
  ['先月の給料日にスーパーで4000円', { kind: 'transaction', type: 'expense', amount: 4000, categoryId: 'groceries', note: 'スーパー' }],
  ['給料日にスーパーで4000円', { kind: 'transaction', type: 'expense', amount: 4000, categoryId: 'groceries', note: 'スーパー' }],
  ['コーヒー代は？', { kind: 'question', question: { ask: 'spent', fallbackCategoryId: 'dining' } }],
  ['食費大丈夫かな', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['スマホの料金2000円', { kind: 'transaction', amount: 2000, categoryId: 'utilities' }],
  // Two weeks back and a weekday: one entry on that week's Tuesday, the count never an amount.
  ['2週間前の火曜日に動物病院で8000円', { kind: 'transaction', amount: 8000, categoryId: 'health', occurredAt: '2026-09-01', note: '動物病院' }],
];

describe('Japanese: reviewed misreads', () => runCases('ja', REVIEWED_MISREADS, labels));

/**
 * Waiting on the parser core: "3.5千" as a digit-and-scale run and a named month as a question period
 * (`question.monthNames` is already in the pack). Un-skip once the core change is merged.
 */
describe('after core merge', () => {
  const pending: Case[] = [
    ['3.5千円', { kind: 'transaction', amount: 3500 }],
    ['8月いくら使った', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
  ];
  runCases('ja', pending, labels);
});
