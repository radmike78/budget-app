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
