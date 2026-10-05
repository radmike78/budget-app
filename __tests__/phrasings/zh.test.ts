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
  ['最大的一笔开销是什么', { kind: 'question', question: { ask: 'top', target: null } }],
  ['錢都花到哪裡去了', { kind: 'question', question: { ask: 'top', target: null } }],
  ['我在什么上花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['我在什麼上花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['什么花得最多', { kind: 'question', question: { ask: 'top', target: null } }],
  ['最大的开销是什么', { kind: 'question', question: { ask: 'top', target: null } }],
  ['最大的開銷是什麼', { kind: 'question', question: { ask: 'top', target: null } }],
  ['最大的支出', { kind: 'question', question: { ask: 'top', target: null } }],
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
