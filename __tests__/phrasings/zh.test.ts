/**
 * Chinese: the everyday ways people say the same thing, mostly Simplified
 * (Mainland) with some Traditional (Taiwan / Hong Kong) variants, casual and
 * neutral, with amounts written as 35块 / 35元 / 三十五块 / 1.5万.
 * Categories are passed with their Chinese names, as the app does.
 */
import { zh } from '@/i18n/locales/zh';
import type { Goal } from '@/types';
import { GOALS, parseOne, runCases, type Case } from './harness';

const labels = zh.s.categoryNames as Record<string, string>;
const FOOD = ['groceries', 'dining'];

const expenses: Case[] = [
  // eating and drinking out
  ['午饭花了35', { kind: 'transaction', type: 'expense', amount: 35, categoryId: 'dining' }],
  ['午饭35块', { kind: 'transaction', type: 'expense', amount: 35, categoryId: 'dining' }],
  ['午饭三十五块', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['中午吃饭花了35块', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['咖啡30块', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['买了杯咖啡30', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['星巴克38', { type: 'expense', amount: 38, categoryId: 'dining' }],
  ['瑞幸9块9', { type: 'expense', amount: 9.9, categoryId: 'dining' }],
  ['点外卖花了45', { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['叫了个外卖45元', { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['晚饭吃了一百二', { type: 'expense', amount: 120, categoryId: 'dining' }],
  ['早餐十五块', { type: 'expense', amount: 15, categoryId: 'dining' }],
  ['奶茶18', { type: 'expense', amount: 18, categoryId: 'dining' }],
  ['跟朋友吃火锅人均150', { type: 'expense', amount: 150, categoryId: 'dining' }],
  ['请同事吃饭花了300', { type: 'expense', amount: 300, categoryId: 'dining' }],
  ['喝酒花了200', { type: 'expense', amount: 200, categoryId: 'dining' }],
  ['晚饭花了¥128', { type: 'expense', amount: 128, categoryId: 'dining' }],
  ['下馆子花了260', { type: 'expense', amount: 260, categoryId: 'dining' }],
  // groceries
  ['超市买菜200', { type: 'expense', amount: 200, categoryId: 'groceries' }],
  ['去超市花了156.5', { type: 'expense', amount: 156.5, categoryId: 'groceries' }],
  ['买菜花了八十', { type: 'expense', amount: 80, categoryId: 'groceries' }],
  ['盒马买了些水果89', { type: 'expense', amount: 89, categoryId: 'groceries' }],
  ['在菜市场买肉60', { type: 'expense', amount: 60, categoryId: 'groceries' }],
  ['买了一箱牛奶65', { type: 'expense', amount: 65, categoryId: 'groceries' }],
  // getting around
  ['加油300', { type: 'expense', amount: 300, categoryId: 'transport' }],
  ['加油两百块', { type: 'expense', amount: 200, categoryId: 'transport' }],
  ['打车花了50', { type: 'expense', amount: 50, categoryId: 'transport' }],
  ['打车二十八元', { type: 'expense', amount: 28, categoryId: 'transport' }],
  ['滴滴38块', { type: 'expense', amount: 38, categoryId: 'transport' }],
  ['地铁卡充了100', { type: 'expense', amount: 100, categoryId: 'transport' }],
  ['停车费15', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['高铁票553', { type: 'expense', amount: 553, categoryId: 'transport' }],
  ['坐地铁花了6块', { type: 'expense', amount: 6, categoryId: 'transport' }],
  // home and bills
  ['交了房租3000', { type: 'expense', amount: 3000, categoryId: 'rent' }],
  ['房租三千五', { type: 'expense', amount: 3500, categoryId: 'rent' }],
  ['这个月房贷还了6000', { type: 'expense', amount: 6000, categoryId: 'rent' }],
  ['物业费1200', { type: 'expense', amount: 1200, categoryId: 'rent' }],
  ['话费100', { type: 'expense', amount: 100, categoryId: 'utilities' }],
  ['充话费50', { type: 'expense', amount: 50, categoryId: 'utilities' }],
  ['交电费200', { type: 'expense', amount: 200, categoryId: 'utilities' }],
  ['水电费一共两百三', { type: 'expense', amount: 230, categoryId: 'utilities' }],
  ['宽带一年1200', { type: 'expense', amount: 1200, categoryId: 'utilities' }],
  // health
  ['买药花了68', { type: 'expense', amount: 68, categoryId: 'health' }],
  ['去医院看病花了500', { type: 'expense', amount: 500, categoryId: 'health' }],
  ['健身房年卡2000', { type: 'expense', amount: 2000, categoryId: 'health' }],
  ['挂号费50', { type: 'expense', amount: 50, categoryId: 'health' }],
  // fun
  ['看电影花了80', { type: 'expense', amount: 80, categoryId: 'entertainment' }],
  ['电影票两张90', { type: 'expense', amount: 90, categoryId: 'entertainment' }],
  ['唱K花了300', { type: 'expense', amount: 300, categoryId: 'entertainment' }],
  ['买了个游戏皮肤68', { type: 'expense', amount: 68, categoryId: 'entertainment' }],
  ['演唱会门票1280', { type: 'expense', amount: 1280, categoryId: 'entertainment' }],
  // shopping
  ['淘宝买衣服299', { type: 'expense', amount: 299, categoryId: 'shopping' }],
  ['买了双鞋599', { type: 'expense', amount: 599, categoryId: 'shopping' }],
  ['京东下单花了1999', { type: 'expense', amount: 1999, categoryId: 'shopping' }],
  ['网购了一个充电器89', { type: 'expense', amount: 89, categoryId: 'shopping' }],
  ['买了个手机1.2万', { type: 'expense', amount: 12000, categoryId: 'shopping' }],
  ['拼多多下单39.9', { type: 'expense', amount: 39.9, categoryId: 'shopping' }],
  // subscriptions
  ['爱奇艺会员25', { type: 'expense', amount: 25, categoryId: 'subscriptions' }],
  ['续费了腾讯视频会员30', { type: 'expense', amount: 30, categoryId: 'subscriptions' }],
  ['开了个B站大会员148', { type: 'expense', amount: 148, categoryId: 'subscriptions' }],
  // paying debts (a payment that happened, not a goal)
  ['还了信用卡2000', { kind: 'transaction', type: 'expense', amount: 2000, categoryId: 'debt' }],
  ['还花呗1500', { kind: 'transaction', type: 'expense', amount: 1500, categoryId: 'debt' }],
  ['信用卡还款3000', { kind: 'transaction', type: 'expense', amount: 3000, categoryId: 'debt' }],
  // everything else
  ['寄快递12', { type: 'expense', amount: 12, categoryId: 'other_expense' }],
  ['随份子500', { type: 'expense', amount: 500, categoryId: 'other_expense' }],
  ['给爸妈转了2000', { type: 'expense', amount: 2000 }],
  // Traditional (Taiwan / Hong Kong)
  ['搭計程車花了250', { type: 'expense', amount: 250, categoryId: 'transport' }],
  ['捷運50', { type: 'expense', amount: 50, categoryId: 'transport' }],
  ['全聯買菜800', { type: 'expense', amount: 800, categoryId: 'groceries' }],
  ['電費1500', { type: 'expense', amount: 1500, categoryId: 'utilities' }],
  ['晚餐花了三百', { type: 'expense', amount: 300, categoryId: 'dining' }],
  ['手機費499', { type: 'expense', amount: 499, categoryId: 'utilities' }],
  ['繳了房租12000', { type: 'expense', amount: 12000, categoryId: 'rent' }],
  ['看醫生花了300', { type: 'expense', amount: 300, categoryId: 'health' }],
  ['買了一件外套2990', { type: 'expense', amount: 2990, categoryId: 'shopping' }],
  ['搭的士用咗80蚊', { type: 'expense', amount: 80, categoryId: 'transport' }],
  ['食飯使咗200', { type: 'expense', amount: 200, categoryId: 'dining' }],
];

const income: Case[] = [
  ['发工资了8000', { kind: 'transaction', type: 'income', amount: 8000, categoryId: 'salary' }],
  ['工资到账12000', { type: 'income', amount: 12000, categoryId: 'salary' }],
  ['这个月工资发了9500', { type: 'income', amount: 9500, categoryId: 'salary' }],
  ['发工资啦 8000', { type: 'income', amount: 8000, categoryId: 'salary' }],
  ['年终奖发了2万', { type: 'income', amount: 20000, categoryId: 'salary' }],
  ['发奖金5000', { type: 'income', amount: 5000, categoryId: 'salary' }],
  ['收到红包200', { type: 'income', amount: 200, categoryId: 'gift_income' }],
  ['过年收了压岁钱2000', { type: 'income', amount: 2000, categoryId: 'gift_income' }],
  ['老妈给了我1000', { type: 'income', amount: 1000, categoryId: 'gift_income' }],
  ['闲鱼卖了个旧手机300', { type: 'income', amount: 300 }],
  ['卖了二手家具1500', { type: 'income', amount: 1500 }],
  ['退款50', { type: 'income', amount: 50, categoryId: 'other_income' }],
  ['淘宝退款了89', { type: 'income', amount: 89, categoryId: 'other_income' }],
  ['报销了差旅费1200', { type: 'income', amount: 1200, categoryId: 'other_income' }],
  ['接私活赚了3000', { type: 'income', amount: 3000, categoryId: 'freelance' }],
  ['兼职收入800', { type: 'income', amount: 800, categoryId: 'freelance' }],
  ['稿费到了1500', { type: 'income', amount: 1500, categoryId: 'freelance' }],
  ['利息到账12.5', { type: 'income', amount: 12.5, categoryId: 'other_income' }],
  ['朋友还我500', { type: 'income', amount: 500, categoryId: 'other_income' }],
  ['微信收款200', { type: 'income', amount: 200 }],
  ['收到转账500', { type: 'income', amount: 500 }],
  ['股票分红300', { type: 'income', amount: 300, categoryId: 'other_income' }],
  // Traditional
  ['領薪水了45000', { type: 'income', amount: 45000, categoryId: 'salary' }],
  ['薪水入帳52000', { type: 'income', amount: 52000, categoryId: 'salary' }],
  ['公司發了年終獎金3萬', { type: 'income', amount: 30000, categoryId: 'salary' }],
  ['收到紅包600', { type: 'income', amount: 600, categoryId: 'gift_income' }],
];

const spentQuestions: Case[] = [
  ['这个月花了多少', { kind: 'question', question: { ask: 'spent', type: 'expense', period: 'month', target: null } }],
  ['这个月花了多少钱？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['这个月我花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['我这周花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['这礼拜花了多少', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['今天花了多少', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['今天用了多少钱', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['昨天一共花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: null } }],
  ['上个月总共花了多少', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', target: null } }],
  ['去年一共花了多少', { kind: 'question', question: { ask: 'spent', period: 'lastYear', target: null } }],
  ['到现在为止一共花了多少', { kind: 'question', question: { ask: 'spent', period: 'all', target: null } }],
  ['这个月的开销是多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['这个月支出多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['本月消费了多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['本月开支多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['这周咖啡花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'week', target: '咖啡', fallbackCategoryId: 'dining' } }],
  ['这个月在星巴克上花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: '星巴克', fallbackCategoryId: 'dining' } }],
  ['我在淘宝上花了多少钱', { kind: 'question', question: { ask: 'spent', periodDefaulted: true, target: '淘宝', fallbackCategoryId: 'shopping' } }],
  ['今年打车花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'year', target: '打车', fallbackCategoryId: 'transport' } }],
  ['这个月外卖一共多少钱', { kind: 'question', question: { ask: 'spent', period: 'month', target: '外卖', fallbackCategoryId: 'dining' } }],
  ['上周买菜用了多少', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: '买菜', fallbackCategoryId: 'groceries' } }],
  ['衣服这个月花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'month', target: '衣服', fallbackCategoryId: 'shopping' } }],
  ['这个月餐饮花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: '餐饮', fallbackCategoryId: 'dining' } }],
  ['交通费这个月花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', fallbackCategoryId: 'transport' } }],
  ['上个月交通花了多少', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryId: 'transport' } }],
  ['这个月娱乐花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'entertainment' } }],
  // "food" is groceries and eating out together
  ['吃饭花了多少', { kind: 'question', question: { ask: 'spent', categoryIds: FOOD } }],
  ['上周吃的花了多少', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', categoryIds: FOOD } }],
  ['这个月花在吃饭上的钱有多少', { kind: 'question', question: { ask: 'spent', period: 'month', categoryIds: FOOD } }],
  ['这个月在吃上花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', categoryIds: FOOD } }],
  ['这个月花了多少钱在吃的上面', { kind: 'question', question: { ask: 'spent', period: 'month', categoryIds: FOOD } }],
  // since payday
  ['发工资以来花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['这个发薪周期花了多少', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['发工资到现在花了多少', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  // no "how much", but nothing else it could mean
  ['这个月的开销', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['本月支出', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['咖啡的开销', { kind: 'question', question: { ask: 'spent', target: '咖啡', fallbackCategoryId: 'dining' } }],
  ['这周咖啡花了几块钱', { kind: 'question', question: { ask: 'spent', period: 'week', target: '咖啡' } }],
  // Traditional
  ['這個月花了多少錢？', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['這禮拜在咖啡上花了多少', { kind: 'question', question: { ask: 'spent', period: 'week', target: '咖啡' } }],
  ['這個月外食花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: '外食', fallbackCategoryId: 'dining' } }],
  ['上個月交通花了多少錢', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryId: 'transport' } }],
];

const leftQuestions: Case[] = [
  ['还剩多少', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['还剩多少钱？', { kind: 'question', question: { ask: 'left', target: null } }],
  ['预算还剩多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['这个月还剩多少钱', { kind: 'question', question: { ask: 'left', target: null } }],
  ['本月预算还有多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['这个月还能花多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['还有多少可以花', { kind: 'question', question: { ask: 'left', target: null } }],
  ['我还有多少钱能花', { kind: 'question', question: { ask: 'left', target: null } }],
  ['还剩多少可以花', { kind: 'question', question: { ask: 'left', target: null } }],
  ['我现在还有多少钱', { kind: 'question', question: { ask: 'left', target: null } }],
  ['离发工资还剩多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['到发工资前还能花多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['超预算了吗', { kind: 'question', question: { ask: 'left', target: null } }],
  ['这个月超支了没有', { kind: 'question', question: { ask: 'left', target: null } }],
  ['预算够不够', { kind: 'question', question: { ask: 'left', target: null } }],
  ['钱还够花吗', { kind: 'question', question: { ask: 'left', target: null } }],
  ['我的余额是多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['吃饭还能花多少', { kind: 'question', question: { ask: 'left', categoryIds: FOOD } }],
  ['吃饭超预算了没有', { kind: 'question', question: { ask: 'left', categoryIds: FOOD } }],
  ['交通预算还剩多少', { kind: 'question', question: { ask: 'left', categoryId: 'transport' } }],
  ['娱乐还能花多少钱', { kind: 'question', question: { ask: 'left', categoryId: 'entertainment' } }],
  ['外卖预算还剩多少', { kind: 'question', question: { ask: 'left', target: '外卖', fallbackCategoryId: 'dining' } }],
  ['买菜的预算还有多少', { kind: 'question', question: { ask: 'left', target: '买菜', fallbackCategoryId: 'groceries' } }],
  // Traditional
  ['這個月還剩多少錢', { kind: 'question', question: { ask: 'left', target: null } }],
  ['預算還夠嗎', { kind: 'question', question: { ask: 'left', target: null } }],
  ['還可以花多少', { kind: 'question', question: { ask: 'left', target: null } }],
];

const incomeQuestions: Case[] = [
  ['这个月赚了多少', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['这个月收入多少', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['上个月进账多少', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['今年一共赚了多少钱', { kind: 'question', question: { type: 'income', period: 'year' } }],
  ['这个月工资多少', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['这个月收了多少钱', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['这周进了多少钱', { kind: 'question', question: { type: 'income', period: 'week' } }],
  ['上个月挣了多少', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['今年收入一共多少', { kind: 'question', question: { type: 'income', period: 'year' } }],
  ['这个月兼职赚了多少', { kind: 'question', question: { type: 'income', period: 'month', categoryId: 'freelance' } }],
  ['這個月賺了多少錢', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['今年收入有多少', { kind: 'question', question: { type: 'income', period: 'year' } }],
];

const goals: Case[] = [
  ['我想存3000去旅行', { kind: 'goal', goalKind: 'saving', amount: 3000 }],
  ['想攒钱买车 目标5万', { kind: 'goal', goalKind: 'saving', amount: 50000 }],
  ['存钱目标：一万块', { kind: 'goal', goalKind: 'saving', amount: 10000 }],
  ['我要攒两万块买电脑', { kind: 'goal', goalKind: 'saving', amount: 20000 }],
  ['打算年底前存够5万', { kind: 'goal', goalKind: 'saving', amount: 50000 }],
  ['今年想存下10万', { kind: 'goal', goalKind: 'saving', amount: 100000 }],
  ['给自己定个目标，存5000应急', { kind: 'goal', goalKind: 'saving', amount: 5000 }],
  ['想买个iPhone，需要存8000', { kind: 'goal', goalKind: 'saving', amount: 8000 }],
  ['攒钱买房 首付目标30万', { kind: 'goal', goalKind: 'saving', amount: 300000 }],
  ['新目标：明年夏天之前存2万去日本', { kind: 'goal', goalKind: 'saving', amount: 20000 }],
  ['我想存錢去日本 目標5萬', { kind: 'goal', goalKind: 'saving', amount: 50000 }],
  // paying a debt down
  ['想还清信用卡2000', { kind: 'goal', goalKind: 'debt', amount: 2000 }],
  ['我欠信用卡2万', { kind: 'goal', goalKind: 'debt', amount: 20000 }],
  ['打算三个月内还完花呗6000', { kind: 'goal', goalKind: 'debt', amount: 6000 }],
  ['年底前把车贷还清 还剩5万', { kind: 'goal', goalKind: 'debt', amount: 50000 }],
  ['目标：还清网贷1.5万', { kind: 'goal', goalKind: 'debt', amount: 15000 }],
  ['我要还掉借呗的8000', { kind: 'goal', goalKind: 'debt', amount: 8000 }],
  ['信用卡欠了一万二要还', { kind: 'goal', goalKind: 'debt', amount: 12000 }],
  ['我還欠信用卡3萬', { kind: 'goal', goalKind: 'debt', amount: 30000 }],
  ['还款目标：信用卡2万', { kind: 'goal', goalKind: 'debt', amount: 20000 }],
  ['目标：年底前还款5000', { kind: 'goal', goalKind: 'debt', amount: 5000 }],
];

const reminders: Case[] = [
  ['提醒我明天交房租', { kind: 'reminder' }],
  ['记得提醒我每月1号还信用卡', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['netflix 60 每月', { kind: 'transaction', amount: 60, categoryId: 'subscriptions', repeat: 'monthly' }],
  ['房租 3000 每个月', { kind: 'transaction', amount: 3000, categoryId: 'rent', repeat: 'monthly' }],
  ['健身房 200 每周', { kind: 'transaction', amount: 200, repeat: 'weekly' }],
  ['保险 6000 每年', { kind: 'transaction', amount: 6000, repeat: 'yearly' }],
  ['别让我忘了周五交电费', { kind: 'reminder' }],
  ['设个提醒，每周日记账', { kind: 'reminder', reminderRepeat: 'weekly' }],
  ['明天早上9点提醒我交水费', { kind: 'reminder', reminderTime: '09:00' }],
  ['记得周五交话费', { kind: 'reminder' }],
  ['别忘了15号还花呗', { kind: 'reminder' }],
  ['提醒一下我下周一交物业费', { kind: 'reminder' }],
  ['每个月15号提醒我还花呗', { kind: 'reminder', reminderRepeat: 'monthly' }],
  ['帮我设一个提醒：周六去超市', { kind: 'reminder' }],
  ['下午三点提醒我去银行', { kind: 'reminder', reminderTime: '15:00' }],
  ['到时候提醒我交保险', { kind: 'reminder' }],
  ['提醒我明天繳電費', { kind: 'reminder' }],
  ['記得提醒我每個月5號繳卡費', { kind: 'reminder' }],
  ['別讓我忘了禮拜五付房租', { kind: 'reminder' }],
];

describe('zh: expenses', () => runCases('zh', expenses, labels));
describe('zh: income', () => runCases('zh', income, labels));
describe('zh: spending questions', () => runCases('zh', spentQuestions, labels));
describe('zh: what is left', () => runCases('zh', leftQuestions, labels));
describe('zh: income questions', () => runCases('zh', incomeQuestions, labels));
describe('zh: goals', () => runCases('zh', goals, labels));
describe('zh: reminders', () => runCases('zh', reminders, labels));

// A Chinese speaker names goals in Chinese; the harness goal is "Trip to Japan", so these use Chinese names.
const CHINESE_GOALS = [
  { ...GOALS[0], id: 'g1', name: '日本旅行' },
  { ...GOALS[0], id: 'g2', name: '应急基金' },
  { ...GOALS[0], id: 'g3', name: '买车' },
] as Goal[];
const contributions: [string, Record<string, unknown>][] = [
  ['往日本旅行里存了500', { kind: 'contribution', amount: 500, goalId: 'g1' }],
  ['日本旅行存了500', { kind: 'contribution', amount: 500, goalId: 'g1' }],
  ['给日本旅行存500', { kind: 'contribution', amount: 500, goalId: 'g1' }],
  ['为日本旅行攒了500', { kind: 'contribution', amount: 500, goalId: 'g1' }],
  ['日本旅行的钱又存了800', { kind: 'contribution', amount: 800, goalId: 'g1' }],
  ['存了1000到应急基金', { kind: 'contribution', amount: 1000, goalId: 'g2' }],
  ['应急基金加了2000', { kind: 'contribution', amount: 2000, goalId: 'g2' }],
  ['转了1000到应急基金', { kind: 'contribution', amount: 1000, goalId: 'g2' }],
  ['这个月给买车存了3000', { kind: 'contribution', amount: 3000, goalId: 'g3' }],
  ['昨天往买车里存了两千', { kind: 'contribution', amount: 2000, goalId: 'g3', occurredAt: '2026-09-15' }],
  ['往日本旅行裡存了300', { kind: 'contribution', amount: 300, goalId: 'g1' }],
];

describe('zh: paying into a goal', () => {
  it.each(contributions)('%s', (text, expected) => {
    const r = parseOne(text, 'zh', labels, CHINESE_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
  // Some people keep the English name they gave the goal.
  it.each([
    ['往Trip to Japan里存了300', 300],
    ['Trip to Japan存了300块', 300],
  ])('%s', (text, amount) => {
    const r = parseOne(text, 'zh', labels);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kind: 'contribution', amount, goalId: 'g1' });
  });
});

describe('zh: an amount keeps a sentence an entry', () => {
  it.each([
    ['咖啡一共35', 35],
    ['这个月的开销200', 200],
    ['本月支出300', 300],
    ['外卖总共88', 88],
  ])('%s', (text, amount) => {
    const r = parseOne(text, 'zh', labels);
    expect(r[0]).toMatchObject({ kind: 'transaction', amount });
  });
});

describe('zh: a statement missing its amount is still an entry, not a question', () => {
  it.each(['去超市消费', '超市买菜', '交了房租'])('%s', (text) => {
    expect(parseOne(text, 'zh', labels)[0]).toMatchObject({ kind: 'transaction', amount: null });
  });
});

/** Fixing the last entry by voice. Only the new value may follow the lead; anything else is a new entry. */
const CORRECTIONS: Case[] = [
  // a new amount
  ['其实是14块', { kind: 'correction', correction: { remove: false, amount: 14, categoryId: null, date: null } }],
  ['其实是14', { kind: 'correction', correction: { amount: 14 } }],
  ['其實是14塊', { kind: 'correction', correction: { amount: 14 } }],
  ['不对，14块', { kind: 'correction', correction: { amount: 14 } }],
  ['不对，是14', { kind: 'correction', correction: { amount: 14 } }],
  ['不對，14', { kind: 'correction', correction: { amount: 14 } }],
  ['说错了，是15块', { kind: 'correction', correction: { amount: 15 } }],
  ['改成14', { kind: 'correction', correction: { amount: 14, categoryId: null } }],
  ['改成十四块', { kind: 'correction', correction: { amount: 14 } }],
  ['改成14块5', { kind: 'correction', correction: { amount: 14.5 } }],
  ['应该是14', { kind: 'correction', correction: { amount: 14 } }],
  ['應該是14', { kind: 'correction', correction: { amount: 14 } }],
  ['应该14块', { kind: 'correction', correction: { amount: 14 } }],
  ['金额改成14', { kind: 'correction', correction: { amount: 14 } }],
  ['金額改成14', { kind: 'correction', correction: { amount: 14 } }],
  ['金额应该是20', { kind: 'correction', correction: { amount: 20 } }],
  ['把金额改成20', { kind: 'correction', correction: { amount: 20 } }],
  ['把它改成20块', { kind: 'correction', correction: { amount: 20 } }],
  ['把刚才那笔改成20', { kind: 'correction', correction: { amount: 20 } }],
  ['把上一笔改成20', { kind: 'correction', correction: { amount: 20 } }],
  ['刚才那笔应该是20', { kind: 'correction', correction: { amount: 20 } }],
  ['我是说15', { kind: 'correction', correction: { amount: 15 } }],
  ['我是說15', { kind: 'correction', correction: { amount: 15 } }],
  ['我的意思是15块', { kind: 'correction', correction: { amount: 15 } }],
  ['哦不对，改成14', { kind: 'correction', correction: { amount: 14 } }],
  ['不好意思，应该是14', { kind: 'correction', correction: { amount: 14 } }],
  ['换成30', { kind: 'correction', correction: { amount: 30 } }],
  // a new category
  ['改成餐饮', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['改成外出就餐', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['改成购物', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['改成娱乐', { kind: 'correction', correction: { categoryId: 'entertainment' } }],
  ['分类改成购物', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['分類改成娛樂', { kind: 'correction', correction: { categoryId: 'entertainment' } }],
  ['放到购物里', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['放到超市里', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['放到购物里面', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['算在外出就餐里', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['把它放到娱乐里', { kind: 'correction', correction: { categoryId: 'entertainment' } }],
  ['归到会员订阅', { kind: 'correction', correction: { categoryId: 'subscriptions' } }],
  ['改成咖啡', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['改成健身', { kind: 'correction', correction: { categoryId: 'health' } }],
  ['其实是外卖', { kind: 'correction', correction: { categoryId: 'dining' } }],
  // a new day
  ['那是昨天的', { kind: 'correction', correction: { date: '2026-09-15', amount: null, categoryId: null } }],
  ['那是昨天', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['其实是昨天', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['日期改成昨天', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['改成前天', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['那是上周五的', { kind: 'correction', correction: { date: '2026-09-11' } }],
  // two at once
  ['改成14块，餐饮', { kind: 'correction', correction: { amount: 14, categoryId: 'dining' } }],
  ['其实是昨天，14块', { kind: 'correction', correction: { amount: 14, date: '2026-09-15' } }],
  ['改成14块，外出就餐', { kind: 'correction', correction: { amount: 14, categoryId: 'dining' } }],
  // taking it back
  ['删掉', { kind: 'correction', correction: { remove: true } }],
  ['删了吧', { kind: 'correction', correction: { remove: true } }],
  ['删了刚才那笔', { kind: 'correction', correction: { remove: true } }],
  ['删除刚才那笔', { kind: 'correction', correction: { remove: true } }],
  ['把上一笔删了', { kind: 'correction', correction: { remove: true } }],
  ['把刚才那笔删掉', { kind: 'correction', correction: { remove: true } }],
  ['把这笔删了', { kind: 'correction', correction: { remove: true } }],
  ['帮我把刚才的删掉', { kind: 'correction', correction: { remove: true } }],
  ['刪掉', { kind: 'correction', correction: { remove: true } }],
  ['把上一筆刪了', { kind: 'correction', correction: { remove: true } }],
  ['撤销', { kind: 'correction', correction: { remove: true } }],
  ['撤銷', { kind: 'correction', correction: { remove: true } }],
  ['撤回上一笔', { kind: 'correction', correction: { remove: true } }],
  ['算了', { kind: 'correction', correction: { remove: true } }],
  ['算了吧', { kind: 'correction', correction: { remove: true } }],
  ['不要了', { kind: 'correction', correction: { remove: true } }],
  ['刚才那个不算', { kind: 'correction', correction: { remove: true } }],
  ['剛才那個不算', { kind: 'correction', correction: { remove: true } }],
  ['刚才那笔不要了', { kind: 'correction', correction: { remove: true } }],
  ['取消刚才那笔', { kind: 'correction', correction: { remove: true } }],
  ['当我没说', { kind: 'correction', correction: { remove: true } }],
  ['哎呀，删掉', { kind: 'correction', correction: { remove: true } }],
  ['不对，删了吧', { kind: 'correction', correction: { remove: true } }],
];

/** Sentences that sound a little like a correction but are new entries. */
const NOT_CORRECTIONS: Case[] = [
  ['其实午饭花了14', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ['其实打车花了30', { kind: 'transaction', amount: 30, categoryId: 'transport' }],
  ['那是40块的油费', { kind: 'transaction', amount: 40 }],
  ['取消会员退了15', { kind: 'transaction', type: 'income', amount: 15 }],
  ['改成日本旅行', { kind: 'transaction' }],
  ['删了App又买了个会员30', { kind: 'transaction', amount: 30 }],
  ['午饭14', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
];

describe('zh: corrections', () => runCases('zh', CORRECTIONS, labels));
describe('zh: sentences that are not corrections', () => runCases('zh', NOT_CORRECTIONS, labels));

/** Comparing with last time, where most went, and whether something fits. */
const INSIGHTS: Case[] = [
  // comparing
  ['比上个月花得多吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['比上个月花得多还是少', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['这个月和上个月比怎么样', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['這個月和上個月比怎麼樣', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['跟上个月比怎么样', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['和上个月相比呢', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['相比上个月怎么样', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['这个月花得比上个月多吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['这个月开销比上个月高吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['比上个月多花了多少', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['这个月比上个月多花了多少钱', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['外卖比上个月多吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: '外卖', fallbackCategoryId: 'dining' } }],
  ['外出就餐比上个月花得多吗', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'dining' } }],
  ['买菜比上个月花得少吗', { kind: 'question', question: { ask: 'compare', period: 'month', fallbackCategoryId: 'groceries' } }],
  ['相比上个月，买菜花得多吗', { kind: 'question', question: { ask: 'compare', period: 'month', fallbackCategoryId: 'groceries' } }],
  ['这周比上周花得多还是少', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['這週比上週花得多嗎', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['比上周多吗', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['跟上周比呢', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['今年比去年花得多吗', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['比去年多还是少', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['发工资以来比上个发薪周期花得多吗', { kind: 'question', question: { ask: 'compare', period: 'budget', target: null } }],
  ['咖啡比上周喝得多吗', { kind: 'question', question: { ask: 'compare', period: 'week' } }],
  ['这个月开销涨了吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['支出有没有比上个月多', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  // where most went
  ['钱主要花在哪了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['钱都花在哪了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['钱都去哪了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['钱花哪了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['最大的一笔开销是什么', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['錢都花到哪裡去了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['我在什么上花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['我在什麼上花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['什么花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['最大的开销是什么', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['最大的開銷是什麼', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['最大的支出', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['花得最多的是什么', { kind: 'question', question: { ask: 'top', target: null } }],
  ['开销最大的是哪一项', { kind: 'question', question: { ask: 'top', target: null } }],
  ['这个月哪方面花得最多', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['上个月钱都花在哪了', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['这周哪个类别花得最多', { kind: 'question', question: { ask: 'top', period: 'week', target: null } }],
  ['今年主要花在什么上', { kind: 'question', question: { ask: 'top', period: 'year', target: null } }],
  ['大部分钱花在哪', { kind: 'question', question: { ask: 'top', target: null } }],
  // whether something fits
  ['买200块的外套可以吗', { kind: 'question', question: { ask: 'afford', price: 200, period: 'budget', target: '外套', fallbackCategoryId: 'shopping' } }],
  ['买件200的外套行不行', { kind: 'question', question: { ask: 'afford', price: 200, fallbackCategoryId: 'shopping' } }],
  ['晚饭花80行不行', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'dining' } }],
  ['晚饭花80可以吗', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'dining' } }],
  ['我买得起1200的电脑吗', { kind: 'question', question: { ask: 'afford', price: 1200, target: '电脑', fallbackCategoryId: 'shopping' } }],
  ['我買得起1200的電腦嗎', { kind: 'question', question: { ask: 'afford', price: 1200, fallbackCategoryId: 'shopping' } }],
  ['花50买菜没问题吧', { kind: 'question', question: { ask: 'afford', price: 50, fallbackCategoryId: 'groceries' } }],
  ['能不能花300买双鞋', { kind: 'question', question: { ask: 'afford', price: 300, fallbackCategoryId: 'shopping' } }],
  ['我能花80吃火锅吗', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'dining' } }],
  ['还能花100吗', { kind: 'question', question: { ask: 'afford', price: 100, target: null } }],
  ['预算够买500的耳机吗', { kind: 'question', question: { ask: 'afford', price: 500, fallbackCategoryId: 'shopping' } }],
  ['钱够不够买2000的手机', { kind: 'question', question: { ask: 'afford', price: 2000, fallbackCategoryId: 'shopping' } }],
  ['买一千五的手机会超预算吗', { kind: 'question', question: { ask: 'afford', price: 1500, fallbackCategoryId: 'shopping' } }],
  ['外出就餐再花200可以吗', { kind: 'question', question: { ask: 'afford', price: 200, categoryId: 'dining' } }],
  // without an amount, whether there is room at all
  ['出去吃饭可以吗', { kind: 'question', question: { ask: 'left' } }],
  ['还能买衣服吗', { kind: 'question', question: { ask: 'left' } }],
  ['可以花多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['还能花多少钱', { kind: 'question', question: { ask: 'left', target: null } }],
];

/** Entries with an amount near those words stay entries. */
const INSIGHTS_STAY_ENTRIES: Case[] = [
  ['买了件外套200', { kind: 'transaction', amount: 200, categoryId: 'shopping' }],
  ['最贵的咖啡38', { kind: 'transaction', amount: 38, categoryId: 'dining' }],
  ['比萨68', { kind: 'transaction', amount: 68 }],
  ['跟上个月一样交房租3000', { kind: 'transaction', amount: 3000, categoryId: 'rent' }],
  ['和同事吃饭花了120', { kind: 'transaction', amount: 120, categoryId: 'dining' }],
  ['最多的一次打车花了90', { kind: 'transaction', amount: 90, categoryId: 'transport' }],
  ['主要是买菜花了150', { kind: 'transaction', amount: 150, categoryId: 'groceries' }],
  ['可乐3块', { kind: 'transaction', amount: 3, categoryId: 'dining' }],
  ['银行手续费25', { kind: 'transaction', amount: 25 }],
  ['那是午饭35', { kind: 'transaction', amount: 35, categoryId: 'dining' }],
  ['应该还信用卡2000', { kind: 'transaction', amount: 2000, categoryId: 'debt' }],
];

describe('zh: comparing, the most, affording', () => runCases('zh', INSIGHTS, labels));
describe('zh: entries near those words stay entries', () => runCases('zh', INSIGHTS_STAY_ENTRIES, labels));

/* ------------------------------------------------------------------------------------------------
 * More everyday speech, as dictation writes it (no punctuation): setting money aside, the small
 * daily spends, money coming in, questions, fixes, reminders and the ways amounts are said.
 * ---------------------------------------------------------------------------------------------- */

/** Money put aside, with no goal named: a savings entry. */
const SAVING_ENTRIES: Case[] = [
  ['存了2000', { kind: 'transaction', type: 'expense', amount: 2000, categoryId: 'savings' }],
  ['今天存了50', { kind: 'transaction', amount: 50, categoryId: 'savings', occurredAt: '2026-09-16' }],
  ['攒了500', { kind: 'transaction', amount: 500, categoryId: 'savings' }],
  ['私房钱500', { kind: 'transaction', amount: 500, categoryId: 'savings' }],
  ['转了3000到储蓄卡', { kind: 'transaction', amount: 3000, categoryId: 'savings' }],
  ['应急金放了1000', { kind: 'transaction', amount: 1000, categoryId: 'savings' }],
  ['存定期1万', { kind: 'transaction', amount: 10000, categoryId: 'savings' }],
  ['买了基金2000', { kind: 'transaction', amount: 2000, categoryId: 'savings' }],
  ['余额宝转入500', { kind: 'transaction', amount: 500, categoryId: 'savings' }],
  ['定投了1000', { kind: 'transaction', amount: 1000, categoryId: 'savings' }],
  ['每个月存了2000', { kind: 'transaction', amount: 2000, categoryId: 'savings' }],
  // set aside for a trip that is not a goal yet: the amount is right, the words are kept
  ['为了旅行先放一千', { kind: 'transaction', type: 'expense', amount: 1000 }],
  // a yearly total said this way is a plain entry too; nothing marks it as a plan
  ['一年存5万', { kind: 'transaction', amount: 50000 }],
];

/** A plan said per period: the amount is a pace, so the card asks for the total (hint.goalPace). */
const PACED_GOALS: Case[] = [
  ['想每个月存2000买车', { kind: 'goal', goalKind: 'saving', amount: null, goalName: '买车' }],
  ['每月存2000', { kind: 'goal', goalKind: 'saving', amount: null }],
  ['打算每周存500', { kind: 'goal', goalKind: 'saving', amount: null }],
  ['我想存一万块去日本', { kind: 'goal', goalKind: 'saving', amount: 10000 }],
  ['要攒三万买摩托', { kind: 'goal', goalKind: 'saving', amount: 30000, goalName: '摩托' }],
  ['打算一个月内还清借呗8000', { kind: 'goal', goalKind: 'debt', amount: 8000 }],
];

describe('zh: money put aside', () => runCases('zh', SAVING_ENTRIES, labels));
describe('zh: saving plans said per period', () => runCases('zh', PACED_GOALS, labels));

describe('zh: paying into a goal, more ways', () => {
  it.each([
    ['往日本旅行的钱里加了200', { kind: 'contribution', amount: 200, goalId: 'g1' }],
    ['日本旅行又加了300', { kind: 'contribution', amount: 300, goalId: 'g1' }],
    ['给应急基金转了1000', { kind: 'contribution', amount: 1000, goalId: 'g2' }],
    ['买车的钱又存了2000', { kind: 'contribution', amount: 2000, goalId: 'g3' }],
    ['存到买车里500', { kind: 'contribution', amount: 500, goalId: 'g3' }],
  ] as Case[])('%s', (text, expected) => {
    const r = parseOne(text, 'zh', labels, CHINESE_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

const DAILY_SPENDS: Case[] = [
  ['便利店8块', { kind: 'transaction', type: 'expense', amount: 8, categoryId: 'groceries' }],
  ['中午吃饭花了30', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['加满油400', { type: 'expense', amount: 400, categoryId: 'transport' }],
  ['交了电费80', { type: 'expense', amount: 80, categoryId: 'utilities' }],
  ['房租转了3000', { type: 'expense', amount: 3000, categoryId: 'rent' }],
  ['聚餐AA 120', { type: 'expense', amount: 120, categoryId: 'dining' }],
  ['打车20', { type: 'expense', amount: 20, categoryId: 'transport' }],
  ['星巴克35', { type: 'expense', amount: 35, categoryId: 'dining' }],
  ['优衣库买了300', { type: 'expense', amount: 300, categoryId: 'shopping' }],
  ['看病花了200', { type: 'expense', amount: 200, categoryId: 'health' }],
  ['药店50', { type: 'expense', amount: 50, categoryId: 'health' }],
  ['停车10', { type: 'expense', amount: 10, categoryId: 'transport' }],
  ['高速费80', { type: 'expense', amount: 80, categoryId: 'transport' }],
  ['孩子补习班1000', { type: 'expense', amount: 1000, categoryId: 'shopping' }],
  ['会员订阅15', { type: 'expense', amount: 15, categoryId: 'subscriptions' }],
  ['淘宝剁手300', { type: 'expense', amount: 300, categoryId: 'shopping' }],
  ['外卖点了40', { type: 'expense', amount: 40, categoryId: 'dining' }],
  ['跟同事吃面25', { type: 'expense', amount: 25, categoryId: 'dining' }],
  ['地铁4块', { type: 'expense', amount: 4, categoryId: 'transport' }],
  ['撸串150', { type: 'expense', amount: 150, categoryId: 'dining' }],
  ['晚上撸串人均80', { type: 'expense', amount: 80, categoryId: 'dining' }],
  ['喝了杯奶茶18', { type: 'expense', amount: 18, categoryId: 'dining' }],
  ['早上买了个包子3块', { type: 'expense', amount: 3, categoryId: 'dining' }],
  ['吃了碗牛肉面28', { type: 'expense', amount: 28, categoryId: 'dining' }],
  ['肯德基套餐39', { type: 'expense', amount: 39, categoryId: 'dining' }],
  ['请客吃饭500', { type: 'expense', amount: 500, categoryId: 'dining' }],
  ['午饭和同事AA了60', { type: 'expense', amount: 60, categoryId: 'dining' }],
  ['午饭一人30', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['公交2块', { type: 'expense', amount: 2, categoryId: 'transport' }],
  ['共享单车1.5', { type: 'expense', amount: 1.5, categoryId: 'transport' }],
  ['洗车50', { type: 'expense', amount: 50, categoryId: 'transport' }],
  ['给孩子买了奶粉300', { type: 'expense', amount: 300, categoryId: 'shopping' }],
  ['理发30', { type: 'expense', amount: 30, categoryId: 'shopping' }],
  ['买了件T恤99', { type: 'expense', amount: 99, categoryId: 'shopping' }],
  ['猫粮120', { type: 'expense', amount: 120, categoryId: 'shopping' }],
  ['水果店45', { type: 'expense', amount: 45, categoryId: 'groceries' }],
  ['和女朋友看电影120', { type: 'expense', amount: 120, categoryId: 'entertainment' }],
  ['游戏充值100', { type: 'expense', amount: 100, categoryId: 'entertainment' }],
  ['网费一年600', { type: 'expense', amount: 600, categoryId: 'utilities' }],
  ['煤气费60', { type: 'expense', amount: 60, categoryId: 'utilities' }],
  ['保险交了5000', { type: 'expense', amount: 5000, categoryId: 'other_expense' }],
  ['给老婆转了2000', { type: 'expense', amount: 2000 }],
  ['买了瓶水2块', { type: 'expense', amount: 2 }],
  ['月卡200', { type: 'expense', amount: 200 }],
  // Taiwan
  ['高鐵票1490', { type: 'expense', amount: 1490, categoryId: 'transport' }],
  ['便當85', { type: 'expense', amount: 85, categoryId: 'dining' }],
  ['手搖飲55', { type: 'expense', amount: 55, categoryId: 'dining' }],
  ['搭公車15', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['繳水費300', { type: 'expense', amount: 300, categoryId: 'utilities' }],
];

const MORE_INCOME: Case[] = [
  ['工资到账', { kind: 'transaction', type: 'income', amount: null, categoryId: 'salary' }],
  ['工资发了 12000', { type: 'income', amount: 12000, categoryId: 'salary' }],
  ['发工资一万五', { type: 'income', amount: 15000, categoryId: 'salary' }],
  ['公司打了5000', { type: 'income', amount: 5000, categoryId: 'salary' }],
  ['发奖金了3000', { type: 'income', amount: 3000, categoryId: 'salary' }],
  ['年终奖2万', { type: 'income', amount: 20000, categoryId: 'salary' }],
  ['兼职赚了500', { type: 'income', amount: 500, categoryId: 'freelance' }],
  ['副业收入2000', { type: 'income', amount: 2000, categoryId: 'freelance' }],
  ['闲鱼卖了300', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['做家教赚了400', { type: 'income', amount: 400, categoryId: 'freelance' }],
  ['卖闲置赚了200', { type: 'income', amount: 200, categoryId: 'freelance' }],
  ['收到稿费2000', { type: 'income', amount: 2000, categoryId: 'freelance' }],
  ['收到了客户的尾款5000', { type: 'income', amount: 5000, categoryId: 'freelance' }],
  ['卖了旧电脑800', { type: 'income', amount: 800 }],
  ['退款200', { type: 'income', amount: 200, categoryId: 'other_income' }],
  ['退税1000', { type: 'income', amount: 1000, categoryId: 'other_income' }],
  ['报销了300', { type: 'income', amount: 300, categoryId: 'other_income' }],
  ['退了押金1000', { type: 'income', amount: 1000, categoryId: 'other_income' }],
  ['中了彩票200', { type: 'income', amount: 200, categoryId: 'other_income' }],
  ['收到转账500', { type: 'income', amount: 500 }],
  // family: 给了 alone is giving, but grandma giving is money that came in
  ['奶奶给了500', { type: 'income', amount: 500, categoryId: 'gift_income' }],
  ['爸妈给了2000', { type: 'income', amount: 2000, categoryId: 'gift_income' }],
  ['家里给了3000', { type: 'income', amount: 3000, categoryId: 'gift_income' }],
  ['红包500', { type: 'income', amount: 500, categoryId: 'gift_income' }],
  ['老板发了红包888', { type: 'income', amount: 888, categoryId: 'gift_income' }],
  ['微信红包收了66', { type: 'income', amount: 66, categoryId: 'gift_income' }],
  ['領了年終獎金60000', { type: 'income', amount: 60000, categoryId: 'salary' }],
  ['媽媽給了我2000', { type: 'income', amount: 2000, categoryId: 'gift_income' }],
];

describe('zh: the small daily spends', () => runCases('zh', DAILY_SPENDS, labels));
describe('zh: more money coming in', () => runCases('zh', MORE_INCOME, labels));

const MORE_QUESTIONS: Case[] = [
  // spent
  ['这周花了多少', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['今天花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['这个月咖啡花了多少', { kind: 'question', question: { ask: 'spent', period: 'month', target: '咖啡', fallbackCategoryId: 'dining' } }],
  ['上个月打车花了多少钱', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', target: '打车', fallbackCategoryId: 'transport' } }],
  ['这个礼拜吃饭花了多少', { kind: 'question', question: { ask: 'spent', period: 'week', categoryIds: FOOD } }],
  ['最近7天花了多少', { kind: 'question', question: { ask: 'spent', period: 'recentDays', days: 7, target: null } }],
  ['周末花了多少', { kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } }],
  ['今年旅游花了多少', { kind: 'question', question: { ask: 'spent', period: 'year', target: '旅游' } }],
  // "how much did I drink / order" is money when 钱 is said
  ['这个月奶茶喝了多少钱', { kind: 'question', question: { ask: 'spent', period: 'month', target: '奶茶', fallbackCategoryId: 'dining' } }],
  ['这个月外卖点了多少钱', { kind: 'question', question: { ask: 'spent', period: 'month', target: '外卖', fallbackCategoryId: 'dining' } }],
  // left
  ['还剩多少', { kind: 'question', question: { ask: 'left', target: null } }],
  ['买菜还剩多少钱', { kind: 'question', question: { ask: 'left', target: '买菜', fallbackCategoryId: 'groceries' } }],
  ['还有多少预算', { kind: 'question', question: { ask: 'left', target: null } }],
  ['还剩多少钱可以用', { kind: 'question', question: { ask: 'left', target: null } }],
  ['这个月的预算还够吗', { kind: 'question', question: { ask: 'left', target: null } }],
  ['交通还剩多少预算', { kind: 'question', question: { ask: 'left', categoryId: 'transport' } }],
  ['买菜的钱还够吗', { kind: 'question', question: { ask: 'left', target: '买菜', fallbackCategoryId: 'groceries' } }],
  // compare
  ['比上个月花得多吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['比上个月多花了吗', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['跟去年比呢', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['这周比上周多花了多少', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['比上个发薪周期花得多吗', { kind: 'question', question: { ask: 'compare', period: 'budget', target: null } }],
  // top
  ['这个月钱都花哪了', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['最大的一笔开销是什么', { kind: 'question', question: { ask: 'biggest', target: null } }],
  ['这个月最大的开销是啥', { kind: 'question', question: { ask: 'biggest', period: 'month', target: null } }],
  ['上周三花了多少', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: null } }],
  ['把买菜预算设成3000', { kind: 'plan', amount: 3000, categoryId: 'groceries' }],
  ['我欠多少钱', { kind: 'question', question: { ask: 'owe' } }],
  ['小明欠我200', { kind: 'question', question: { ask: 'owed', price: 200, target: '小明' } }],
  ['房租什么时候交', { kind: 'question', question: { ask: 'due' } }],
  ['这周有什么要交的', { kind: 'question', question: { ask: 'due', period: 'week' } }],
  ['订阅每月多少钱', { kind: 'question', question: { ask: 'rules' } }],
  ['这个月存了多少', { kind: 'question', question: { ask: 'saved', period: 'month' } }],
  ['平均每天花多少', { kind: 'question', question: { ask: 'average', per: 'day' } }],
  ['这个月下馆子几次', { kind: 'question', question: { ask: 'count', period: 'month' } }],
  ['最后一笔记录是什么', { kind: 'question', question: { ask: 'last' } }],
  ['上周三在星巴克花了多少', { kind: 'question', question: { ask: 'spent', period: 'day', date: '2026-09-09', target: '星巴克' } }],
  ['上个月最大的一笔支出是什么', { kind: 'question', question: { ask: 'biggest', period: 'lastMonth', target: null } }],
  ['花得最多的是什么', { kind: 'question', question: { ask: 'top', target: null } }],
  ['大头是什么', { kind: 'question', question: { ask: 'top', target: null } }],
  ['哪里花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['钱都花到哪去了', { kind: 'question', question: { ask: 'top', target: null } }],
  // afford
  ['80块的鞋买得起吗', { kind: 'question', question: { ask: 'afford', price: 80, target: '鞋', fallbackCategoryId: 'shopping' } }],
  ['买个1500的手机行不行', { kind: 'question', question: { ask: 'afford', price: 1500, fallbackCategoryId: 'shopping' } }],
  ['请客花500可以吗', { kind: 'question', question: { ask: 'afford', price: 500, fallbackCategoryId: 'dining' } }],
  ['买个200的包没问题吧', { kind: 'question', question: { ask: 'afford', price: 200, fallbackCategoryId: 'shopping' } }],
  ['1000块的健身卡买得起吗', { kind: 'question', question: { ask: 'afford', price: 1000, fallbackCategoryId: 'health' } }],
  ['现在能花300吃顿好的吗', { kind: 'question', question: { ask: 'afford', price: 300, target: null } }],
  // income
  ['这个月赚了多少', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['这个月进账了多少', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['上个月一共进账多少', { kind: 'question', question: { type: 'income', period: 'lastMonth', target: null } }],
  ['去年赚了多少钱', { kind: 'question', question: { type: 'income', period: 'lastYear' } }],
  ['兼职这个月赚了多少', { kind: 'question', question: { type: 'income', period: 'month', categoryId: 'freelance' } }],
];

describe('zh: more questions', () => runCases('zh', MORE_QUESTIONS, labels));

/** Fixes that name the entry ("午饭改成45", "把打车删了") or state the right value after the wrong one. */
const MORE_CORRECTIONS: Case[] = [
  ['不对是140', { kind: 'correction', correction: { remove: false, amount: 140 } }],
  ['其实是45', { kind: 'correction', correction: { amount: 45 } }],
  ['不是35是45', { kind: 'correction', correction: { amount: 45 } }],
  ['换成50块5', { kind: 'correction', correction: { amount: 50.5 } }],
  ['改成外食', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['改成买菜', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['分类改成交通', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['是昨天的', { kind: 'correction', correction: { date: '2026-09-15', amount: null } }],
  ['改成上周三', { kind: 'correction', correction: { date: '2026-09-09' } }],
  // naming the entry
  ['午饭改成45', { kind: 'correction', correction: { target: '午饭', amount: 45, remove: false } }],
  ['把午饭改成45块', { kind: 'correction', correction: { target: '午饭', amount: 45 } }],
  ['午饭应该是45', { kind: 'correction', correction: { target: '午饭', amount: 45 } }],
  ['把打车那笔改成32', { kind: 'correction', correction: { target: '打车', amount: 32 } }],
  ['星巴克那笔其实是38', { kind: 'correction', correction: { target: '星巴克', amount: 38 } }],
  ['打车是32不是23', { kind: 'correction', correction: { target: '打车', amount: 32 } }],
  ['打车不是23是32', { kind: 'correction', correction: { target: '打车', amount: 32 } }],
  // removing one by name
  ['删掉刚才那条', { kind: 'correction', correction: { remove: true, target: null } }],
  ['撤回', { kind: 'correction', correction: { remove: true } }],
  ['刪掉那筆', { kind: 'correction', correction: { remove: true } }],
  ['把打车删了', { kind: 'correction', correction: { remove: true, target: '打车' } }],
  ['删掉星巴克那条', { kind: 'correction', correction: { remove: true, target: '星巴克' } }],
  ['把星巴克的删掉', { kind: 'correction', correction: { remove: true, target: '星巴克' } }],
  ['星巴克那笔删了', { kind: 'correction', correction: { remove: true, target: '星巴克' } }],
  ['把那笔房租删了', { kind: 'correction', correction: { remove: true, target: '房租' } }],
  ['给妈妈的转账删掉', { kind: 'correction', correction: { remove: true, target: '妈妈的转账' } }],
];

describe('zh: more corrections', () => runCases('zh', MORE_CORRECTIONS, labels));

const MORE_REMINDERS: Case[] = [
  ['1号提醒我交房租', { kind: 'reminder', occurredAt: '2026-10-01', reminderText: '交房租' }],
  ['20号提醒我还花呗', { kind: 'reminder', occurredAt: '2026-09-20' }],
  ['周五别让我忘了电费', { kind: 'reminder', occurredAt: '2026-09-18', reminderText: '电费' }],
  ['晚上8点提醒我记账', { kind: 'reminder', reminderTime: '20:00', reminderText: '记账' }],
  ['每周一提醒我看预算', { kind: 'reminder', reminderRepeat: 'weekly', reminderText: '看预算' }],
  ['每天晚上九点提醒我记账', { kind: 'reminder', reminderRepeat: 'daily', reminderTime: '21:00' }],
  ['提醒我后天还信用卡', { kind: 'reminder', occurredAt: '2026-09-18' }],
  ['下周三提醒我交保险', { kind: 'reminder', occurredAt: '2026-09-23' }],
  ['月底提醒我交房租', { kind: 'reminder', occurredAt: '2026-09-30' }],
  ['明天中午12点提醒我转账', { kind: 'reminder', occurredAt: '2026-09-17', reminderTime: '12:00' }],
  ['提醒我每月10号交水电费', { kind: 'reminder', reminderRepeat: 'monthly', reminderText: '交水电费' }],
  ['记得明天交话费', { kind: 'reminder', occurredAt: '2026-09-17' }],
  ['睡前提醒我记账', { kind: 'reminder', reminderTime: '19:00' }],
  ['每月5號提醒我繳卡費', { kind: 'reminder', reminderRepeat: 'monthly' }],
];

describe('zh: more reminders', () => runCases('zh', MORE_REMINDERS, labels));

/** The ways an amount is said or typed. */
const AMOUNTS: Case[] = [
  ['一千二', { kind: 'transaction', amount: 1200 }],
  ['午饭1,200', { kind: 'transaction', amount: 1200, categoryId: 'dining' }],
  ['两千五', { kind: 'transaction', amount: 2500 }],
  ['1.2万', { kind: 'transaction', amount: 12000 }],
  ['一万二', { kind: 'transaction', amount: 12000 }],
  ['1万2', { kind: 'transaction', amount: 12000 }],
  ['12万', { kind: 'transaction', amount: 120000 }],
  ['两万', { kind: 'transaction', amount: 20000 }],
  ['五百块', { kind: 'transaction', amount: 500 }],
  ['三十块钱', { kind: 'transaction', amount: 30 }],
  ['一百五', { kind: 'transaction', amount: 150 }],
  ['二十', { kind: 'transaction', amount: 20 }],
  ['15.5', { kind: 'transaction', amount: 15.5 }],
  ['10块8', { kind: 'transaction', amount: 10.8 }],
  ['房租两千八', { kind: 'transaction', amount: 2800, categoryId: 'rent' }],
  ['房租3,500', { kind: 'transaction', amount: 3500, categoryId: 'rent' }],
  ['奶茶十二块五', { kind: 'transaction', amount: 12.5, categoryId: 'dining' }],
  ['三块五的可乐', { kind: 'transaction', amount: 3.5, categoryId: 'dining' }],
  ['打车十八块八', { kind: 'transaction', amount: 18.8, categoryId: 'transport' }],
  ['两百块的鞋', { kind: 'transaction', amount: 200, categoryId: 'shopping' }],
  ['买了台电脑8999', { kind: 'transaction', amount: 8999, categoryId: 'shopping' }],
];

/** Sentences near question, plan or correction words that must stay plain entries. */
const STILL_ENTRIES: Case[] = [
  ['一个月2000', { kind: 'transaction', amount: 2000 }],
  ['每月房租3000', { kind: 'transaction', amount: 3000, categoryId: 'rent' }],
  // 周一 inside 这周一共 is not Monday
  ['这周一共花了300', { kind: 'transaction', amount: 300, dateExplicit: false }],
  ['周一花了300', { kind: 'transaction', amount: 300, occurredAt: '2026-09-14' }],
  ['上周一午饭35', { kind: 'transaction', amount: 35, categoryId: 'dining', occurredAt: '2026-09-14' }],
  ['还剩的钱买了菜50', { kind: 'transaction', amount: 50, categoryId: 'groceries' }],
  ['比萨外卖68', { kind: 'transaction', amount: 68, categoryId: 'dining' }],
  ['最后一杯咖啡28', { kind: 'transaction', amount: 28, categoryId: 'dining' }],
  ['预算内买了双鞋300', { kind: 'transaction', amount: 300, categoryId: 'shopping' }],
];

describe('zh: how amounts are said', () => runCases('zh', AMOUNTS, labels));
describe('zh: still plain entries', () => runCases('zh', STILL_ENTRIES, labels));

/** Misreads a reviewer reproduced: a tip given, "不对等一下", a terse question keeping 还, two bills in one breath, a transfer's note. */
const REVIEWED_MISREADS: Case[] = [
  // A tip is money at the table; only "收了" makes it income.
  ['给了5块小费', { kind: 'transaction', type: 'expense', amount: 5, categoryId: 'dining' }],
  ['小费20', { kind: 'transaction', type: 'expense', amount: 20, categoryId: 'dining' }],
  ['收了小费50', { kind: 'transaction', type: 'income', amount: 50 }],
  ['不对等一下，15', { kind: 'correction', correction: { amount: 15 } }],
  ['等一下，15', { kind: 'correction', correction: { amount: 15 } }],
  ['买菜还够吗', { kind: 'question', question: { ask: 'left', target: '买菜', fallbackCategoryId: 'groceries' } }],
  ['转200到存款账户', { kind: 'transaction', amount: 200, categoryId: 'savings', note: '存款账户' }],
];

describe('zh: reviewed misreads', () => runCases('zh', REVIEWED_MISREADS, labels));

/** "晚饭40加小费8块" and "电费60水费40" are two entries each, both money out. */
describe('zh: two entries in one breath', () => {
  it('晚饭40加小费8块', () => {
    const r = parseOne('晚饭40加小费8块', 'zh', labels);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 40, categoryId: 'dining' });
    expect(r[1]).toMatchObject({ kind: 'transaction', type: 'expense', amount: 8, categoryId: 'dining' });
  });
  it('电费60水费40', () => {
    const r = parseOne('电费60水费40', 'zh', labels);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', amount: 60, categoryId: 'utilities', note: '电费' });
    expect(r[1]).toMatchObject({ kind: 'transaction', amount: 40, categoryId: 'utilities', note: '水费' });
  });
});

/**
 * Waiting on the parser core: 回 as a counter only when not followed by 来/去/家, a named month as a question period
 * (`question.monthNames` is already in the pack), and the pack hook that keeps a bare pay noun after "上次" from making
 * an entry income ("发工资" is a salary keyword and wins over "超市" by length). Un-skip once the core change is merged.
 */
describe('after core merge', () => {
  const pending: Case[] = [
    ['8月花了多少', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
    ['上次发工资那天超市40', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'groceries' }],
  ];
  runCases('zh', pending, labels);
  it('去机场打车45回来50', () => {
    const r = parseOne('去机场打车45回来50', 'zh', labels);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'transaction', amount: 45, categoryId: 'transport' });
    expect(r[1]).toMatchObject({ kind: 'transaction', amount: 50, categoryId: 'transport' });
  });
});

describe('zh: things to do by voice', () => {
  // A goal named in this language and the repeating entries' names, as the app hands them to the parser.
  const goals = [{ ...GOALS[0], name: '日本旅行' }];
  const ruleNames = ['netflix', '健身房', 'spotify'];
  it.each([
    ['把netflix暂停', { kind: 'command', command: { rule: { action: 'pause', target: 'netflix' } } }],
    ['恢复netflix', { kind: 'command', command: { rule: { action: 'resume', target: 'netflix' } } }],
    ['把spotify的订阅删掉', { kind: 'command', command: { rule: { action: 'remove', target: 'spotify' } } }],
    ['把日本旅行目标标为完成', { kind: 'command', command: { goal: { action: 'done', id: 'g1' } } }],
    ['一样的', { kind: 'command', command: { again: { target: null } } }],
    ['再来一杯咖啡', { kind: 'command', command: { again: { target: '咖啡' } } }],
    ['切换成英文', { kind: 'command', command: { language: 'en' } }],
    ['货币换成美元', { kind: 'command', command: { currency: 'USD' } }],
    ['深色模式', { kind: 'command', command: { theme: 'dark' } }],
    ['帮助', { kind: 'command', command: { help: true } }],
    ['重新打开日本旅行目标', { kind: 'command', command: { goal: { action: 'reopen', id: 'g1' } } }],
  ])('%s', (text, expected) => {
    const r = parseOne(text as string, 'zh', undefined, goals, ruleNames);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected as object);
  });
});
