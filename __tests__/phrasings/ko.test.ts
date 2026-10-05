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
