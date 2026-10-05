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
  ['me pagaron 2400', { type: 'income', amount: 2400 }],
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
