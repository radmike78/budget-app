/**
 * Korean: many everyday ways of saying the same thing (반말 and 존댓말, particles
 * attached or spaced, amounts written as 12000원, 만 2천원 or 1만2천원), each with
 * what the parser must make of it.
 */
import { ko } from '@/i18n/locales/ko';
import type { Goal } from '@/types';
import { parseOne, runCases, type Case } from './harness';

const labels = ko.s.categoryNames as Record<string, string>;

const expenses: Case[] = [
  ['점심에 12000원 썼어', { kind: 'transaction', type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심 12000원', { kind: 'transaction', type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심 만 이천원', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심값 1만2천원', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심 먹는데 만 2천원 들었어', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심으로 12,000원 냈어요', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['오늘 점심 만이천원', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['점심 먹었어 12000원', { type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['커피 5천원', { type: 'expense', amount: 5000, categoryId: 'dining' }],
  ['스벅에서 아아 4500원', { type: 'expense', amount: 4500, categoryId: 'dining' }],
  ['아메리카노 한 잔 4500원', { type: 'expense', amount: 4500, categoryId: 'dining' }],
  ['스타벅스 6천원 결제', { type: 'expense', amount: 6000, categoryId: 'dining' }],
  ['카페에서 6500원 썼어요', { type: 'expense', amount: 6500, categoryId: 'dining' }],
  ['저녁 회식비 5만원 냈어', { type: 'expense', amount: 50000, categoryId: 'dining' }],
  ['치킨 시켜 먹었어 2만원', { type: 'expense', amount: 20000, categoryId: 'dining' }],
  ['배민으로 25000원 주문했어', { type: 'expense', amount: 25000, categoryId: 'dining' }],
  ['배달음식 3만원', { type: 'expense', amount: 30000, categoryId: 'dining' }],
  ['술값 4만원', { type: 'expense', amount: 40000, categoryId: 'dining' }],
  ['친구랑 술 마셨는데 6만원 나옴', { type: 'expense', amount: 60000, categoryId: 'dining' }],
  ['어제 저녁 삼겹살 5만 4천원', { type: 'expense', amount: 54000, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['마트에서 3만원 장봤어', { type: 'expense', amount: 30000, categoryId: 'groceries' }],
  ['장보는데 8만원 들었어', { type: 'expense', amount: 80000, categoryId: 'groceries' }],
  ['이마트 12만원', { type: 'expense', amount: 120000, categoryId: 'groceries' }],
  ['편의점 3천500원', { type: 'expense', amount: 3500, categoryId: 'groceries' }],
  ['편의점에서 컵라면이랑 음료수 4800원', { type: 'expense', amount: 4800, categoryId: 'groceries' }],
  ['쿠팡 로켓프레시 4만원', { type: 'expense', amount: 40000, categoryId: 'groceries' }],
  ['고기 사는데 4만원', { type: 'expense', amount: 40000, categoryId: 'groceries' }],
  ['주유 5만원', { type: 'expense', amount: 50000, categoryId: 'transport' }],
  ['기름 넣었어 6만원', { type: 'expense', amount: 60000, categoryId: 'transport' }],
  ['택시비 만원 나왔어', { type: 'expense', amount: 10000, categoryId: 'transport' }],
  ['택시 타고 13000원', { type: 'expense', amount: 13000, categoryId: 'transport' }],
  ['택시 탔는데 만오천원', { type: 'expense', amount: 15000, categoryId: 'transport' }],
  ['버스비 1500원', { type: 'expense', amount: 1500, categoryId: 'transport' }],
  ['교통카드 5만원 충전', { type: 'expense', amount: 50000, categoryId: 'transport' }],
  ['주차비 3천원', { type: 'expense', amount: 3000, categoryId: 'transport' }],
  ['KTX 표 59800원', { type: 'expense', amount: 59800, categoryId: 'transport' }],
  ['월세 50만원 냈어', { type: 'expense', amount: 500000, categoryId: 'rent' }],
  ['관리비 15만원', { type: 'expense', amount: 150000, categoryId: 'rent' }],
  ['전기세 4만 2천원', { type: 'expense', amount: 42000, categoryId: 'utilities' }],
  ['핸드폰 요금 6만원 나갔어', { type: 'expense', amount: 60000, categoryId: 'utilities' }],
  ['인터넷 요금 3만원', { type: 'expense', amount: 30000, categoryId: 'utilities' }],
  ['가스비 7만원', { type: 'expense', amount: 70000, categoryId: 'utilities' }],
  ['자동이체로 통신비 5만원 나감', { type: 'expense', amount: 50000, categoryId: 'utilities' }],
  ['병원비 2만원', { type: 'expense', amount: 20000, categoryId: 'health' }],
  ['약국에서 8천원', { type: 'expense', amount: 8000, categoryId: 'health' }],
  ['치과 15만원', { type: 'expense', amount: 150000, categoryId: 'health' }],
  ['병원 갔다 왔는데 진료비 15000원', { type: 'expense', amount: 15000, categoryId: 'health' }],
  ['헬스장 등록 30만원', { type: 'expense', amount: 300000, categoryId: 'health' }],
  ['영화 보는데 3만원', { type: 'expense', amount: 30000, categoryId: 'entertainment' }],
  ['노래방 2만원', { type: 'expense', amount: 20000, categoryId: 'entertainment' }],
  ['PC방 5천원', { type: 'expense', amount: 5000, categoryId: 'entertainment' }],
  ['넷플릭스 17000원', { type: 'expense', amount: 17000, categoryId: 'subscriptions' }],
  ['유튜브 프리미엄 14900원 결제됐어', { type: 'expense', amount: 14900, categoryId: 'subscriptions' }],
  ['넷플 구독료 13500원 빠져나감', { type: 'expense', amount: 13500, categoryId: 'subscriptions' }],
  ['옷 샀어 8만원', { type: 'expense', amount: 80000, categoryId: 'shopping' }],
  ['무신사에서 운동화 12만원 샀어', { type: 'expense', amount: 120000, categoryId: 'shopping' }],
  ['다이소 5천원', { type: 'expense', amount: 5000, categoryId: 'shopping' }],
  ['3만원 긁었어 옷 사느라', { type: 'expense', amount: 30000, categoryId: 'shopping' }],
  ['친구 생일 선물 5만원 사줬어', { type: 'expense', amount: 50000, categoryId: 'shopping' }],
  ['미용실 3만원', { type: 'expense', amount: 30000 }],
  ['카드값 80만원 냈어', { type: 'expense', amount: 800000, categoryId: 'debt' }],
  ['적금 30만원 넣었어', { type: 'expense', amount: 300000, categoryId: 'savings' }],
  ['축의금 10만원', { type: 'expense', amount: 100000, categoryId: 'other_expense' }],
  ['부모님께 용돈 20만원 드렸어', { type: 'expense', amount: 200000, categoryId: 'other_expense' }],
  ['보험료 10만원 빠져나갔어', { type: 'expense', amount: 100000 }],
  ['ATM에서 10만원 뽑았어', { type: 'expense', amount: 100000, categoryId: 'other_expense' }],
  // Question-like words with an amount stay entries.
  ['점심에 쓴 돈 12000원', { kind: 'transaction', type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['커피값 합계 9천원', { kind: 'transaction', type: 'expense', amount: 9000, categoryId: 'dining' }],
];

const income: Case[] = [
  ['월급 들어왔어 300만원', { kind: 'transaction', type: 'income', amount: 3000000, categoryId: 'salary' }],
  ['월급 300만원', { type: 'income', amount: 3000000, categoryId: 'salary' }],
  ['월급 받았어 3백만원', { type: 'income', amount: 3000000, categoryId: 'salary' }],
  ['급여 250만원 들어옴', { type: 'income', amount: 2500000, categoryId: 'salary' }],
  ['월급 실수령 312만원', { type: 'income', amount: 3120000, categoryId: 'salary' }],
  ['보너스 100만원 받았어', { type: 'income', amount: 1000000, categoryId: 'salary' }],
  ['성과급 200만원 나왔어', { type: 'income', amount: 2000000, categoryId: 'salary' }],
  ['알바비 80만원 들어왔어요', { type: 'income', amount: 800000, categoryId: 'salary' }],
  ['외주 작업비 150만원 받았어', { type: 'income', amount: 1500000, categoryId: 'freelance' }],
  ['프리랜서 일로 50만원 벌었어', { type: 'income', amount: 500000, categoryId: 'freelance' }],
  ['당근에서 의자 3만원에 팔았어', { type: 'income', amount: 30000 }],
  ['중고로 아이폰 팔아서 40만원 받았어', { type: 'income', amount: 400000 }],
  ['엄마가 용돈 10만원 줬어', { type: 'income', amount: 100000, categoryId: 'gift_income' }],
  ['용돈 받았어 5만원', { type: 'income', amount: 50000, categoryId: 'gift_income' }],
  ['세뱃돈 20만원 받았다', { type: 'income', amount: 200000, categoryId: 'gift_income' }],
  ['할머니가 10만원 주셨어요', { type: 'income', amount: 100000, categoryId: 'gift_income' }],
  ['환불 받았어 3만원', { type: 'income', amount: 30000, categoryId: 'other_income' }],
  ['쿠팡에서 환불 2만 5천원 들어왔어', { type: 'income', amount: 25000, categoryId: 'other_income' }],
  ['팁으로 3만원 받았어', { type: 'income', amount: 30000 }],
  ['이자 3천원 들어왔어', { type: 'income', amount: 3000, categoryId: 'other_income' }],
  ['연말정산 환급 50만원', { type: 'income', amount: 500000, categoryId: 'other_income' }],
  ['친구가 빌려간 돈 5만원 갚았어', { type: 'income', amount: 50000 }],
  ['캐시백 5천원', { type: 'income', amount: 5000, categoryId: 'other_income' }],
];

const spentQuestions: Case[] = [
  ['이번 달 얼마 썼어?', { kind: 'question', question: { ask: 'spent', type: 'expense', period: 'month', target: null } }],
  ['이번달에 얼마나 썼지', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['이번 달 얼마나 썼어요?', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['이번 달에 얼마 지출했어요', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['얼마 썼어', { kind: 'question', question: { ask: 'spent', periodDefaulted: true, target: null } }],
  ['이번 주 커피에 얼마 썼지', { kind: 'question', question: { ask: 'spent', period: 'week', target: '커피', fallbackCategoryId: 'dining' } }],
  ['커피에 돈 얼마나 쓴 거야', { kind: 'question', question: { ask: 'spent', target: '커피' } }],
  ['오늘 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['어제 얼마 썼더라', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: null } }],
  ['지난주에 택시비로 얼마 나갔어', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: '택시비', fallbackCategoryId: 'transport' } }],
  ['지난달 식비 얼마 나왔어', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryIds: ['groceries', 'dining'] } }],
  ['식비 얼마 나갔어', { kind: 'question', question: { ask: 'spent', categoryIds: ['groceries', 'dining'] } }],
  ['스타벅스에 얼마 들었어', { kind: 'question', question: { ask: 'spent', target: '스타벅스', fallbackCategoryId: 'dining' } }],
  ['스타벅스에서 이번 달 얼마 결제했어', { kind: 'question', question: { ask: 'spent', period: 'month', target: '스타벅스' } }],
  ['배달음식에 얼마 썼어', { kind: 'question', question: { ask: 'spent', target: '배달음식', fallbackCategoryId: 'dining' } }],
  ['이번 달 커피값 합계', { kind: 'question', question: { ask: 'spent', period: 'month', target: '커피', fallbackCategoryId: 'dining' } }],
  ['이번 달 지출 얼마야', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['이번 달 총 지출', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['이번 달 지출 알려줘', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['이번 달 얼마 썼는지 알려줘', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['커피에 쓴 돈 보여줘', { kind: 'question', question: { ask: 'spent', target: '커피' } }],
  ['장보기에 얼마 썼어', { kind: 'question', question: { ask: 'spent', categoryId: 'groceries' } }],
  ['외식비 얼마 썼어', { kind: 'question', question: { ask: 'spent', categoryId: 'dining' } }],
  ['교통비 얼마 들었지', { kind: 'question', question: { ask: 'spent', categoryId: 'transport' } }],
  ['이번 달 쇼핑에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'shopping' } }],
  ['구독에 얼마 쓰고 있어?', { kind: 'question', question: { ask: 'spent', categoryId: 'subscriptions' } }],
  ['올해 여행에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'year', target: '여행' } }],
  ['작년에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'lastYear', target: null } }],
  ['지금까지 총 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'all', target: null } }],
  ['이번 주에 술값으로 얼마 나갔지', { kind: 'question', question: { ask: 'spent', period: 'week', target: '술', fallbackCategoryId: 'dining' } }],
  ['지난달에 카드로 얼마 긁었어', { kind: 'question', question: { ask: 'spent', period: 'lastMonth' } }],
  ['월급날부터 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['이번 급여 기간에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['월급 받고 나서 얼마 썼지', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['택시비 얼마나 나왔어요', { kind: 'question', question: { ask: 'spent', target: '택시비' } }],
];

const leftQuestions: Case[] = [
  ['얼마 남았어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['예산 얼마나 남았어?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['이번 달 예산 얼마 남았어요', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['남은 예산 얼마야', { kind: 'question', question: { ask: 'left', target: null } }],
  ['남은 돈 얼마야', { kind: 'question', question: { ask: 'left', target: null } }],
  ['아직 얼마 쓸 수 있어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['오늘 얼마 쓸 수 있어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['쓸 수 있는 돈 얼마야', { kind: 'question', question: { ask: 'left', target: null } }],
  ['월급날까지 얼마 남았어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['월급 전까지 얼마 쓸 수 있어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['예산 안에 있어?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['예산 넘었어?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['예산 어때?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['잔액 얼마야', { kind: 'question', question: { ask: 'left', target: null } }],
  ['돈 얼마 있어?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['식비 얼마 남았지', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['식비 예산 얼마 남았어요', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['장보기 예산 얼마 남았어', { kind: 'question', question: { ask: 'left', categoryId: 'groceries' } }],
  ['외식에 얼마 더 쓸 수 있어', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['외식비 얼마 남았어', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['교통비 남은 거 얼마야', { kind: 'question', question: { ask: 'left', categoryId: 'transport' } }],
  ['쇼핑에 쓸 돈 남았어?', { kind: 'question', question: { ask: 'left', categoryId: 'shopping' } }],
];

const incomeQuestions: Case[] = [
  ['이번 달 얼마 벌었어', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['지난달에 얼마 벌었지', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['이번 달 수입 얼마야', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['이번 달 수입이 얼마예요?', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['올해 수입 얼마나 돼', { kind: 'question', question: { type: 'income', period: 'year', target: null } }],
  ['이번 주에 얼마 들어왔어', { kind: 'question', question: { type: 'income', period: 'week', target: null } }],
  ['이번 달 얼마 받았어', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['월급 얼마 들어왔어', { kind: 'question', question: { type: 'income', categoryId: 'salary' } }],
  ['올해 부업으로 얼마 벌었어', { kind: 'question', question: { type: 'income', period: 'year', categoryId: 'freelance' } }],
  ['지난달 번 돈 얼마야', { kind: 'question', question: { type: 'income', period: 'lastMonth', target: null } }],
];

const goals: Case[] = [
  ['여행 가려고 300만원 모으고 싶어', { kind: 'goal', amount: 3000000, goalKind: 'saving' }],
  ['노트북 사려고 150만원 모으고 싶어요', { kind: 'goal', amount: 1500000, goalKind: 'saving' }],
  ['연말까지 비상금 500만원 모을 거야', { kind: 'goal', amount: 5000000, goalKind: 'saving' }],
  ['내년 여름까지 유럽여행 자금 400만원 모으기', { kind: 'goal', amount: 4000000, goalKind: 'saving' }],
  ['목표: 차 사기 2천만원', { kind: 'goal', amount: 20000000, goalKind: 'saving' }],
  ['저축 목표 1000만원', { kind: 'goal', amount: 10000000, goalKind: 'saving' }],
  ['결혼 자금으로 3천만원 모을래', { kind: 'goal', amount: 30000000, goalKind: 'saving' }],
  ['집 보증금 마련하려고 2000만원 저축할 거야', { kind: 'goal', amount: 20000000, goalKind: 'saving' }],
  ['비상금 100만원 만들고 싶어', { kind: 'goal', amount: 1000000, goalKind: 'saving' }],
  ['다음 달까지 50만원 모아야 해', { kind: 'goal', amount: 500000, goalKind: 'saving' }],
  ['아이패드 살 돈 80만원 모으려고', { kind: 'goal', amount: 800000, goalKind: 'saving' }],
  ['캠핑 장비 사게 100만원 모아 볼래', { kind: 'goal', amount: 1000000, goalKind: 'saving' }],
];

const debtGoals: Case[] = [
  ['카드값 200만원 갚고 싶어', { kind: 'goal', amount: 2000000, goalKind: 'debt' }],
  ['대출 다 갚을래', { kind: 'goal', goalKind: 'debt' }],
  ['학자금 대출 1500만원 갚을 거야', { kind: 'goal', amount: 15000000, goalKind: 'debt' }],
  ['연말까지 마통 300만원 다 갚고 싶어', { kind: 'goal', amount: 3000000, goalKind: 'debt' }],
  ['신용카드 빚 500만원 청산하고 싶어', { kind: 'goal', amount: 5000000, goalKind: 'debt' }],
  ['빚 1000만원 갚아야 해', { kind: 'goal', amount: 10000000, goalKind: 'debt' }],
  ['대출금 3천만원 상환하고 싶어요', { kind: 'goal', amount: 30000000, goalKind: 'debt' }],
  ['친구한테 빌린 돈 50만원 갚을 거야', { kind: 'goal', amount: 500000, goalKind: 'debt' }],
  ['상환 목표: 대출 2000만원', { kind: 'goal', amount: 20000000, goalKind: 'debt' }],
];

// The shared goal is named in English; a Korean speaker says its name as it is written.
const contributionsToSharedGoal: Case[] = [
  ['Trip to Japan에 10만원 넣었어', { kind: 'contribution', amount: 100000, goalId: 'g1' }],
  ['Trip to Japan 목표에 5만원 추가했어', { kind: 'contribution', amount: 50000, goalId: 'g1' }],
  ['trip to japan으로 3만원 이체했어', { kind: 'contribution', amount: 30000, goalId: 'g1' }],
  ['Trip to Japan 통장에 20만원 옮겼어', { kind: 'contribution', amount: 200000, goalId: 'g1' }],
];

const reminders: Case[] = [
  ['내일 아침 8시에 월세 내라고 알려줘', { kind: 'reminder', reminderTime: '08:00', occurredAt: '2026-09-17' }],
  ['매달 25일에 카드값 내라고 알려줘', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['넷플릭스 15000원 매달', { kind: 'transaction', amount: 15000, categoryId: 'subscriptions', repeat: 'monthly' }],
  ['월세 80만원 매월', { kind: 'transaction', amount: 800000, categoryId: 'rent', repeat: 'monthly' }],
  ['헬스장 3만원 매주', { kind: 'transaction', amount: 30000, repeat: 'weekly' }],
  ['보험 60만원 매년', { kind: 'transaction', amount: 600000, repeat: 'yearly' }],
  ['금요일에 영수증 정리하라고 리마인드해 줘', { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['월세 내는 거 잊지 않게 해 줘', { kind: 'reminder' }],
  ['매주 일요일 저녁에 가계부 쓰라고 알림 설정해 줘', { kind: 'reminder', reminderRepeat: 'weekly' }],
  ['1일에 관리비 내야 한다고 알려 주세요', { kind: 'reminder', occurredAt: '2026-10-01' }],
  ['내일 공과금 내야 하는 거 기억시켜 줘', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['다음 주 월요일에 통신비 확인 알림', { kind: 'reminder', occurredAt: '2026-09-21' }],
  ['15일에 적금 넣으라고 리마인더 설정해 줘', { kind: 'reminder' }],
  ['내일 월세 내는 거 까먹지 말라고 해줘', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['내일 9시에 예산 확인하라고 해줘', { kind: 'reminder', reminderTime: '09:00', occurredAt: '2026-09-17' }],
  ['저녁 9시에 지출 기록하라고 알림 보내줘', { kind: 'reminder', reminderTime: '21:00' }],
  ['매일 밤 10시에 가계부 쓰라고 알려줘', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '22:00' }],
  ['월요일마다 예산 확인 알림', { kind: 'reminder', reminderRepeat: 'weekly' }],
  ['리마인더: 15일에 카드값', { kind: 'reminder' }],
  ['월세 냈는지 확인하라고 알려줘', { kind: 'reminder' }],
  ['이번 달 얼마 썼는지 확인하라고 알려줘', { kind: 'reminder' }],
];

describe('Korean phrasings', () => {
  describe('expenses', () => runCases('ko', expenses, labels));
  describe('income', () => runCases('ko', income, labels));
  describe('spending questions', () => runCases('ko', spentQuestions, labels));
  describe('what is left', () => runCases('ko', leftQuestions, labels));
  describe('income questions', () => runCases('ko', incomeQuestions, labels));
  describe('saving goals', () => runCases('ko', goals, labels));
  describe('debt goals', () => runCases('ko', debtGoals, labels));
  describe('contributions to a goal named in English', () => runCases('ko', contributionsToSharedGoal, labels));
  describe('reminders', () => runCases('ko', reminders, labels));
});

// Goals a Korean user would name in Korean.
const KO_GOALS = [
  { id: 'k1', name: '일본 여행', kind: 'saving', targetAmount: 3000000, savedAmount: 0, targetDate: null, completed: false, createdAt: '2026-01-01' },
  { id: 'k2', name: '비상금', kind: 'saving', targetAmount: 5000000, savedAmount: 0, targetDate: null, completed: false, createdAt: '2026-01-01' },
] as unknown as Goal[];

const contributions: [string, string, number][] = [
  ['일본 여행에 10만원 넣었어', 'k1', 100000],
  ['일본여행에 10만원 넣었어요', 'k1', 100000],
  ['일본 여행 적금에 10만원 넣음', 'k1', 100000],
  ['일본 여행 목표에 5만원 추가', 'k1', 50000],
  ['일본여행 통장에 30만원 옮겼어', 'k1', 300000],
  ['일본 여행 위해 10만원 저축했어', 'k1', 100000],
  ['일본 여행에 이번 달 20만원 모았어', 'k1', 200000],
  ['비상금으로 20만원 이체했어', 'k2', 200000],
  ['오늘 비상금에 10만원 저금했어', 'k2', 100000],
  ['비상금 통장에 5만원 더 넣었어', 'k2', 50000],
];

describe('Korean phrasings: contributions to a goal named in Korean', () => {
  it.each(contributions)('%s', (text, goalId, amount) => {
    const r = parseOne(text, 'ko', labels, KO_GOALS);
    expect(r).toHaveLength(1);
    expect({ kind: r[0].kind, goalId: r[0].goalId, amount: r[0].amount }).toEqual({ kind: 'contribution', goalId, amount });
  });
});

/** Fixing the last entry by voice. Only the new value may follow the lead; anything else is a new entry. */
const corrections: Case[] = [
  ['아니 14000원', { kind: 'correction', correction: { remove: false, amount: 14000, categoryId: null, date: null } }],
  ['아니 14000원이야', { kind: 'correction', correction: { amount: 14000 } }],
  ['아 아니 14000원이야', { kind: 'correction', correction: { amount: 14000 } }],
  ['아니, 만 사천원', { kind: 'correction', correction: { amount: 14000 } }],
  ['아니요, 14000원이에요', { kind: 'correction', correction: { amount: 14000 } }],
  ['아니요 만 사천 원이요', { kind: 'correction', correction: { amount: 14000 } }],
  ['아뇨 14000원입니다', { kind: 'correction', correction: { amount: 14000 } }],
  ['정정, 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['정정: 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['정정할게요, 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['미안, 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['죄송해요, 14000원이에요', { kind: 'correction', correction: { amount: 14000 } }],
  ['다시 말하면 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['잘못 말했어, 14000원이야', { kind: 'correction', correction: { amount: 14000 } }],
  ['아니 그게 아니라 14000원', { kind: 'correction', correction: { amount: 14000 } }],
  ['그거 사실 14000원이었어', { kind: 'correction', correction: { amount: 14000 } }],
  ['방금 거 14000원이야', { kind: 'correction', correction: { amount: 14000 } }],
  ['금액 14000원으로 바꿔줘', { kind: 'correction', correction: { amount: 14000, categoryId: null } }],
  ['금액은 14000원이야', { kind: 'correction', correction: { amount: 14000 } }],
  ['금액을 14000원으로 수정해 주세요', { kind: 'correction', correction: { amount: 14000 } }],
  ['금액 14000원으로 변경해줘', { kind: 'correction', correction: { amount: 14000 } }],
  ['14000원으로 바꿔줘', { kind: 'correction', correction: { amount: 14000 } }],
  // The correction said at the end, the Korean way: the whole sentence is the value and "였어".
  ['14000원이었어', { kind: 'correction', correction: { amount: 14000 } }],
  ['14000원이었어, 미안', { kind: 'correction', correction: { amount: 14000 } }],
  ['14000원이었어요, 죄송해요', { kind: 'correction', correction: { amount: 14000 } }],
  ['만 사천원이었어', { kind: 'correction', correction: { amount: 14000 } }],
  ['카테고리 외식으로 바꿔', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['카테고리 교통으로 바꿔 주세요', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['카테고리를 외식으로 변경해 주세요', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['분류 교통으로 바꿔줘', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['그건 외식이야', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['그거 교통비야', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['그거 외식비였어', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['방금 건 장보기였어', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['외식이었어', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['외식으로 바꿔 줘', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['장보기로 변경해 주세요', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['그거 외식으로 바꿔줘', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['아니 장보기로 바꿔줘', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['마지막 거 장보기로 바꿔줘', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['식비 말고 외식', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['식비 말고 외식으로 해줘', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['쇼핑 말고 장보기', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['교통 말고 쇼핑', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['그거 어제였어', { kind: 'correction', correction: { date: '2026-09-15', amount: null, categoryId: null } }],
  ['아 그거 어제였어', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['그거 어제 거야', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['아니 그거 어제야', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['아니 어제야', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['그거 그저께였어요', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['어제였어', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['어제로 바꿔줘', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['날짜 어제로 바꿔줘', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['날짜를 어제로 바꿔 주세요', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['그거 지난주 금요일이었어', { kind: 'correction', correction: { date: '2026-09-11' } }],
  ['금요일이었어', { kind: 'correction', correction: { date: '2026-09-11' } }],
  ['아니 어제 14000원', { kind: 'correction', correction: { amount: 14000, date: '2026-09-15' } }],
  ['점심 5만원으로 바꿔줘', { kind: 'correction', correction: { amount: 50000, categoryId: 'dining' } }],
  ['그거 지워줘', { kind: 'correction', correction: { remove: true, amount: null, categoryId: null, date: null } }],
  ['그거 지워 주세요', { kind: 'correction', correction: { remove: true } }],
  ['방금 거 삭제해', { kind: 'correction', correction: { remove: true } }],
  ['방금 거 지워 줄래?', { kind: 'correction', correction: { remove: true } }],
  ['마지막 거 지워', { kind: 'correction', correction: { remove: true } }],
  ['마지막 내역 삭제해 주세요', { kind: 'correction', correction: { remove: true } }],
  ['마지막 항목 삭제해줘', { kind: 'correction', correction: { remove: true } }],
  ['그거 삭제해 줘요', { kind: 'correction', correction: { remove: true } }],
  ['취소해 줘', { kind: 'correction', correction: { remove: true } }],
  ['이거 취소', { kind: 'correction', correction: { remove: true } }],
  ['방금 기록한 거 취소해 주세요', { kind: 'correction', correction: { remove: true } }],
  ['방금 입력한 거 삭제해 주세요', { kind: 'correction', correction: { remove: true } }],
  ['없던 걸로 해', { kind: 'correction', correction: { remove: true } }],
  ['없던 일로 해 줘', { kind: 'correction', correction: { remove: true } }],
  ['없었던 걸로 하자', { kind: 'correction', correction: { remove: true } }],
  ['방금 건 빼줘', { kind: 'correction', correction: { remove: true } }],
  ['삭제', { kind: 'correction', correction: { remove: true } }],
  ['실행 취소', { kind: 'correction', correction: { remove: true } }],
  ['아 미안 그거 지워 줘', { kind: 'correction', correction: { remove: true } }],
  ['아 잘못 말했어, 지워 줘', { kind: 'correction', correction: { remove: true } }],
  ['죄송해요 방금 거 삭제해 주세요', { kind: 'correction', correction: { remove: true } }],
];

/** Sentences that sound a little like a correction but are new entries. */
const notCorrections: Case[] = [
  ['아니 점심에 14000원 썼어', { kind: 'transaction', amount: 14000, categoryId: 'dining' }],
  ['아니 14000원 썼어', { kind: 'transaction', amount: 14000 }],
  ['아니 진짜 14000원 썼어', { kind: 'transaction', amount: 14000 }],
  ['그거 점심 14000원 썼어', { kind: 'transaction', amount: 14000, categoryId: 'dining' }],
  ['아니 커피 4500원', { kind: 'transaction', amount: 4500, categoryId: 'dining' }],
  ['커피 말고 녹차 4500원', { kind: 'transaction', amount: 4500 }],
  ['점심 12000원이었어', { kind: 'transaction', amount: 12000, categoryId: 'dining', note: '점심' }],
  ['커피 4500원이었어', { kind: 'transaction', amount: 4500, categoryId: 'dining' }],
  ['어제 점심 12000원이었어', { kind: 'transaction', amount: 12000, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['넷플릭스 구독 취소 13500원', { kind: 'transaction', amount: 13500 }],
  ['취소 수수료 3000원', { kind: 'transaction', amount: 3000 }],
  ['삭제 수수료 5000원 냈어', { kind: 'transaction', amount: 5000 }],
];

/** Comparing with last time, where most went, and whether something fits. */
const insights: Case[] = [
  ['지난달보다 많이 썼어?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난달보다 많이 썼어요?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난달보다 많이 쓴 거야?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난달에 비해 많이 썼어?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난달보다 덜 썼어?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난달 대비 어때?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['이번 달 지난달보다 많아?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['이번 달 지난달이랑 비교해 줘', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['이번 달 지출 늘었어?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['지난주랑 비교하면 어때?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['이번 주 지난주보다 더 썼어?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['이번 주 지출 줄었어?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['작년보다 많이 썼나?', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['작년이랑 비교하면 올해 어때요?', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['급여 기간 지난번보다 많이 썼어?', { kind: 'question', question: { ask: 'compare', period: 'budget', target: null } }],
  ['지난달보다 외식비 늘었어?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['지난달이랑 비교해서 외식 얼마나 늘었어?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['저번 달보다 장보기 덜 했어?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'groceries' } }],
  ['지난달보다 쇼핑에 더 썼나요?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'shopping' } }],
  ['지난주보다 커피값 더 나갔어?', { kind: 'question', question: { ask: 'compare', period: 'week', target: '커피', fallbackCategoryId: 'dining' } }],
  ['지난주보다 커피 많이 마셨어?', { kind: 'question', question: { ask: 'compare', period: 'week', target: '커피' } }],
  ['어디에 제일 많이 썼어?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['어디에 가장 많이 썼어요?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['가장 큰 지출이 뭐야?', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['돈이 주로 어디로 나갔어?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['이번 달 뭐에 제일 많이 썼지?', { kind: 'question', question: { ask: 'top', period: 'month', periodDefaulted: false, target: null } }],
  ['제일 많이 쓴 데가 어디야?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['돈을 제일 많이 쓴 곳이 어디예요?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['뭐에 돈을 제일 많이 썼어?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['제일 많이 나간 게 뭐야?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['가장 많이 쓴 카테고리가 뭐예요?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['어느 카테고리에 제일 많이 썼어?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['지출 제일 큰 게 뭐야?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['돈이 어디로 샜어?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['지난달에 어디에 돈을 제일 많이 썼어요?', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['지난달 돈이 다 어디로 갔지?', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['이번 주에 어디서 돈이 제일 많이 나갔어?', { kind: 'question', question: { ask: 'top', period: 'week', target: null } }],
  ['20만원짜리 재킷 사도 돼?', { kind: 'question', question: { ask: 'afford', price: 200000, period: 'budget', target: '재킷', fallbackCategoryId: 'shopping' } }],
  ['20만원짜리 재킷 사도 될까요?', { kind: 'question', question: { ask: 'afford', price: 200000, target: '재킷' } }],
  ['저녁에 8만원 써도 괜찮아?', { kind: 'question', question: { ask: 'afford', price: 80000, target: '저녁', fallbackCategoryId: 'dining' } }],
  ['저녁에 8만원 써도 괜찮을까요?', { kind: 'question', question: { ask: 'afford', price: 80000, fallbackCategoryId: 'dining' } }],
  ['8만원짜리 저녁 먹어도 될까요?', { kind: 'question', question: { ask: 'afford', price: 80000, fallbackCategoryId: 'dining' } }],
  ['120만원 노트북 살 수 있을까?', { kind: 'question', question: { ask: 'afford', price: 1200000, target: '노트북', fallbackCategoryId: 'shopping' } }],
  ['120만원짜리 노트북 사도 괜찮아?', { kind: 'question', question: { ask: 'afford', price: 1200000, target: '노트북' } }],
  ['10만원짜리 신발 살 수 있어?', { kind: 'question', question: { ask: 'afford', price: 100000, target: '신발', fallbackCategoryId: 'shopping' } }],
  ['100만원짜리 가방 질러도 될까?', { kind: 'question', question: { ask: 'afford', price: 1000000, target: '가방' } }],
  ['5만원짜리 콘서트 가도 돼?', { kind: 'question', question: { ask: 'afford', price: 50000, fallbackCategoryId: 'entertainment' } }],
  ['배달 2만원 시켜도 돼?', { kind: 'question', question: { ask: 'afford', price: 20000, fallbackCategoryId: 'dining' } }],
  ['장보기에 5만원 써도 돼요?', { kind: 'question', question: { ask: 'afford', price: 50000, categoryId: 'groceries' } }],
  ['5만원 써도 돼?', { kind: 'question', question: { ask: 'afford', price: 50000, target: null } }],
  ['5만원 써도 될까?', { kind: 'question', question: { ask: 'afford', price: 50000, target: null } }],
  ['3만원 더 써도 괜찮아요?', { kind: 'question', question: { ask: 'afford', price: 30000, target: null } }],
  ['이번 달에 30만원 더 써도 돼?', { kind: 'question', question: { ask: 'afford', price: 300000, period: 'budget', target: null } }],
  ['50만원 쓸 여유 있어?', { kind: 'question', question: { ask: 'afford', price: 500000, target: null } }],
  // Without an amount, "can I afford to eat out" asks what is left.
  ['외식해도 괜찮아?', { kind: 'question', question: { ask: 'left', period: 'budget', categoryId: 'dining' } }],
  ['외식해도 되나요?', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['쇼핑해도 될까?', { kind: 'question', question: { ask: 'left', categoryId: 'shopping' } }],
  ['커피 사 먹어도 돼?', { kind: 'question', question: { ask: 'left', fallbackCategoryId: 'dining' } }],
  ['노트북 사도 돼?', { kind: 'question', question: { ask: 'left', target: '노트북' } }],
];

/** Entries that carry those words and an amount stay entries. */
const insightsStayEntries: Case[] = [
  ['재킷 20만원 샀어', { kind: 'transaction', amount: 200000, categoryId: 'shopping' }],
  ['재킷 사는 데 20만원 썼어', { kind: 'transaction', amount: 200000, categoryId: 'shopping' }],
  ['제일 비싼 커피 7000원', { kind: 'transaction', amount: 7000, categoryId: 'dining' }],
  ['더 큰 피자 25000원', { kind: 'transaction', amount: 25000, categoryId: 'dining' }],
  ['제일 큰 피자 2만5천원', { kind: 'transaction', amount: 25000, categoryId: 'dining' }],
  ['지난달보다 비싼 월세 55만원 냈어', { kind: 'transaction', amount: 550000, categoryId: 'rent' }],
  ['월세 비교해보고 55만원 냈어', { kind: 'transaction', amount: 550000, categoryId: 'rent' }],
  ['써도 되는 돈 5만원 받았어', { kind: 'transaction', type: 'income', amount: 50000 }],
  ['14000원 점심', { kind: 'transaction', amount: 14000, categoryId: 'dining' }],
];

describe('Korean corrections', () => runCases('ko', corrections, labels));
describe('Korean sentences that are not corrections', () => runCases('ko', notCorrections, labels));
describe('Korean: comparing, the most, affording', () => runCases('ko', insights, labels));
describe('Korean: entries near those words stay entries', () => runCases('ko', insightsStayEntries, labels));

// ---------------------------------------------------------------------------------------------
// A second sweep of everyday speech: dictation without punctuation, 반말 and 해요체 mixed, 줄임말.

/** Putting money aside. With no goal of that name it is a savings entry. */
const savingEntries: Case[] = [
  ['20만원 저축했어', { kind: 'transaction', type: 'expense', amount: 200000, categoryId: 'savings' }],
  ['여행 가려고 10만원 따로 빼놨어', { kind: 'transaction', type: 'expense', amount: 100000, categoryId: 'savings' }],
  ['적금에 30만원 넣었어', { kind: 'transaction', type: 'expense', amount: 300000, categoryId: 'savings' }],
  ['오늘 5천원 모았어', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'savings' }],
  ['비자금 5만원', { kind: 'transaction', type: 'expense', amount: 50000, categoryId: 'savings' }],
  ['청약 10만원 냈어', { kind: 'transaction', type: 'expense', amount: 100000, categoryId: 'savings' }],
  ['주식 50만원 샀어', { kind: 'transaction', type: 'expense', amount: 500000, categoryId: 'savings' }],
  ['예금에 100만원 넣었어', { kind: 'transaction', type: 'expense', amount: 1000000, categoryId: 'savings' }],
  ['파킹통장에 50만원 옮겼어', { kind: 'transaction', type: 'expense', amount: 500000, categoryId: 'savings' }],
  ['저축 30만원', { kind: 'transaction', type: 'expense', amount: 300000, categoryId: 'savings' }],
];

/** An amount per month or week is a pace, not the goal's total: the card asks for the total. */
const pacedGoals: Case[] = [
  ['차 사려고 매달 20만원씩 모으고 싶어', { kind: 'goal', amount: null, goalKind: 'saving', goalName: '차' }],
  ['매달 50만원씩 저축하고 싶어', { kind: 'goal', amount: null, goalKind: 'saving' }],
  ['한 달에 20만원 모으기', { kind: 'goal', amount: null, goalKind: 'saving' }],
  ['매주 5만원씩 모으려고', { kind: 'goal', amount: null, goalKind: 'saving' }],
  ['노트북 사려고 다달이 10만원씩 모을래', { kind: 'goal', amount: null, goalKind: 'saving', goalName: '노트북' }],
  // The total said as a total stays one.
  ['차 사려고 500만원 모으고 싶어', { kind: 'goal', amount: 5000000, goalKind: 'saving', goalName: '차' }],
];

const moreExpenses: Case[] = [
  ['점심 만 2천원', { kind: 'transaction', type: 'expense', amount: 12000, categoryId: 'dining' }],
  ['편의점에서 8천원', { type: 'expense', amount: 8000, categoryId: 'groceries' }],
  ['점심에 만원 썼어', { type: 'expense', amount: 10000, categoryId: 'dining' }],
  ['기름 가득 5만원', { type: 'expense', amount: 50000, categoryId: 'transport' }],
  ['전기세 냈어 8만원', { type: 'expense', amount: 80000, categoryId: 'utilities' }],
  ['월세 보냈어 90만원', { type: 'expense', amount: 900000, categoryId: 'rent' }],
  ['회식에 4만원', { type: 'expense', amount: 40000, categoryId: 'dining' }],
  ['택시 2만원', { type: 'expense', amount: 20000, categoryId: 'transport' }],
  ['스벅 6천원', { type: 'expense', amount: 6000, categoryId: 'dining' }],
  ['유니클로에서 5만원', { type: 'expense', amount: 50000, categoryId: 'shopping' }],
  ['병원 3만원', { type: 'expense', amount: 30000, categoryId: 'health' }],
  ['약국 만 5천원', { type: 'expense', amount: 15000, categoryId: 'health' }],
  ['주차 3천원', { type: 'expense', amount: 3000, categoryId: 'transport' }],
  ['통행료 8천원', { type: 'expense', amount: 8000, categoryId: 'transport' }],
  ['애들 학원비 30만원', { type: 'expense', amount: 300000, categoryId: 'other_expense' }],
  ['구독 1만 4900', { type: 'expense', amount: 14900, categoryId: 'subscriptions' }],
  ['쿠팡에서 3만원 질렀어', { type: 'expense', amount: 30000, categoryId: 'shopping' }],
  ['배민 2만원', { type: 'expense', amount: 20000, categoryId: 'dining' }],
  ['동료랑 국밥 9천원', { type: 'expense', amount: 9000, categoryId: 'dining' }],
  ['버스비 1500', { type: 'expense', amount: 1500, categoryId: 'transport' }],
  ['정기권 6만원', { type: 'expense', amount: 60000, categoryId: 'transport' }],
  ['치맥 3만원', { type: 'expense', amount: 30000, categoryId: 'dining' }],
  ['아침에 김밥 3천원', { type: 'expense', amount: 3000, categoryId: 'dining' }],
  ['카카오택시 만 삼천원', { type: 'expense', amount: 13000, categoryId: 'transport' }],
  ['지하철 1400원', { type: 'expense', amount: 1400, categoryId: 'transport' }],
  ['세차 3만원', { type: 'expense', amount: 30000, categoryId: 'transport' }],
  ['안경 15만원', { type: 'expense', amount: 150000, categoryId: 'health' }],
  ['영양제 4만원 샀어', { type: 'expense', amount: 40000, categoryId: 'health' }],
  ['올영에서 2만원', { type: 'expense', amount: 20000, categoryId: 'shopping' }],
  ['강아지 사료 3만원', { type: 'expense', amount: 30000, categoryId: 'shopping' }],
  ['세탁소 만원', { type: 'expense', amount: 10000, categoryId: 'shopping' }],
  ['경조사비 10만원', { type: 'expense', amount: 100000, categoryId: 'other_expense' }],
  ['택배비 3천원', { type: 'expense', amount: 3000, categoryId: 'other_expense' }],
  ['과태료 4만원 냈어', { type: 'expense', amount: 40000, categoryId: 'other_expense' }],
  ['대출 이자 20만원 나갔어', { type: 'expense', amount: 200000, categoryId: 'debt' }],
  ['할부 10만원', { type: 'expense', amount: 100000, categoryId: 'debt' }],
  ['핸드폰 요금 55000원 나갔어', { type: 'expense', amount: 55000, categoryId: 'utilities' }],
  ['넷플 17000', { type: 'expense', amount: 17000, categoryId: 'subscriptions' }],
  ['순댓국 9천원', { type: 'expense', amount: 9000, categoryId: 'dining' }],
];

const moreIncome: Case[] = [
  ['월급 들어왔어 250만원', { kind: 'transaction', type: 'income', amount: 2500000, categoryId: 'salary' }],
  ['월급날', { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ['알바비 30만원', { type: 'income', amount: 300000, categoryId: 'salary' }],
  ['부업으로 50만원 벌었어', { type: 'income', amount: 500000, categoryId: 'freelance' }],
  ['당근에 팔아서 3만원', { type: 'income', amount: 30000, categoryId: 'freelance' }],
  ['환불 2만원', { type: 'income', amount: 20000, categoryId: 'other_income' }],
  ['할머니가 10만원 주셨어', { type: 'income', amount: 100000, categoryId: 'gift_income' }],
  ['보너스 300만원', { type: 'income', amount: 3000000, categoryId: 'salary' }],
  ['환급금 10만원', { type: 'income', amount: 100000, categoryId: 'other_income' }],
  ['세뱃돈 5만원', { type: 'income', amount: 50000, categoryId: 'gift_income' }],
  ['용돈 10만원 받았어', { type: 'income', amount: 100000, categoryId: 'gift_income' }],
  ['엄마한테 용돈 20만원 받았어', { type: 'income', amount: 200000, categoryId: 'gift_income' }],
  ['월급 들어옴 280만원', { type: 'income', amount: 2800000, categoryId: 'salary' }],
  ['상여금 150만원', { type: 'income', amount: 1500000, categoryId: 'salary' }],
  ['과외비 40만원 받았어', { type: 'income', amount: 400000, categoryId: 'freelance' }],
  ['중고로 팔아서 5만원', { type: 'income', amount: 50000, categoryId: 'freelance' }],
  ['배당금 5만원 들어왔어', { type: 'income', amount: 50000, categoryId: 'other_income' }],
  ['장학금 100만원', { type: 'income', amount: 1000000, categoryId: 'other_income' }],
  ['이자 만원', { type: 'income', amount: 10000, categoryId: 'other_income' }],
  ['친구가 2만원 보내줬어', { type: 'income', amount: 20000 }],
];

const moreQuestions: Case[] = [
  ['이번 주에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['얼마나 남았지', { kind: 'question', question: { ask: 'left', target: null } }],
  ['외식 얼마 남았어', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['지난달보다 더 썼나', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['이번 달에 어디에 제일 많이 썼어', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['제일 큰 지출이 뭐야', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['지난 수요일에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: null } }],
  ['지난 수요일에 스타벅스에서 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: '스타벅스' } }],
  ['지난달 가장 큰 지출은 뭐야', { kind: 'question', question: { ask: 'biggest', period: 'lastMonth', target: null } }],
  ['8만원짜리 신발 살 수 있어', { kind: 'question', question: { ask: 'afford', price: 80000, target: '신발', fallbackCategoryId: 'shopping' } }],
  ['이번 달에 얼마 벌었지', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['커피에 이번 달 얼마', { kind: 'question', question: { ask: 'spent', period: 'month', target: '커피', fallbackCategoryId: 'dining' } }],
  ['오늘 얼마나 썼어', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['이번 주 외식에 얼마 썼지', { kind: 'question', question: { ask: 'spent', period: 'week', categoryId: 'dining' } }],
  ['지난주 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: null } }],
  ['이번 달 교통비 얼마 나갔어', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'transport' } }],
  ['편의점에서 얼마 썼어', { kind: 'question', question: { ask: 'spent', target: '편의점', fallbackCategoryId: 'groceries' } }],
  ['배민에 이번 달 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'month', target: '배민', fallbackCategoryId: 'dining' } }],
  ['최근 3일 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'recentDays', days: 3, target: null } }],
  ['주말에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } }],
  ['구독료 얼마 나가', { kind: 'question', question: { ask: 'spent', categoryId: 'subscriptions' } }],
  ['이번 달 얼마 썼더라', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['남은 돈 얼마', { kind: 'question', question: { ask: 'left', target: null } }],
  ['이번 달 얼마나 남았어', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['교통비 얼마 남았어', { kind: 'question', question: { ask: 'left', categoryId: 'transport' } }],
  ['쇼핑 예산 남았어?', { kind: 'question', question: { ask: 'left', categoryId: 'shopping' } }],
  ['얼마 더 쓸 수 있어', { kind: 'question', question: { ask: 'left', target: null } }],
  ['저번 주보다 많이 썼어?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['지난달이랑 비교하면 어때', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['이번 달 뭐에 가장 많이 썼어', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['어디에 돈 제일 많이 나갔어', { kind: 'question', question: { ask: 'top', target: null } }],
  ['5만원짜리 신발 사도 돼', { kind: 'question', question: { ask: 'afford', price: 50000, target: '신발' } }],
  ['10만원 써도 괜찮아', { kind: 'question', question: { ask: 'afford', price: 100000, target: null } }],
  ['외식에 3만원 써도 돼', { kind: 'question', question: { ask: 'afford', price: 30000, categoryId: 'dining' } }],
  ['배달 시켜도 돼?', { kind: 'question', question: { ask: 'left', fallbackCategoryId: 'dining' } }],
  ['지출 얼마야 이번 주', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['택시에 이번 주 얼마', { kind: 'question', question: { ask: 'spent', period: 'week', target: '택시', fallbackCategoryId: 'transport' } }],
];

const moreCorrections: Case[] = [
  ['아니 만 4천원이었어', { kind: 'correction', correction: { amount: 14000, remove: false } }],
  ['외식으로 바꿔', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['어제 거였어', { kind: 'correction', correction: { date: '2026-09-15', amount: null, categoryId: null } }],
  ['어제 거야', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['방금 거 지워', { kind: 'correction', correction: { remove: true, target: null } }],
  ['택시 지워', { kind: 'correction', correction: { remove: true, target: '택시' } }],
  ['방금 스벅 거 삭제해줘', { kind: 'correction', correction: { remove: true, target: '스벅' } }],
  ['넷플릭스 취소해 줘', { kind: 'correction', correction: { remove: true, target: '넷플릭스' } }],
  ['점심 내역 지워줘', { kind: 'correction', correction: { remove: true, target: '점심' } }],
  ['점심 만 5천원으로 고쳐', { kind: 'correction', correction: { amount: 15000, categoryId: 'dining' } }],
  ['택시 2만3천원 아니고 3만2천원', { kind: 'correction', correction: { target: '택시', amount: 32000, remove: false } }],
  ['점심 만 2천원이 아니라 만 4천원이었어', { kind: 'correction', correction: { target: '점심', amount: 14000 } }],
  ['아니 3만원이야', { kind: 'correction', correction: { amount: 30000 } }],
  ['그거 2만원으로', { kind: 'correction', correction: { amount: 20000 } }],
  ['카테고리 건강으로', { kind: 'correction', correction: { categoryId: 'health' } }],
  ['방금 거 어제로 바꿔줘', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['그제 거였어', { kind: 'correction', correction: { date: '2026-09-14' } }],
];

const moreReminders: Case[] = [
  ['1일에 월세 알려줘', { kind: 'reminder', occurredAt: '2026-10-01' }],
  ['금요일에 전기세 잊지 않게 해줘', { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['8시에 영수증 입력하라고 알려줘', { kind: 'reminder', reminderTime: '08:00', occurredAt: '2026-09-17' }],
  ['매주 월요일 예산 확인 알림', { kind: 'reminder', reminderRepeat: 'weekly', occurredAt: '2026-09-21' }],
  ['내일 아침에 월세 내라고 알려줘', { kind: 'reminder', reminderTime: '08:00', occurredAt: '2026-09-17' }],
  ['매달 1일에 적금 넣으라고 알려줘', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['모레 카드값 알림', { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['다음주 금요일에 보험료 알려줘', { kind: 'reminder', occurredAt: '2026-09-25' }],
  ['매일 저녁 가계부 알림', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '20:00' }],
  ['오후 3시에 공과금 내라고 알려줘', { kind: 'reminder', reminderTime: '15:00' }],
  ['저녁 7시 반에 지출 정리하라고 알려줘', { kind: 'reminder', reminderTime: '19:30' }],
  ['토요일 아침에 장보기 알림', { kind: 'reminder', occurredAt: '2026-09-19', reminderTime: '08:00' }],
  ['25일 카드값 리마인드', { kind: 'reminder', occurredAt: '2026-09-25' }],
];

/** Numbers the way people say or type them. */
const numbers: Case[] = [
  ['천이백원', { kind: 'transaction', amount: 1200 }],
  ['1,200원', { kind: 'transaction', amount: 1200 }],
  ['이천오백', { kind: 'transaction', amount: 2500 }],
  ['1.2만', { kind: 'transaction', amount: 12000 }],
  ['만이천', { kind: 'transaction', amount: 12000 }],
  ['12만', { kind: 'transaction', amount: 120000 }],
  ['오천원', { kind: 'transaction', amount: 5000 }],
  ['만원짜리 커피', { kind: 'transaction', amount: 10000, categoryId: 'dining' }],
  ['점심 1.5만원', { kind: 'transaction', amount: 15000, categoryId: 'dining' }],
  ['커피 4천5백원', { kind: 'transaction', amount: 4500, categoryId: 'dining' }],
  ['택시 2만 5천원', { kind: 'transaction', amount: 25000, categoryId: 'transport' }],
  ['옷 삼만원', { kind: 'transaction', amount: 30000, categoryId: 'shopping' }],
  ['월급 1,500,000원', { kind: 'transaction', type: 'income', amount: 1500000, categoryId: 'salary' }],
  ['점심 만 원', { kind: 'transaction', amount: 10000, categoryId: 'dining' }],
  ['커피 3천', { kind: 'transaction', amount: 3000, categoryId: 'dining' }],
  ['점심 12,000', { kind: 'transaction', amount: 12000, categoryId: 'dining' }],
  ['십만원 저축', { kind: 'transaction', amount: 100000, categoryId: 'savings' }],
  ['월세 백만원', { kind: 'transaction', amount: 1000000, categoryId: 'rent' }],
  ['천오백원 버스', { kind: 'transaction', amount: 1500, categoryId: 'transport' }],
];

/** Question-like or correction-like words beside an amount: still an entry. */
const stayEntries: Case[] = [
  ['커피 총 9천원', { kind: 'transaction', amount: 9000, categoryId: 'dining' }],
  ['이번 달 구독 합계 5만원', { kind: 'transaction', amount: 50000, categoryId: 'subscriptions' }],
  ['남은 돈으로 치킨 2만원', { kind: 'transaction', amount: 20000, categoryId: 'dining' }],
  ['제일 싼 커피 2천원', { kind: 'transaction', amount: 2000, categoryId: 'dining' }],
  ['얼마 전에 산 신발 8만원', { kind: 'transaction', amount: 80000, categoryId: 'shopping' }],
  ['많이 썼네 오늘 5만원', { kind: 'transaction', amount: 50000 }],
  ['넷플릭스 구독 취소 13500원', { kind: 'transaction', amount: 13500 }],
  ['택시 2만원이었어', { kind: 'transaction', amount: 20000, categoryId: 'transport' }],
  ['매달 넷플릭스 17000원', { kind: 'transaction', amount: 17000, categoryId: 'subscriptions' }],
  ['아니 택시 2만원 탔어', { kind: 'transaction', amount: 20000, categoryId: 'transport' }],
];

describe('Korean: putting money aside', () => runCases('ko', savingEntries, labels));
describe('Korean: goals said as an amount per month', () => runCases('ko', pacedGoals, labels));
describe('Korean: more expenses', () => runCases('ko', moreExpenses, labels));
describe('Korean: more income', () => runCases('ko', moreIncome, labels));
describe('Korean: more questions', () => runCases('ko', moreQuestions, labels));
describe('Korean: more corrections', () => runCases('ko', moreCorrections, labels));
describe('Korean: more reminders', () => runCases('ko', moreReminders, labels));
describe('Korean: numbers as said', () => runCases('ko', numbers, labels));
describe('Korean: entries that stay entries', () => runCases('ko', stayEntries, labels));

const moreKoContributions: [string, string, number][] = [
  ['일본 여행 통장에 2만원 보탰어', 'k1', 20000],
  ['비상금으로 10만원 넣음', 'k2', 100000],
  ['일본 여행 가려고 10만원 따로 빼놨어', 'k1', 100000],
  ['비상금에 5만원 더 넣었어', 'k2', 50000],
  ['일본여행 적금 20만원 넣었어', 'k1', 200000],
];

describe('Korean phrasings: more contributions to a goal named in Korean', () => {
  it.each(moreKoContributions)('%s', (text, goalId, amount) => {
    const r = parseOne(text, 'ko', labels, KO_GOALS);
    expect(r).toHaveLength(1);
    expect({ kind: r[0].kind, goalId: r[0].goalId, amount: r[0].amount }).toEqual({ kind: 'contribution', goalId, amount });
  });
});

/** Misreads a reviewer reproduced: a tip given, "아니 잠깐", terse questions, a reminder losing its first syllable, lone particles in notes. */
const reviewedMisreads: Case[] = [
  // A tip is money at the table; only "받았어" makes it income.
  ['팁 만원', { kind: 'transaction', type: 'expense', amount: 10000, categoryId: 'dining' }],
  ['팁 5천원 줬어', { kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'dining' }],
  ['팁으로 5천원 받았어', { kind: 'transaction', type: 'income', amount: 5000 }],
  ['아니 잠깐, 15000', { kind: 'correction', correction: { amount: 15000 } }],
  ['잠깐, 15000', { kind: 'correction', correction: { amount: 15000 } }],
  // "not 45000 but 54000", with nothing named: the number after 아니고 is the new one.
  ['45000이 아니고 54000', { kind: 'correction', correction: { amount: 54000 } }],
  ['커피값은?', { kind: 'question', question: { ask: 'spent', fallbackCategoryId: 'dining' } }],
  ['식비 괜찮아?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  // The particle strip never takes the 은 of 은행 or the 이 of 이마트.
  ['내일 7시 반에 은행에 전화하라고 알려줘', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '07:30', reminderText: '은행에 전화' }],
  ['내일 은행 가라고 알려줘', { kind: 'reminder', occurredAt: '2026-09-17', reminderText: '은행 가' }],
  ['내일 이마트 가라고 알려줘', { kind: 'reminder', occurredAt: '2026-09-17', reminderText: '이마트 가' }],
  // Two weeks back and a weekday: one entry on that week's Tuesday, the count never an amount.
  ['2주 전 화요일에 동물병원 8만원', { kind: 'transaction', amount: 80000, categoryId: 'health', occurredAt: '2026-09-01', note: '동물병원' }],
  ['월요일에 주차 12000원', { kind: 'transaction', amount: 12000, categoryId: 'transport', occurredAt: '2026-09-14', note: '주차' }],
  ['오천원짜리 커피', { kind: 'transaction', amount: 5000, categoryId: 'dining', note: '커피' }],
];

describe('Korean phrasings: reviewed misreads', () => runCases('ko', reviewedMisreads, labels));

/** "저녁 4만원에 팁 5천원": the tip is the second entry, and it is spending too. */
describe('Korean phrasings: a tip after the meal', () => {
  it('splits into two dining entries', () => {
    const r = parseOne('저녁 4만원에 팁 5천원', 'ko', labels);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 40000, categoryId: 'dining' });
    expect(r[1]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 5000, categoryId: 'dining' });
  });
});

/**
 * Waiting on the parser core: trailing digits before a counter ("GS25 3500", "90만 1일"), "3.5천" as a digit-and-scale run,
 * a named month as a question period (`question.monthNames` is already in the pack), and the pack hook that keeps a bare
 * pay noun after "지난" from making an entry income ("월급날" is a salary keyword and wins over "마트" by length).
 * Un-skip once the core change is merged.
 */
describe('after core merge', () => {
  const pending: Case[] = [
    ['GS25 3500', { kind: 'transaction', amount: 3500, categoryId: 'groceries' }],
    ['월세 90만 1일', { kind: 'transaction', amount: 900000, categoryId: 'rent', occurredAt: '2026-09-01' }],
    ['3.5천원', { kind: 'transaction', amount: 3500 }],
    ['8월에 얼마 썼어', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
    ['지난 월급날에 마트 4만원', { kind: 'transaction', type: 'expense', amount: 40000, categoryId: 'groceries' }],
  ];
  runCases('ko', pending, labels);
});
