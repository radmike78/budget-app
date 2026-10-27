/**
 * Spanish: the everyday ways people in Spain and Latin America say the same
 * thing (casual and neutral), each with what the parser must make of it.
 * Categories are passed with their Spanish names, as the app does.
 */
import { es } from '@/i18n/locales/es';
import type { Goal } from '@/types';
import { GOALS, parseOne, runCases, type Case } from './harness';

const labels = es.s.categoryNames as Record<string, string>;

const expenses: Case[] = [
  ['gasté 12 en el almuerzo', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['me gasté 12 en la comida', { kind: 'transaction', type: 'expense', amount: 12, categoryId: 'dining' }],
  ['pagué 12 por el almuerzo', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['el almuerzo me costó 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['la cena me salió 30 euros', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['la cena me salió en 30', { type: 'expense', amount: 30, categoryId: 'dining' }],
  ['12 euros de almuerzo', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['almuerzo 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['me gasté 20 en cervezas', { type: 'expense', amount: 20, categoryId: 'dining' }],
  ['unas cañas, 12', { type: 'expense', amount: 12, categoryId: 'dining' }],
  ['veinte pavos en copas', { type: 'expense', amount: 20, categoryId: 'dining' }],
  ['café 3,50', { type: 'expense', amount: 3.5, categoryId: 'dining' }],
  ['un café, 2 euros', { type: 'expense', amount: 2, categoryId: 'dining' }],
  ['3,50 de café', { type: 'expense', amount: 3.5, categoryId: 'dining' }],
  ['un café cinco cincuenta', { type: 'expense', amount: 5.5, categoryId: 'dining' }],
  ['me tomé un café de 2', { type: 'expense', amount: 2, categoryId: 'dining' }],
  ['invité a cenar a mi pareja, 70', { type: 'expense', amount: 70, categoryId: 'dining' }],
  ['salimos a cenar, 45', { type: 'expense', amount: 45, categoryId: 'dining' }],
  ['pedí comida a domicilio, 25', { type: 'expense', amount: 25, categoryId: 'dining' }],
  ['un Glovo de 25', { type: 'expense', amount: 25, categoryId: 'dining' }],
  ['pedí un Rappi de 180 pesos', { type: 'expense', amount: 180, categoryId: 'dining' }],
  ['comida para llevar 18', { type: 'expense', amount: 18, categoryId: 'dining' }],
  ['12 euros y 50 en el almuerzo', { type: 'expense', amount: 12.5, categoryId: 'dining' }],
  ['gasté 85 en el súper', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['se me fueron 50 en el súper', { type: 'expense', amount: 50, categoryId: 'groceries' }],
  ['dejé 85 en el Mercadona', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['hice la compra, 85', { type: 'expense', amount: 85, categoryId: 'groceries' }],
  ['la compra de la semana 120', { type: 'expense', amount: 120, categoryId: 'groceries' }],
  ['el mandado 450 pesos', { type: 'expense', amount: 450, categoryId: 'groceries' }],
  ['compré pan por 3', { type: 'expense', amount: 3, categoryId: 'groceries' }],
  ['cien en el súper', { type: 'expense', amount: 100, categoryId: 'groceries' }],
  ['fruta y verdura 15', { type: 'expense', amount: 15, categoryId: 'groceries' }],
  ['eché 40 de gasolina', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['eché gasolina, 40 euros', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['llené el tanque por 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['llené el depósito, 60', { type: 'expense', amount: 60, categoryId: 'transport' }],
  ['cargué nafta, 15000 pesos', { type: 'expense', amount: 15000, categoryId: 'transport' }],
  ['gasolina 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['Uber 12', { type: 'expense', amount: 12, categoryId: 'transport' }],
  ['un taxi de 15', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['el abono del metro 40', { type: 'expense', amount: 40, categoryId: 'transport' }],
  ['quince de parking', { type: 'expense', amount: 15, categoryId: 'transport' }],
  ['ayer gasté 23 en un Uber', { type: 'expense', amount: 23, categoryId: 'transport', occurredAt: '2026-09-15' }],
  ['arreglar el coche me costó 300', { type: 'expense', amount: 300, categoryId: 'transport' }],
  ['anoche la cena fueron 60', { type: 'expense', amount: 60, categoryId: 'dining', occurredAt: '2026-09-15' }],
  ['pagué el alquiler, 800', { type: 'expense', amount: 800, categoryId: 'rent' }],
  ['la renta 8000', { type: 'expense', amount: 8000, categoryId: 'rent' }],
  ['pagué la luz 60', { type: 'expense', amount: 60, categoryId: 'utilities' }],
  ['el recibo de la luz 60', { type: 'expense', amount: 60, categoryId: 'utilities' }],
  ['factura del móvil 25', { type: 'expense', amount: 25, categoryId: 'utilities' }],
  ['luz y agua 90', { type: 'expense', amount: 90, categoryId: 'utilities' }],
  ['farmacia 18', { type: 'expense', amount: 18, categoryId: 'health' }],
  ['medicinas 18', { type: 'expense', amount: 18, categoryId: 'health' }],
  ['fui al dentista, 60', { type: 'expense', amount: 60, categoryId: 'health' }],
  ['la consulta del médico 50', { type: 'expense', amount: 50, categoryId: 'health' }],
  ['entradas del cine 20', { type: 'expense', amount: 20, categoryId: 'entertainment' }],
  ['me compré unos zapatos de 80', { type: 'expense', amount: 80, categoryId: 'shopping' }],
  ['zapatillas 80', { type: 'expense', amount: 80, categoryId: 'shopping' }],
  ['pedido de Amazon 64', { type: 'expense', amount: 64, categoryId: 'shopping' }],
  ['ropa en Zara 45', { type: 'expense', amount: 45, categoryId: 'shopping' }],
  ['corte de pelo 15', { type: 'expense', amount: 15, categoryId: 'shopping' }],
  ['Netflix 15,99', { type: 'expense', amount: 15.99, categoryId: 'subscriptions' }],
  ['me cobraron 15,99 de Netflix', { type: 'expense', amount: 15.99, categoryId: 'subscriptions' }],
  ['Spotify 10,99', { type: 'expense', amount: 10.99, categoryId: 'subscriptions' }],
  ['se renovó Spotify, 10,99', { type: 'expense', amount: 10.99, categoryId: 'subscriptions' }],
  ['pagué 200 de la tarjeta', { type: 'expense', amount: 200, categoryId: 'debt' }],
  ['la cuota del préstamo 300', { type: 'expense', amount: 300, categoryId: 'debt' }],
  ['dejé 5 de propina', { type: 'expense', amount: 5 }],
  ['le di 5 de propina al camarero', { type: 'expense', amount: 5 }],
  ['saqué 50 del cajero', { type: 'expense', amount: 50, categoryId: 'other_expense' }],
];

const income: Case[] = [
  ['cobré la nómina, 2400', { kind: 'transaction', type: 'income', amount: 2400, categoryId: 'salary' }],
  ['nómina 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me pagaron el sueldo, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me ingresaron la nómina, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me entró la nómina, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me depositaron la quincena, 12000', { type: 'income', amount: 12000, categoryId: 'salary' }],
  ['me cayó la quincena, 12000', { type: 'income', amount: 12000, categoryId: 'salary' }],
  ['cobré 2400 de sueldo', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me pagaron 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['ahorrar 500 para navidad', { kind: 'goal', amount: 500, goalName: 'Navidad', targetDate: '2026-12-25' }],
  ['café 4 50', { kind: 'transaction', amount: 4.5 }],
  ['me pagaron la pensión 900', { type: 'income', amount: 900, categoryId: 'other_income' }],
  ['cobré 1500', { type: 'income', amount: 1500, categoryId: 'salary' }],
  ['cobré 300 por un trabajo freelance', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['cobré 50 de un cliente', { type: 'income', amount: 50, categoryId: 'freelance' }],
  ['gané 300 con un encargo', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['vendí la bici por 150', { type: 'income', amount: 150 }],
  ['vendí unas cosas en Wallapop por 40', { type: 'income', amount: 40 }],
  ['mi madre me dio 100', { type: 'income', amount: 100 }],
  ['me regalaron 100 por mi cumpleaños', { type: 'income', amount: 100, categoryId: 'gift_income' }],
  ['me hicieron un bizum de 40', { type: 'income', amount: 40 }],
  ['Ana me devolvió los 40', { type: 'income', amount: 40 }],
  ['me devolvieron 30 de Amazon', { type: 'income', amount: 30 }],
  ['reembolso de 30', { type: 'income', amount: 30 }],
  ['propinas 85', { type: 'income', amount: 85 }],
  ['saqué 85 en propinas', { type: 'income', amount: 85 }],
  ['me transfirieron 200', { type: 'income', amount: 200 }],
  ['me llegó una transferencia de 200', { type: 'income', amount: 200 }],
  ['bono de 500', { type: 'income', amount: 500 }],
  ['la devolución de Hacienda, 900', { type: 'income', amount: 900 }],
  ['me pagó Juan los 40 que le presté', { type: 'income', amount: 40 }],
];

const spentQuestions: Case[] = [
  ['¿Cuánto gasté en café?', { kind: 'question', question: { ask: 'spent', type: 'expense', target: 'Café', fallbackCategoryId: 'dining' } }],
  ['¿cuánto he gastado esta semana en café?', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'Café' } }],
  ['cuánto llevo gastado este mes', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['¿cuánto me he gastado en Uber este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'Uber' } }],
  ['¿cuánto me gasté en restaurantes?', { kind: 'question', question: { ask: 'spent', target: 'Restaurantes', categoryIds: ['dining'] } }],
  ['¿cuánto llevo gastado en el súper?', { kind: 'question', question: { ask: 'spent', target: 'Súper', categoryIds: ['groceries'] } }],
  ['¿cuánto gasté en el supermercado este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'groceries' } }],
  ['¿cuánto me costó la comida esta semana?', { kind: 'question', question: { ask: 'spent', period: 'week', categoryIds: ['groceries', 'dining'] } }],
  ['¿cuánto me ha costado el coche este año?', { kind: 'question', question: { ask: 'spent', period: 'year', target: 'Coche', fallbackCategoryId: 'transport' } }],
  ['¿en qué gasté el dinero este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['¿en qué se me fue el dinero esta semana?', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['total de café este mes', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'Café' } }],
  ['gasto en café esta semana', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'Café' } }],
  ['gastos de este mes', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['mis gastos en restaurantes este mes', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'Restaurantes' } }],
  ['lo que llevo gastado en gasolina', { kind: 'question', question: { ask: 'spent', target: 'Gasolina', fallbackCategoryId: 'transport' } }],
  ['¿cuánto llevo en café esta semana?', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'Café' } }],
  ['¿cuánto dinero se me ha ido en gasolina?', { kind: 'question', question: { ask: 'spent', target: 'Gasolina', fallbackCategoryId: 'transport' } }],
  ['¿cuánto se me fue en Uber la semana pasada?', { kind: 'question', question: { ask: 'spent', period: 'lastWeek', target: 'Uber' } }],
  ['¿cuánto he pagado de luz este año?', { kind: 'question', question: { ask: 'spent', period: 'year', target: 'Luz', fallbackCategoryId: 'utilities' } }],
  ['¿cuánto pagué de alquiler el mes pasado?', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryId: 'rent' } }],
  ['dime cuánto gasté en Amazon', { kind: 'question', question: { ask: 'spent', target: 'Amazon' } }],
  ['oye, ¿cuánto he gastado en Zara?', { kind: 'question', question: { ask: 'spent', target: 'Zara' } }],
  ['¿me puedes decir cuánto gasté en Starbucks?', { kind: 'question', question: { ask: 'spent', target: 'Starbucks' } }],
  ['¿cuánto gasto en café?', { kind: 'question', question: { ask: 'spent', target: 'Café' } }],
  ['¿cuánto estoy gastando en comida?', { kind: 'question', question: { ask: 'spent', categoryIds: ['groceries', 'dining'] } }],
  ['¿cuánto gasté hoy?', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['¿qué gasté ayer?', { kind: 'question', question: { ask: 'spent', period: 'yesterday', target: null } }],
  ['¿cuáles son mis gastos de este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['¿cuál es mi gasto en ocio este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'entertainment' } }],
  ['¿cuánto llevo gastado esta quincena?', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['¿cuánto he gastado desde que cobré?', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['¿cuánto gasté desde que me pagaron?', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['¿cuánto he gastado en este periodo de pago?', { kind: 'question', question: { ask: 'spent', period: 'budget', target: null } }],
  ['¿cuánto he gastado desde la última nómina en comer fuera?', { kind: 'question', question: { ask: 'spent', period: 'budget', categoryId: 'dining' } }],
  ['¿cuánto me he gastado en total?', { kind: 'question', question: { ask: 'spent', period: 'all', target: null } }],
  ['¿cuánto llevo gastado en lo que va de mes?', { kind: 'question', question: { ask: 'spent', period: 'month', target: null } }],
  ['¿cuánto gastamos en el súper el mes pasado?', { kind: 'question', question: { ask: 'spent', period: 'lastMonth', categoryIds: ['groceries'] } }],
  ['¿he gastado mucho en café?', { kind: 'question', question: { ask: 'spent', target: 'Café' } }],
  ['¿cuánto en Uber este mes?', { kind: 'question', question: { ask: 'spent', period: 'month', target: 'Uber' } }],
  ['¿cuánto café esta semana?', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'Café' } }],
  ['¿cuánto me he gastado en ropa este año?', { kind: 'question', question: { ask: 'spent', period: 'year', target: 'Ropa', fallbackCategoryId: 'shopping' } }],
  ['¿cuánto he gastado en suscripciones?', { kind: 'question', question: { ask: 'spent', categoryId: 'subscriptions' } }],
  ['¿cuánto gasté el año pasado?', { kind: 'question', question: { ask: 'spent', period: 'lastYear', target: null } }],
];

const leftQuestions: Case[] = [
  ['¿cuánto me queda?', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['¿cuánto dinero me queda este mes?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me queda para el súper?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['¿qué me queda para restaurantes?', { kind: 'question', question: { ask: 'left', categoryIds: ['dining'] } }],
  ['¿cuánto me queda para comer fuera?', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['¿cuánto puedo gastar todavía?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto más puedo gastar en ropa?', { kind: 'question', question: { ask: 'left', target: 'Ropa', fallbackCategoryId: 'shopping' } }],
  ['¿qué puedo gastar todavía en ocio?', { kind: 'question', question: { ask: 'left', categoryId: 'entertainment' } }],
  ['¿cuánto me queda de presupuesto?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me queda hasta que cobre?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me queda hasta fin de mes?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me sobra este mes?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me queda disponible?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cómo voy con el súper?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['¿cómo voy este mes?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿qué tal voy de gastos?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cómo ando de dinero?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿voy bien de presupuesto?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿estoy dentro del presupuesto en comer fuera?', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['¿me queda algo para restaurantes?', { kind: 'question', question: { ask: 'left', categoryIds: ['dining'] } }],
  ['¿me queda dinero para ocio?', { kind: 'question', question: { ask: 'left', categoryId: 'entertainment' } }],
  ['¿me alcanza para el súper?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['¿me llega para el mes?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto tengo para gastar?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto dinero tengo?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuál es mi saldo?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuál es mi presupuesto restante?', { kind: 'question', question: { ask: 'left', target: null } }],
  ['¿cuánto me queda del presupuesto de comida?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries', 'dining'] } }],
  ['¿cuánto me queda en el presupuesto del súper?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['¿cuánto nos queda para la compra?', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
];

const incomeQuestions: Case[] = [
  ['¿cuánto gané este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['¿cuánto cobré el mes pasado?', { kind: 'question', question: { type: 'income', period: 'lastMonth' } }],
  ['¿cuánto me entró esta semana?', { kind: 'question', question: { type: 'income', period: 'week' } }],
  ['¿cuánto he ingresado este año?', { kind: 'question', question: { type: 'income', period: 'year' } }],
  ['¿cuánto me pagaron este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['¿cuánto me han pagado este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['¿cuánto dinero me ha entrado este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['¿cuáles son mis ingresos de este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['¿cuál es mi sueldo este mes?', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['ingresos de este mes', { kind: 'question', question: { type: 'income', period: 'month', target: null } }],
  ['¿cuánto he ganado con freelance este año?', { kind: 'question', question: { type: 'income', period: 'year', categoryId: 'freelance' } }],
  ['¿cuánto llevo ganado este año?', { kind: 'question', question: { type: 'income', period: 'year', target: null } }],
  ['¿cuánto recibí de propinas esta semana?', { kind: 'question', question: { type: 'income', period: 'week' } }],
];

const goals: Case[] = [
  ['quiero ahorrar 3000 para un viaje', { kind: 'goal', amount: 3000, goalKind: 'saving' }],
  ['meta: 3000 para Japón', { kind: 'goal', amount: 3000 }],
  ['ahorrar 3000 para Japón antes de junio', { kind: 'goal', amount: 3000 }],
  ['nueva meta de 1200 para un portátil', { kind: 'goal', amount: 1200 }],
  ['quiero juntar 5000 para un coche', { kind: 'goal', amount: 5000 }],
  ['necesito ahorrar 500 para Navidad', { kind: 'goal', amount: 500 }],
  ['me gustaría ahorrar 1000 para emergencias', { kind: 'goal', amount: 1000 }],
  ['mi objetivo es ahorrar 2000 para las vacaciones', { kind: 'goal', amount: 2000 }],
  ['estoy ahorrando para un coche, 5000', { kind: 'goal', amount: 5000 }],
  ['quiero guardar 1000 para un fondo de emergencia', { kind: 'goal', amount: 1000 }],
  ['crear una meta de 800 para un viaje', { kind: 'goal', amount: 800 }],
  ['quiero apartar 600 para el dentista', { kind: 'goal', amount: 600 }],
  ['quiero pagar mi tarjeta de 2000', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['debo 2000 de la Visa', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['quiero liquidar el préstamo de 5000', { kind: 'goal', amount: 5000, goalKind: 'debt' }],
  ['saldar la deuda de 1500 para diciembre', { kind: 'goal', amount: 1500, goalKind: 'debt' }],
  ['tengo que pagar 2000 de la tarjeta de crédito', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
  ['quiero salir de deudas, 3000', { kind: 'goal', amount: 3000, goalKind: 'debt' }],
  ['tengo una deuda de 2000 con la tarjeta', { kind: 'goal', amount: 2000, goalKind: 'debt' }],
];

const reminders: Case[] = [
  ['recuérdame pagar el alquiler el día 1', { kind: 'reminder' }],
  ['acuérdame de pagar la luz mañana', { kind: 'reminder' }],
  ['avísame el viernes para pagar la tarjeta', { kind: 'reminder' }],
  ['no me dejes olvidar pagar el alquiler', { kind: 'reminder' }],
  ['ponme un recordatorio para el lunes: revisar el presupuesto', { kind: 'reminder' }],
  ['recuérdame cada viernes apuntar los tickets', { kind: 'reminder' }],
  ['que no se me olvide pagar la luz el 15', { kind: 'reminder' }],
  ['no se me puede olvidar pagar el seguro el lunes', { kind: 'reminder' }],
  ['recuerda pagar el alquiler el día 1', { kind: 'reminder' }],
  ['pon una alarma mañana a las 9 para revisar los gastos', { kind: 'reminder' }],
  ['hazme acordar de pagar la tarjeta el viernes', { kind: 'reminder' }],
  ['mándame un aviso el día 15 para pagar la Visa', { kind: 'reminder' }],
  ['tengo que pagar la luz el viernes, avísame', { kind: 'reminder' }],
  ['recordatorio: pagar la tarjeta el 15', { kind: 'reminder' }],
];

describe('es: expenses', () => runCases('es', expenses, labels));
describe('es: income', () => runCases('es', income, labels));
describe('es: spending questions', () => runCases('es', spentQuestions, labels));
describe('es: what is left', () => runCases('es', leftQuestions, labels));
describe('es: income questions', () => runCases('es', incomeQuestions, labels));
describe('es: goals', () => runCases('es', goals, labels));
describe('es: reminders', () => runCases('es', reminders, labels));

// A Spanish speaker names the goal in Spanish; the harness goal is "Trip to Japan", so these use "Viaje a Japón".
const SPANISH_GOALS = [{ ...GOALS[0], name: 'Viaje a Japón' }] as Goal[];
const contributions: [string, Record<string, unknown>][] = [
  ['puse 100 para Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['aparté 100 para el viaje a Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['ahorré 100 para Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['guardé 100 para el viaje', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['separé 100 para Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['aporté 100 al viaje a Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['metí 100 en la hucha de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['transferí 100 a mis ahorros de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['añadí 100 a la meta de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['100 al fondo de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['100 euros a la hucha del viaje a Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['mandé 100 a la cuenta de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['ayer puse 100 para Japón', { kind: 'contribution', amount: 100, goalId: 'g1', occurredAt: '2026-09-15' }],
];

describe('es: paying into a goal', () => {
  it.each(contributions)('%s', (text, expected) => {
    const r = parseOne(text, 'es', labels, SPANISH_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

describe('es: an amount keeps a sentence an entry', () => {
  it.each([
    ['gasto en café 3', 3],
    ['total del súper 85', 85],
    ['gastos varios 20', 20],
    ['ingresos extra 200', 200],
  ])('%s', (text, amount) => {
    const r = parseOne(text, 'es', labels);
    expect(r[0]).toMatchObject({ kind: 'transaction', amount });
  });
});

/** Fixing the last entry by voice. Only the new amount, category or date may follow the lead; anything else is a new entry. */
const corrections: Case[] = [
  // Removing it: the whole sentence says so.
  ['bórralo', { kind: 'correction', correction: { remove: true, amount: null } }],
  ['bórrala', { kind: 'correction', correction: { remove: true } }],
  ['borra eso', { kind: 'correction', correction: { remove: true } }],
  ['bórrame eso', { kind: 'correction', correction: { remove: true } }],
  ['elimina el último', { kind: 'correction', correction: { remove: true } }],
  ['elimínalo', { kind: 'correction', correction: { remove: true } }],
  ['borra el último gasto', { kind: 'correction', correction: { remove: true } }],
  ['elimina la última entrada', { kind: 'correction', correction: { remove: true } }],
  ['borra lo último', { kind: 'correction', correction: { remove: true } }],
  ['borra lo que acabo de decir', { kind: 'correction', correction: { remove: true } }],
  ['quita eso', { kind: 'correction', correction: { remove: true } }],
  ['quita el último', { kind: 'correction', correction: { remove: true } }],
  ['olvídalo', { kind: 'correction', correction: { remove: true } }],
  ['olvídalo, por favor', { kind: 'correction', correction: { remove: true } }],
  ['déjalo', { kind: 'correction', correction: { remove: true } }],
  ['déjalo estar', { kind: 'correction', correction: { remove: true } }],
  ['no importa', { kind: 'correction', correction: { remove: true } }],
  ['cancela eso', { kind: 'correction', correction: { remove: true } }],
  ['cancélalo', { kind: 'correction', correction: { remove: true } }],
  ['anula eso', { kind: 'correction', correction: { remove: true } }],
  ['deshazlo', { kind: 'correction', correction: { remove: true } }],
  ['ups, borra eso', { kind: 'correction', correction: { remove: true } }],
  ['no, bórralo', { kind: 'correction', correction: { remove: true } }],
  // A new amount.
  ['en realidad fueron 14', { kind: 'correction', correction: { remove: false, amount: 14, categoryId: null, date: null } }],
  ['en realidad 14', { kind: 'correction', correction: { amount: 14 } }],
  ['en realidad eran 14 euros', { kind: 'correction', correction: { amount: 14 } }],
  ['no, 14', { kind: 'correction', correction: { amount: 14 } }],
  ['no, catorce', { kind: 'correction', correction: { amount: 14 } }],
  ['no, eran 14', { kind: 'correction', correction: { amount: 14 } }],
  ['perdón, 14', { kind: 'correction', correction: { amount: 14 } }],
  ['perdona, fueron 20', { kind: 'correction', correction: { amount: 20 } }],
  ['uy, 14,50', { kind: 'correction', correction: { amount: 14.5 } }],
  ['me equivoqué, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['cámbialo a 14', { kind: 'correction', correction: { amount: 14 } }],
  ['cámbialo a 14 euros', { kind: 'correction', correction: { amount: 14 } }],
  ['corrígelo a 14', { kind: 'correction', correction: { amount: 14 } }],
  ['ponlo en 14', { kind: 'correction', correction: { amount: 14 } }],
  ['déjalo en 14', { kind: 'correction', correction: { amount: 14 } }],
  ['que sean 14', { kind: 'correction', correction: { amount: 14 } }],
  ['que sean catorce', { kind: 'correction', correction: { amount: 14 } }],
  ['que sea 14', { kind: 'correction', correction: { amount: 14 } }],
  ['quería decir 15', { kind: 'correction', correction: { amount: 15 } }],
  ['quise decir 15', { kind: 'correction', correction: { amount: 15 } }],
  ['o sea, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['mejor dicho 15', { kind: 'correction', correction: { amount: 15 } }],
  ['eso debería ser 20', { kind: 'correction', correction: { amount: 20 } }],
  ['corrección: 14', { kind: 'correction', correction: { amount: 14 } }],
  // A new category.
  ['ponlo en restaurantes', { kind: 'correction', correction: { categoryId: 'dining', amount: null } }],
  ['cámbialo a supermercado', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['cámbialo a comer fuera', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['cámbialo a café', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['ponlo en compras', { kind: 'correction', correction: { categoryId: 'shopping' } }],
  ['ponlo como restaurante', { kind: 'correction', correction: { categoryId: 'dining' } }],
  ['pásalo a transporte', { kind: 'correction', correction: { categoryId: 'transport' } }],
  ['muévelo a ocio', { kind: 'correction', correction: { categoryId: 'entertainment' } }],
  ['mételo en supermercado', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['cambia eso a supermercado', { kind: 'correction', correction: { categoryId: 'groceries' } }],
  ['eso va en restaurantes', { kind: 'correction', correction: { categoryId: 'dining' } }],
  // A new date.
  ['eso fue ayer', { kind: 'correction', correction: { date: '2026-09-15', amount: null } }],
  ['fue ayer', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['en realidad fue ayer', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['eso fue anteayer', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['eso fue el lunes', { kind: 'correction', correction: { date: '2026-09-14' } }],
  // Both at once.
  ['cámbialo a 14 y supermercado', { kind: 'correction', correction: { amount: 14, categoryId: 'groceries' } }],
];

/** Sentences that sound a little like a correction but are new entries. */
const notCorrections: Case[] = [
  ['en realidad gasté 14 en comida', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ['en realidad pagué 14 por el almuerzo', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ['no, gasté 14', { kind: 'transaction', amount: 14 }],
  ['eso fue 40 de gasolina', { kind: 'transaction', amount: 40, categoryId: 'transport' }],
  ['fue 12 el almuerzo', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['era 12 de almuerzo', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['cancela Netflix 15,99', { kind: 'transaction', amount: 15.99, categoryId: 'subscriptions' }],
  ['quita 20 de ahorros', { kind: 'transaction', amount: 20 }],
  ['borré 20 de ahorros', { kind: 'transaction', amount: 20 }],
  ['pon 14 de café', { kind: 'transaction', amount: 14, categoryId: 'dining' }],
  ['mejor café 4', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ['o sea que gasté 20', { kind: 'transaction', amount: 20 }],
  ['perdón por la espera 12', { kind: 'transaction', amount: 12 }],
  ['ponlo en el viaje a Japón', { kind: 'transaction' }],
];

describe('es: corrections', () => runCases('es', corrections, labels));
describe('es: sentences that are not corrections', () => runCases('es', notCorrections, labels));

/** Comparing with last time, where most of it went, and whether something fits. */
const insights: Case[] = [
  // Comparing: "than last month" names the base, so the period is this month.
  ['¿gasté más que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿he gastado más que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿me gasté más que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month' } }],
  ['¿gastamos más que el año pasado?', { kind: 'question', question: { ask: 'compare', period: 'year', target: null } }],
  ['¿cómo voy comparado con el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿cómo voy en comparación con el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿qué tal voy respecto al mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['comparado con el mes pasado, ¿cómo voy?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿cómo va este mes comparado con el anterior?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿estoy gastando más en restaurantes que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryIds: ['dining'] } }],
  ['¿gasté más que el mes pasado en restaurantes?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryIds: ['dining'] } }],
  ['¿gasté menos en el súper que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryIds: ['groceries'] } }],
  ['¿gasté más en ocio que el mes pasado?', { kind: 'question', question: { ask: 'compare', period: 'month', categoryId: 'entertainment' } }],
  ['¿estoy gastando menos en comida que el mes pasado?', { kind: 'question', question: { ask: 'compare', categoryIds: ['groceries', 'dining'] } }],
  ['¿gasto más o menos que la semana pasada?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['¿estoy gastando más que la semana pasada?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['¿gasté más esta semana que la semana pasada?', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['¿mis gastos han subido este mes?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿han subido mis gastos este mes?', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['¿estoy gastando más de lo normal?', { kind: 'question', question: { ask: 'compare', target: null } }],
  ['¿gasto más que de costumbre?', { kind: 'question', question: { ask: 'compare', target: null } }],
  // Where most of it went.
  ['¿en qué gasté más?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿en qué gastamos más?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿en qué estoy gastando más este mes?', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['¿en qué he gastado más este mes?', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['¿en qué me gasté más el finde?', { kind: 'question', question: { ask: 'top', period: 'weekend', target: null } }],
  ['¿en qué se me va más el dinero?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿en qué categoría gasto más?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿a dónde se fue la mayor parte de mi dinero?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿dónde se me va el dinero?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿adónde se fue mi sueldo el mes pasado?', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['¿a dónde se va la plata?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿dónde se fue la lana?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿dónde gasto más?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿cuál es mi mayor gasto?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿cuál fue mi mayor gasto el mes pasado?', { kind: 'question', question: { ask: 'top', period: 'lastMonth', target: null } }],
  ['¿cuáles son mis mayores gastos?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿cuál es mi gasto más grande este mes?', { kind: 'question', question: { ask: 'top', period: 'month', target: null } }],
  ['¿cuál es la categoría en la que más gasto?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿qué es lo que más gasto?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['¿qué me cuesta más?', { kind: 'question', question: { ask: 'top', target: null } }],
  ['mi mayor gasto este año', { kind: 'question', question: { ask: 'top', period: 'year', target: null } }],
  // Whether something fits: the amount is the price.
  ['¿me alcanza para una chaqueta de 200?', { kind: 'question', question: { ask: 'afford', price: 200, period: 'budget', target: 'Chaqueta', fallbackCategoryId: 'shopping' } }],
  ['¿puedo gastar 80 en la cena?', { kind: 'question', question: { ask: 'afford', price: 80, target: 'Cena', fallbackCategoryId: 'dining' } }],
  ['¿puedo gastarme 80 en una cena?', { kind: 'question', question: { ask: 'afford', price: 80, fallbackCategoryId: 'dining' } }],
  ['¿puedo permitirme 200 en zapatos?', { kind: 'question', question: { ask: 'afford', price: 200, target: 'Zapatos', fallbackCategoryId: 'shopping' } }],
  ['¿puedo permitirme doscientos en zapatos?', { kind: 'question', question: { ask: 'afford', price: 200 } }],
  ['¿puedo permitirme 15 euros en un libro?', { kind: 'question', question: { ask: 'afford', price: 15, target: 'Libro' } }],
  ['¿me puedo permitir unos zapatos de 120?', { kind: 'question', question: { ask: 'afford', price: 120, target: 'Zapatos' } }],
  ['¿me puedo gastar 40 en gasolina?', { kind: 'question', question: { ask: 'afford', price: 40, fallbackCategoryId: 'transport' } }],
  ['¿está bien gastar 50 en el súper?', { kind: 'question', question: { ask: 'afford', price: 50, categoryIds: ['groceries'] } }],
  ['¿está bien si gasto 50 en el súper?', { kind: 'question', question: { ask: 'afford', price: 50, categoryIds: ['groceries'] } }],
  ['¿50 está bien para el súper?', { kind: 'question', question: { ask: 'afford', price: 50, categoryIds: ['groceries'] } }],
  ['¿estaría bien gastar 30 en el cine?', { kind: 'question', question: { ask: 'afford', price: 30, fallbackCategoryId: 'entertainment' } }],
  ['¿tengo suficiente para un portátil de 1200?', { kind: 'question', question: { ask: 'afford', price: 1200, target: 'Portátil', fallbackCategoryId: 'shopping' } }],
  ['¿tengo dinero suficiente para unas zapatillas de 90?', { kind: 'question', question: { ask: 'afford', price: 90, target: 'Zapatillas' } }],
  ['¿tengo para 200 en ropa?', { kind: 'question', question: { ask: 'afford', price: 200, target: 'Ropa' } }],
  ['¿me llega para un vuelo de 300?', { kind: 'question', question: { ask: 'afford', price: 300, fallbackCategoryId: 'transport' } }],
  ['¿me da para un concierto de 75?', { kind: 'question', question: { ask: 'afford', price: 75, fallbackCategoryId: 'entertainment' } }],
  ['¿nos alcanza para una cena de 100?', { kind: 'question', question: { ask: 'afford', price: 100, fallbackCategoryId: 'dining' } }],
  ['¿me alcanza el sueldo para un portátil de 800?', { kind: 'question', question: { ask: 'afford', price: 800, target: 'Portátil' } }],
  ['¿puedo comprar unos tenis de 1500 pesos?', { kind: 'question', question: { ask: 'afford', price: 1500, target: 'Tenis' } }],
  ['¿podemos gastar 100 en restaurantes este mes?', { kind: 'question', question: { ask: 'afford', price: 100, period: 'budget', categoryIds: ['dining'] } }],
  ['¿hay margen para 50 en ocio?', { kind: 'question', question: { ask: 'afford', price: 50, categoryId: 'entertainment' } }],
  ['¿debería gastar 300 en un abrigo?', { kind: 'question', question: { ask: 'afford', price: 300, target: 'Abrigo' } }],
  ['¿cabe una cena de 60 en el presupuesto?', { kind: 'question', question: { ask: 'afford', price: 60, target: 'Cena' } }],
  ['¿puedo gastar 25?', { kind: 'question', question: { ask: 'afford', price: 25, target: null } }],
  ['¿me alcanza para 200?', { kind: 'question', question: { ask: 'afford', price: 200, target: null } }],
  // Without an amount, the same leads ask what is left.
  ['¿me puedo permitir salir a cenar?', { kind: 'question', question: { ask: 'left', period: 'budget', categoryIds: ['dining'] } }],
  ['¿me alcanza para salir a cenar?', { kind: 'question', question: { ask: 'left', categoryIds: ['dining'] } }],
  ['¿tengo suficiente para salir a cenar?', { kind: 'question', question: { ask: 'left', categoryIds: ['dining'] } }],
  ['¿puedo gastar en ropa?', { kind: 'question', question: { ask: 'left', fallbackCategoryId: 'shopping' } }],
  // "Más o menos" asks roughly how much, not for a comparison.
  ['¿cuánto gasté más o menos en café?', { kind: 'question', question: { ask: 'spent', target: 'Café', fallbackCategoryId: 'dining' } }],
];

/** Entries that carry those words and an amount stay entries. */
const insightsStayEntries: Case[] = [
  ['compré una chaqueta de 200', { kind: 'transaction', amount: 200, categoryId: 'shopping' }],
  ['me compré unos tenis de 1500 pesos', { kind: 'transaction', amount: 1500, categoryId: 'shopping' }],
  ['más café 4', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ['otro café más 3', { kind: 'transaction', amount: 3, categoryId: 'dining' }],
  ['gasté 20 más en gasolina', { kind: 'transaction', amount: 20, categoryId: 'transport' }],
  ['más o menos 20 de gasolina', { kind: 'transaction', amount: 20, categoryId: 'transport' }],
  ['lo más caro 30', { kind: 'transaction', amount: 30 }],
  ['regalo para mi hermano mayor 30', { kind: 'transaction', amount: 30, categoryId: 'shopping' }],
  ['comida 12, está bien', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['debo pagar 50 de luz', { kind: 'transaction', amount: 50, categoryId: 'utilities' }],
  ['me alcanzó para una cena de 60', { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  ['me permití una cena de 60', { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  ['zapatos 120, me lo puedo permitir', { kind: 'transaction', amount: 120, categoryId: 'shopping' }],
  ['tengo 20 en efectivo', { kind: 'transaction', amount: 20 }],
];

describe('es: comparing, the most, affording', () => runCases('es', insights, labels));
describe('es: entries near those words stay entries', () => runCases('es', insightsStayEntries, labels));

/**
 * Everyday Spanish from Spain and Latin America, in the register people speak (fillers, run-ons, regional words).
 * Each sentence says what it must become; a wrong reading is fixed in the pack, never by softening the sentence.
 */

/** Putting money aside with no goal named: a transfer to Savings. The verb is not part of the note. */
const savingEntries: Case[] = [
  ['guardé 200', { kind: 'transaction', type: 'expense', amount: 200, categoryId: 'savings', note: null }],
  ['aparté 100 para el viaje', { kind: 'transaction', amount: 100, categoryId: 'savings', note: 'Viaje' }],
  ['metí 50 en el ahorro', { kind: 'transaction', amount: 50, categoryId: 'savings', note: null }],
  ['pasé 300 a la cuenta de ahorros', { kind: 'transaction', amount: 300, categoryId: 'savings', note: 'Cuenta de ahorros' }],
  ['ahorré 50 hoy', { kind: 'transaction', amount: 50, categoryId: 'savings', occurredAt: '2026-09-16' }],
  ['puse 100 en el fondo de emergencia', { kind: 'transaction', amount: 100, categoryId: 'savings', note: 'Fondo de emergencia' }],
  ['metí 100 en la alcancía', { kind: 'transaction', amount: 100, categoryId: 'savings', note: 'Alcancía' }],
  ['guardé 150 en la hucha', { kind: 'transaction', amount: 150, categoryId: 'savings', note: 'Hucha' }],
  ['aparté 200 para imprevistos', { kind: 'transaction', amount: 200, categoryId: 'savings', note: 'Imprevistos' }],
  // An amount per period is a pace, not the goal's total: the card asks for the total.
  ['quiero apartar 200 al mes para un coche', { kind: 'goal', amount: null, goalName: 'Coche', goalKind: 'saving', hints: ['hint.goalPace', 'hint.goalNoDate'] }],
  ['quiero ahorrar 50 a la semana', { kind: 'goal', amount: null, goalName: null }],
  ['ahorrar 100 cada mes para las vacaciones', { kind: 'goal', amount: null, goalName: 'Vacaciones' }],
  ['quiero guardar 300 por mes para un depa', { kind: 'goal', amount: null, goalName: 'Depa' }],
  ['quiero juntar 500 por quincena para la boda', { kind: 'goal', amount: null, goalName: 'Boda' }],
];

/** Spending the way it is actually said. */
const colloquialExpenses: Case[] = [
  ['me gasté 40 en gasolina', { kind: 'transaction', type: 'expense', amount: 40, categoryId: 'transport', note: 'Gasolina' }],
  ['se me fueron 40 en gasolina', { kind: 'transaction', amount: 40, categoryId: 'transport', note: 'Gasolina' }],
  ['dejé 30 en el súper', { kind: 'transaction', amount: 30, categoryId: 'groceries', note: 'Súper' }],
  ['me clavaron 60 en el taller', { kind: 'transaction', amount: 60, categoryId: 'transport', note: 'Taller' }],
  ['solté 200 en el dentista', { kind: 'transaction', amount: 200, categoryId: 'health', note: 'Dentista' }],
  ['pagué la luz 80', { kind: 'transaction', amount: 80, categoryId: 'utilities', note: 'Luz' }],
  ['cargué nafta 40', { kind: 'transaction', amount: 40, categoryId: 'transport', note: 'Nafta' }],
  ['la cuenta del restaurante 45', { kind: 'transaction', amount: 45, categoryId: 'dining' }],
  ['le di 20 al taxi', { kind: 'transaction', amount: 20, categoryId: 'transport', note: 'Taxi' }],
  ['pasé por el chino y 15', { kind: 'transaction', type: 'expense', amount: 15, note: 'Chino' }],
  ['una birra 5', { kind: 'transaction', amount: 5, categoryId: 'dining', note: 'Birra' }],
  ['las chelas 30', { kind: 'transaction', amount: 30, categoryId: 'dining', note: 'Chelas' }],
  ['la gasolina 40', { kind: 'transaction', amount: 40, categoryId: 'transport' }],
  ['el agua 25', { kind: 'transaction', amount: 25, categoryId: 'utilities', note: 'Agua' }],
  ['el cole de los niños 300', { kind: 'transaction', amount: 300, categoryId: 'shopping' }],
  ['la mensualidad del gym 40', { kind: 'transaction', amount: 40, categoryId: 'health' }],
  ['me salió 25 el taxi', { kind: 'transaction', amount: 25, categoryId: 'transport', note: 'Taxi' }],
  ['un uber de 12 pesos', { kind: 'transaction', amount: 12, categoryId: 'transport', note: 'Uber' }],
  ['se me fue un dineral en el súper, 150', { kind: 'transaction', amount: 150, categoryId: 'groceries' }],
  ['compré el mandado 450', { kind: 'transaction', amount: 450, categoryId: 'groceries', note: 'Mandado' }],
  ['pagué el internet 600', { kind: 'transaction', amount: 600, categoryId: 'utilities', note: 'Internet' }],
  ['me cobraron 15 de comisión', { kind: 'transaction', type: 'expense', amount: 15, note: 'Comisión' }],
  ['tomé un camión 12', { kind: 'transaction', amount: 12, categoryId: 'transport', note: 'Camión' }],
  ['le pagué 50 a la señora de la limpieza', { kind: 'transaction', type: 'expense', amount: 50, note: 'Señora de la limpieza' }],
  ['fui al súper y gasté 85', { kind: 'transaction', amount: 85, categoryId: 'groceries', note: 'Súper' }],
  ['hoy comí fuera 12', { kind: 'transaction', amount: 12, categoryId: 'dining', occurredAt: '2026-09-16' }],
  ['desayuné por 6', { kind: 'transaction', amount: 6, categoryId: 'dining' }],
  ['una cañita y una tapa 7', { kind: 'transaction', amount: 7, categoryId: 'dining' }],
  ['un menú del día 12', { kind: 'transaction', amount: 12, categoryId: 'dining', note: 'Menú del día' }],
  ['pedí unas pizzas 30', { kind: 'transaction', amount: 30, categoryId: 'dining', note: 'Pizzas' }],
  ['cena con los amigos 45', { kind: 'transaction', amount: 45, categoryId: 'dining' }],
  ['la boleta de la luz 45', { kind: 'transaction', amount: 45, categoryId: 'utilities' }],
  ['el pesero 8', { kind: 'transaction', amount: 8, categoryId: 'transport', note: 'Pesero' }],
  ['el bondi 150', { kind: 'transaction', amount: 150, categoryId: 'transport', note: 'Bondi' }],
  ['la verdulería 20', { kind: 'transaction', amount: 20, categoryId: 'groceries' }],
  ['pagué la tenencia 3000', { kind: 'transaction', amount: 3000, categoryId: 'transport', note: 'Tenencia' }],
  ['unas empanadas 12', { kind: 'transaction', amount: 12, categoryId: 'dining', note: 'Empanadas' }],
  ['el remis 500', { kind: 'transaction', amount: 500, categoryId: 'transport', note: 'Remis' }],
  ['la prepaga 15000', { kind: 'transaction', amount: 15000, categoryId: 'health', note: 'Prepaga' }],
  // A small number right before a thing, with the money after it, is a count: the note keeps it.
  ['2 cafés 8', { kind: 'transaction', amount: 8, categoryId: 'dining', note: '2 cafés' }],
  ['tres cervezas 12', { kind: 'transaction', amount: 12, categoryId: 'dining', note: '3 cervezas' }],
  ['dos entradas de cine 20', { kind: 'transaction', amount: 20, categoryId: 'entertainment', note: '2 entradas de cine' }],
  ['un café a dos con veinte', { kind: 'transaction', amount: 2.2, categoryId: 'dining', note: 'Café' }],
];

/** Money coming in: pay in its regional names, and the verb alone meaning a paycheck. */
const colloquialIncome: Case[] = [
  ['cobré 2400', { kind: 'transaction', type: 'income', amount: 2400, categoryId: 'salary' }],
  ['cobré, 1500', { type: 'income', amount: 1500, categoryId: 'salary' }],
  ['me pagaron hoy 2400', { type: 'income', amount: 2400, categoryId: 'salary', occurredAt: '2026-09-16' }],
  ['me cayó la nómina 2400', { type: 'income', amount: 2400, categoryId: 'salary', note: 'Nómina' }],
  ['me depositaron 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me consignaron 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me consignaron el sueldo 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me entró 300 de un cliente', { type: 'income', amount: 300, categoryId: 'freelance' }],
  ['las propinas 85', { type: 'income', amount: 85 }],
  ['vendí la bici por 120', { type: 'income', amount: 120, note: 'Bici' }],
  ['me devolvieron 32', { type: 'income', amount: 32 }],
  ['me regalaron 50', { type: 'income', amount: 50, categoryId: 'gift_income' }],
  ['el aguinaldo 1000', { type: 'income', amount: 1000 }],
  ['la quincena 1200', { type: 'income', amount: 1200, categoryId: 'salary' }],
  ['me cayeron 12000 de la quincena', { type: 'income', amount: 12000, categoryId: 'salary' }],
  ['ya me pagaron, 2400', { type: 'income', amount: 2400, categoryId: 'salary', note: null }],
  ['me llegó el sueldo, 2400', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me ingresaron 2400 de la nómina', { type: 'income', amount: 2400, categoryId: 'salary' }],
  ['me entraron 2400', { type: 'income', amount: 2400 }],
  ['cobré el paro 900', { type: 'income', amount: 900, categoryId: 'other_income' }],
  ['me pagaron las horas extra 300', { type: 'income', amount: 300, note: 'Horas extra' }],
  ['me cayó un bono de 500', { type: 'income', amount: 500, note: 'Bono' }],
  ['vendí el sofá viejo por 80', { type: 'income', amount: 80, note: 'Sofá viejo' }],
  ['me transfirió mi hermano 100', { type: 'income', amount: 100 }],
  ['cobré una factura de 600', { type: 'income', amount: 600, categoryId: 'freelance' }],
  ['me pagó un cliente 450', { type: 'income', amount: 450, categoryId: 'freelance' }],
  ['me dieron 200 de aguinaldo', { type: 'income', amount: 200 }],
  ['me regalaron 50 por mi cumple', { type: 'income', amount: 50, categoryId: 'gift_income' }],
  ['cobré la beca, 400', { type: 'income', amount: 400, categoryId: 'other_income' }],
  ['me devolvió Hacienda 320', { type: 'income', amount: 320, note: 'Hacienda' }],
];

/** Questions without the question marks, as dictation writes them. */
const spokenQuestions: Case[] = [
  ['cuánto llevo gastado esta semana', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['cuánto llevo gastado hoy', { kind: 'question', question: { ask: 'spent', period: 'today', target: null } }],
  ['cuánto llevo esta semana', { kind: 'question', question: { ask: 'spent', period: 'week', target: null } }],
  ['cuánto me gasté el finde', { kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } }],
  ['cuánto gasté el fin de semana', { kind: 'question', question: { ask: 'spent', period: 'weekend', target: null } }],
  ['y de gasolina cuánto llevo', { kind: 'question', question: { ask: 'spent', target: 'Gasolina', fallbackCategoryId: 'transport' } }],
  ['cuánto he gastado en los últimos 10 días', { kind: 'question', question: { ask: 'spent', period: 'recentDays', days: 10, target: null } }],
  ['cuánto llevo en el súper esta quincena', { kind: 'question', question: { ask: 'spent', period: 'budget', categoryIds: ['groceries'] } }],
  ['cuánto me he gastado en el perro', { kind: 'question', question: { ask: 'spent', target: 'Perro', fallbackCategoryId: 'shopping' } }],
  // The plural still finds the word: "cafés" is "café".
  ['cuánto se me va en cafés', { kind: 'question', question: { ask: 'spent', target: 'Cafés', fallbackCategoryId: 'dining' } }],
  // Asked per period, answered with the current one.
  ['cuánto gasto al mes en suscripciones', { kind: 'question', question: { ask: 'spent', period: 'month', categoryId: 'subscriptions' } }],
  ['cuánto gasto a la semana en café', { kind: 'question', question: { ask: 'spent', period: 'week', target: 'Café' } }],
  ['cuánto gasto por semana en el súper', { kind: 'question', question: { ask: 'spent', period: 'week', categoryIds: ['groceries'] } }],
  ['cuánto me cuesta el coche al año', { kind: 'question', question: { ask: 'spent', period: 'year', target: 'Coche', fallbackCategoryId: 'transport' } }],
  ['en qué se me fue el dinero', { kind: 'question', question: { ask: 'spent', target: null } }],
  ['qué me queda', { kind: 'question', question: { ask: 'left', period: 'budget', target: null } }],
  ['cuánto me queda para la compra', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['cuánto me queda para comer fuera este mes', { kind: 'question', question: { ask: 'left', categoryId: 'dining' } }],
  ['cuánto me queda hasta la próxima quincena', { kind: 'question', question: { ask: 'left', target: null } }],
  ['qué me queda del súper', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['cuánto tengo todavía para ocio', { kind: 'question', question: { ask: 'left', categoryId: 'entertainment' } }],
  ['voy bien con el súper', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['cómo voy de súper', { kind: 'question', question: { ask: 'left', categoryIds: ['groceries'] } }],
  ['qué tal voy con el presupuesto', { kind: 'question', question: { ask: 'left', target: null } }],
  ['me queda algo para salir', { kind: 'question', question: { ask: 'left', target: 'Salir' } }],
  ['gasté más que el mes pasado', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['gasté más esta semana que la pasada', { kind: 'question', question: { ask: 'compare', period: 'week', target: null } }],
  ['estoy gastando más que el mes pasado', { kind: 'question', question: { ask: 'compare', period: 'month', target: null } }],
  ['cuál fue mi mayor gasto', { kind: 'question', question: { ask: 'top', target: null } }],
  ['en qué gasto más', { kind: 'question', question: { ask: 'top', target: null } }],
  ['dónde se me va la plata', { kind: 'question', question: { ask: 'top', target: null } }],
  ['cuál es mi gasto más grande', { kind: 'question', question: { ask: 'top', target: null } }],
  ['qué es lo que más me cuesta', { kind: 'question', question: { ask: 'top', target: null } }],
  ['me alcanza para unos zapatos de 80', { kind: 'question', question: { ask: 'afford', price: 80, target: 'Zapatos', fallbackCategoryId: 'shopping' } }],
  ['me alcanza para una cena de 60', { kind: 'question', question: { ask: 'afford', price: 60, target: 'Cena', fallbackCategoryId: 'dining' } }],
  ['puedo gastarme 100 en ropa', { kind: 'question', question: { ask: 'afford', price: 100, target: 'Ropa' } }],
  ['me da para un viaje de 300', { kind: 'question', question: { ask: 'afford', price: 300, target: 'Viaje' } }],
  ['tengo para unas zapatillas de 90', { kind: 'question', question: { ask: 'afford', price: 90, target: 'Zapatillas' } }],
  ['cuánto gané este mes', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['cuánto me entró este mes', { kind: 'question', question: { type: 'income', period: 'month' } }],
  ['cuánto he cobrado este año', { kind: 'question', question: { type: 'income', period: 'year' } }],
  ['cuánto me ha entrado esta semana', { kind: 'question', question: { type: 'income', period: 'week' } }],
];

/** Fixing by voice, the entry named or not. The target is matched later as a plain substring of the note or category. */
const spokenCorrections: Case[] = [
  ['no, eran 14', { kind: 'correction', correction: { remove: false, target: null, amount: 14 } }],
  ['no eran 14, eran 15', { kind: 'correction', correction: { remove: false, target: null, amount: 15 } }],
  ['digo, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['en realidad fueron 14,50', { kind: 'correction', correction: { amount: 14.5 } }],
  ['no no, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['ponlo en restaurantes', { kind: 'correction', correction: { target: null, categoryId: 'dining' } }],
  ['mejor ponlo en ocio', { kind: 'correction', correction: { target: null, categoryId: 'entertainment' } }],
  ['eso fue ayer', { kind: 'correction', correction: { target: null, date: '2026-09-15' } }],
  ['eso era de ayer', { kind: 'correction', correction: { date: '2026-09-15' } }],
  ['eso fue el lunes pasado', { kind: 'correction', correction: { date: '2026-09-14' } }],
  ['borra eso', { kind: 'correction', correction: { remove: true, target: null } }],
  ['nada, bórralo', { kind: 'correction', correction: { remove: true, target: null } }],
  ['eso no, quítalo', { kind: 'correction', correction: { remove: true, target: null } }],
  // Naming the entry.
  ['quita el uber', { kind: 'correction', correction: { remove: true, target: 'uber' } }],
  ['borra el de spotify', { kind: 'correction', correction: { remove: true, target: 'spotify' } }],
  ['borra el gasto de spotify', { kind: 'correction', correction: { remove: true, target: 'spotify' } }],
  ['quita lo del uber', { kind: 'correction', correction: { remove: true, target: 'uber' } }],
  ['elimina el café', { kind: 'correction', correction: { remove: true, target: 'café' } }],
  ['cambia el almuerzo a 15', { kind: 'correction', correction: { remove: false, target: 'almuerzo', amount: 15 } }],
  ['cambia el café a 4,50', { kind: 'correction', correction: { target: 'café', amount: 4.5 } }],
  ['corrige el uber a 32', { kind: 'correction', correction: { target: 'uber', amount: 32 } }],
  ['el uber era 32', { kind: 'correction', correction: { target: 'uber', amount: 32 } }],
  ['el uber fueron 32, no 23', { kind: 'correction', correction: { target: 'uber', amount: 32 } }],
  ['pon el almuerzo en restaurantes', { kind: 'correction', correction: { target: 'almuerzo', categoryId: 'dining' } }],
  ['pasa lo del uber a transporte', { kind: 'correction', correction: { target: 'uber', categoryId: 'transport' } }],
  ['el almuerzo va en restaurantes', { kind: 'correction', correction: { target: 'almuerzo', categoryId: 'dining' } }],
  ['lo del uber fue ayer', { kind: 'correction', correction: { target: 'uber', date: '2026-09-15' } }],
];

/** Reminders as said, with voseo and the minutes in words. */
const spokenReminders: Case[] = [
  ['recuérdame el alquiler el 1', { kind: 'reminder', reminderText: 'El alquiler', occurredAt: '2026-10-01' }],
  ['que no se me olvide la luz el viernes', { kind: 'reminder', reminderText: 'La luz', occurredAt: '2026-09-18' }],
  ['avísame a las 8 para apuntar los tickets', { kind: 'reminder', reminderText: 'Apuntar los tickets', reminderTime: '08:00' }],
  ['recuérdame todos los lunes revisar el presupuesto', { kind: 'reminder', reminderText: 'Revisar el presupuesto', reminderRepeat: 'weekly', occurredAt: '2026-09-21' }],
  ['recuérdame mañana a las 9 pagar el gas', { kind: 'reminder', reminderText: 'Pagar el gas', reminderTime: '09:00', occurredAt: '2026-09-17' }],
  ['acuérdate de la tarjeta el 15', { kind: 'reminder', reminderText: 'La tarjeta', occurredAt: '2026-10-15' }],
  ['recordame pagar el alquiler el primero', { kind: 'reminder', reminderText: 'Pagar el alquiler', occurredAt: '2026-10-01' }],
  ['acordate de pagar la luz el viernes', { kind: 'reminder', reminderText: 'Pagar la luz', occurredAt: '2026-09-18' }],
  ['que no me olvide de la tarjeta el 15', { kind: 'reminder', reminderText: 'La tarjeta', occurredAt: '2026-10-15' }],
  ['avisame el 5 de cada mes de la hipoteca', { kind: 'reminder', reminderText: 'La hipoteca', reminderRepeat: 'monthly', occurredAt: '2026-10-05' }],
  ['recuérdame cada día apuntar los gastos', { kind: 'reminder', reminderText: 'Apuntar los gastos', reminderRepeat: 'daily' }],
  ['que no se me pase el seguro del coche el 20', { kind: 'reminder', reminderText: 'El seguro del coche', occurredAt: '2026-09-20' }],
  ['recuérdame el viernes a las 6 de la tarde pasar al banco', { kind: 'reminder', reminderText: 'Pasar al banco', reminderTime: '18:00', occurredAt: '2026-09-18' }],
  ['recuérdame pagar la luz pasado mañana', { kind: 'reminder', reminderText: 'Pagar la luz', occurredAt: '2026-09-18' }],
  ['recuérdame a las 9 y media apuntar los tickets', { kind: 'reminder', reminderText: 'Apuntar los tickets', reminderTime: '09:30' }],
  ['recuérdame a las 8 y cuarto pagar el gas', { kind: 'reminder', reminderText: 'Pagar el gas', reminderTime: '08:15' }],
  ['recuérdame el domingo por la noche revisar el presupuesto', { kind: 'reminder', reminderText: 'Revisar el presupuesto', reminderTime: '19:00', occurredAt: '2026-09-20' }],
];

/** Amounts the way dictation writes them: "con" between two numbers is the decimal point. */
const dictatedAmounts: Case[] = [
  ['cuatro con cincuenta de café', { kind: 'transaction', amount: 4.5, categoryId: 'dining', note: 'Café' }],
  ['café 4 50', { kind: 'transaction', amount: 4.5, categoryId: 'dining', note: 'Café' }],
  ['café 12 con 50', { kind: 'transaction', amount: 12.5, categoryId: 'dining', note: 'Café' }],
  ['doce con cincuenta en el almuerzo', { kind: 'transaction', amount: 12.5, categoryId: 'dining', note: 'Almuerzo' }],
  ['almuerzo 12,50', { kind: 'transaction', amount: 12.5, categoryId: 'dining' }],
  ['veinte pesos de taxi', { kind: 'transaction', amount: 20, categoryId: 'transport', note: 'Taxi' }],
  ['cien de súper', { kind: 'transaction', amount: 100, categoryId: 'groceries' }],
  ['mil doscientos de alquiler', { kind: 'transaction', amount: 1200, categoryId: 'rent' }],
  ['tres mil quinientos de renta', { kind: 'transaction', amount: 3500, categoryId: 'rent' }],
  ['cinco y medio de café', { kind: 'transaction', amount: 5.5, categoryId: 'dining' }],
  ['quinientos pesos de gasolina', { kind: 'transaction', amount: 500, categoryId: 'transport' }],
  ['dos mil de alquiler', { kind: 'transaction', amount: 2000, categoryId: 'rent' }],
  // "con" before a count of people is not a decimal.
  ['cena con 3 amigos 60', { kind: 'transaction', amount: 60, categoryId: 'dining', note: 'Cena con 3 amigos' }],
];

/** Sentences near a question, a correction or a count that must stay plain entries. */
const stayEntries: Case[] = [
  ['almuerzo 12 total', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['compra 85 esta semana', { kind: 'transaction', amount: 85 }],
  ['gasto de luz 60', { kind: 'transaction', amount: 60, categoryId: 'utilities' }],
  ['café 3 más', { kind: 'transaction', amount: 3, categoryId: 'dining' }],
  ['total café 12', { kind: 'transaction', amount: 12, categoryId: 'dining' }],
  ['gasolina 40 más o menos', { kind: 'transaction', amount: 40, categoryId: 'transport' }],
  ['me queda 20 de propina', { kind: 'transaction', amount: 20 }],
  // Stating what something cost is a new entry; only the imperfect ("era") or a second number ("no 50") makes it a fix.
  ['la cena fueron 60', { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  ['la cena fue 60', { kind: 'transaction', amount: 60, categoryId: 'dining' }],
  // "pon" and "apunta" without an article log something; "mete 20 en ahorros" is money moved.
  ['pon café 4', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ['apunta café 4', { kind: 'transaction', amount: 4, categoryId: 'dining' }],
  ['mete 20 en ahorros', { kind: 'transaction', amount: 20, categoryId: 'savings' }],
  ['el pan de la panadería 3', { kind: 'transaction', amount: 3, categoryId: 'groceries' }],
];

describe('es: putting money aside', () => runCases('es', savingEntries, labels));
describe('es: spending as it is said', () => runCases('es', colloquialExpenses, labels));
describe('es: money coming in, as it is said', () => runCases('es', colloquialIncome, labels));
describe('es: questions as dictated', () => runCases('es', spokenQuestions, labels));
describe('es: fixing by voice, named or not', () => runCases('es', spokenCorrections, labels));
describe('es: reminders as said', () => runCases('es', spokenReminders, labels));
describe('es: dictated amounts', () => runCases('es', dictatedAmounts, labels));
describe('es: near a question or a fix, still an entry', () => runCases('es', stayEntries, labels));

/** Paying into a goal with the everyday verbs ("le eché", "le metí", "mandé al chanchito"). */
const spokenContributions: Case[] = [
  ['le eché 20 al fondo de Japón', { kind: 'contribution', amount: 20, goalId: 'g1' }],
  ['le metí 50 más a Japón', { kind: 'contribution', amount: 50, goalId: 'g1' }],
  ['mandé 200 al chanchito de Japón', { kind: 'contribution', amount: 200, goalId: 'g1' }],
  ['ayer aparté 100 pal viaje a Japón', { kind: 'contribution', amount: 100, goalId: 'g1', occurredAt: '2026-09-15' }],
  ['pasé 100 a los ahorros de Japón', { kind: 'contribution', amount: 100, goalId: 'g1' }],
  ['puse 50 más en la hucha del viaje', { kind: 'contribution', amount: 50, goalId: 'g1' }],
];

describe('es: paying into a goal, as it is said', () => {
  it.each(spokenContributions)('%s', (text, expected) => {
    const r = parseOne(text, 'es', labels, SPANISH_GOALS);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject(expected);
  });
});

/** Misreads a reviewer reproduced: "no wait", a refund from work, a terse question, a pace word left in the note. */
const reviewedMisreads: Case[] = [
  // "no espera, 15": a stumble before the new number is a fix, not an entry called "No espera".
  ['no espera, 15', { kind: 'correction', correction: { amount: 15 } }],
  ['espera, 15', { kind: 'correction', correction: { amount: 15 } }],
  // The company paid the money back: income, even though the meal is a dining word.
  ['la empresa me reembolsó 45 de la comida', { kind: 'transaction', type: 'income', amount: 45, categoryId: 'other_income' }],
  ['me reembolsó la empresa 45', { kind: 'transaction', type: 'income', amount: 45, categoryId: 'other_income' }],
  // Where the money goes, with no "más": the biggest category.
  ['en qué se me va el dinero', { kind: 'question', question: { ask: 'top' } }],
  ['veinticinco dólares en target', { kind: 'transaction', amount: 25, categoryId: 'shopping', note: 'Target' }],
  ['gimnasio 35 al mes', { kind: 'transaction', amount: 35, categoryId: 'health', note: 'Gimnasio' }],
];

describe('es: reviewed misreads', () => runCases('es', reviewedMisreads, labels));

/**
 * Waiting on the parser core: digit-and-scale runs ("2 mil"), a named month as a question period
 * (`question.monthNames` is already in the pack), and a bare "fueron 45 no 54" read as a fix through `notTail`.
 * Un-skip once the core change is merged.
 */
describe.skip('after core merge', () => {
  const pending: Case[] = [
    ['2 mil de alquiler', { kind: 'transaction', amount: 2000, categoryId: 'rent' }],
    ['2 mil pesos de renta', { kind: 'transaction', amount: 2000, categoryId: 'rent' }],
    ['20 mil de luz', { kind: 'transaction', amount: 20000, categoryId: 'utilities' }],
    ['2 mil 500', { kind: 'transaction', amount: 2500 }],
    ['cuánto gasté en agosto', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
    ['¿cuánto he gastado en agosto?', { kind: 'question', question: { ask: 'spent', period: 'namedMonth', month: 7 } }],
    ['fueron 45 no 54', { kind: 'correction', correction: { amount: 45 } }],
    ['eran 15 no 51', { kind: 'correction', correction: { amount: 15 } }],
  ];
  runCases('es', pending, labels);
});
