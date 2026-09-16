/**
 * English lines for the voices. Placeholders: {amount} {place} {category} {left}
 * {plan} {goal} {current} {target} {pct}. Keep every line under about 90
 * characters so it fits the toast on a phone. Nothing here may mock a person's
 * money or situation; the target is always the latte, never the user.
 */
import type { Attitude, Voice } from '@/types';

export type Situation = 'income' | 'contribution' | 'spend_free' | 'spend_under' | 'spend_close';
export type LineSet = Record<Situation, Partial<Record<Attitude, string[]>>>;

const friend: LineSet = {
  income: {
    nice: ['{amount} in. Nice one.', 'Money in: {amount}. Good day for it.', '{amount} landed. Go you.'],
    playful: ['{amount} in. I already like this day.', 'Ka-ching, {amount}. Pretend I did the sound effect.', '{amount} in. Future you just high-fived present you.'],
    spicy: ['{amount} in. Try to keep it for at least a day this time.', '{amount} in. Look who is thriving.', '{amount} landed. Let us not tell {place} about it.'],
  },
  contribution: {
    nice: ['{amount} to {goal}. You are {pct}% there.', '{goal} just grew by {amount}. {current} of {target}.', 'Another {amount} toward {goal}. Quietly impressive.'],
    playful: ['{goal} fund +{amount}. Future you is doing a little dance.', '{amount} toward {goal}. {pct}% and looking smug.', '{goal}: {current} of {target}. The pile is getting real.'],
    spicy: ['{amount} to {goal}. Present you is capable of good decisions, apparently.', '{goal} +{amount}. Who are you and what did you do with the old you?', '{pct}% to {goal}. Hold the line, spender.'],
  },
  spend_free: {
    nice: ['{amount} at {place}. Logged, no judgement.', 'Got it: {amount} at {place}.', '{amount} at {place}. Enjoy it.'],
    playful: ['{amount} at {place}. Treat yourself, but like, once.', '{amount} at {place}? Bold. Logged.', '{place} got {amount}. I hope it was worth the story.'],
    spicy: ['{amount} at {place}? Did you buy everyone one?', '{amount} at {place}. I hope they spelled your name right this time.', '{place} again? At least you are consistent.'],
  },
  spend_under: {
    nice: ['{amount} at {place}. {left} left in {category}, all good.', 'Logged. Still {left} to go in {category}.', '{amount} at {place}, and {left} left. Comfortable.'],
    playful: ['{amount} at {place}. {left} left, so no drama today.', 'Look at you, almost reasonable. {left} left in {category}.', '{place}: {amount}. {left} left. I am not even worried.'],
    spicy: ['{amount} at {place}? I hope they spelled your name right. {left} left.', '{place} again? {left} left in {category}, choose wisely.', '{amount} at {place}. {left} left, which is more than I expected, honestly.'],
  },
  spend_close: {
    nice: ['{amount} at {place}. {left} left in {category} this period.', 'Logged. Heads up: {left} left in {category}.', '{amount} at {place}. Getting close: {left} to go.'],
    playful: ['{amount} at {place}. {left} left in {category}, make it count.', '{place} logged. {left} left, so maybe make the next one a small.', '{amount} at {place}. {left} left. This is where heroes are made.'],
    spicy: ['{amount} at {place}. {left} left in {category}. Choose your next one wisely.', '{place} again? {left} left. The barista knows your order, I know your budget.', '{amount} at {place}. {left} left until the plan runs dry. No pressure.'],
  },
};

const coach: LineSet = {
  income: {
    nice: ['{amount} in. Logged and counted.', 'Income logged: {amount}. Nice work.', '{amount} in. That is the fuel for the plan.'],
    playful: ['{amount} in. Let us put it to work.', '{amount} landed. Plan first, then play.', 'Income {amount}. Good. Now the fun part: deciding where it goes.'],
    spicy: ['{amount} in. Give every dollar a job before it wanders off.', '{amount} in. Momentum is built on days like this.', '{amount} in. Log the outgoings just as fast and you are unstoppable.'],
  },
  contribution: {
    nice: ['{amount} to {goal}. {current} of {target}, {pct}% there.', 'Nice. {goal} is at {pct}%.', '{goal} +{amount}. Steady progress.'],
    playful: ['{amount} to {goal}. {pct}% and climbing.', '{goal}: {current} of {target}. Keep that rhythm.', 'That is {amount} closer to {goal}. Small moves, big result.'],
    spicy: ['{amount} to {goal}. {pct}%. Do not stop now.', '{goal} at {current}. The finish line is {target}. Go get it.', '{pct}% to {goal}. This is what consistency looks like.'],
  },
  spend_free: {
    nice: ['{amount} at {place}. Logged, and that is the whole job.', 'Logged: {amount} at {place}. Good habit.', '{amount} at {place}. Tracking it is the win.'],
    playful: ['{amount} at {place}. Logged in seconds. That is the habit.', '{place}: {amount}. You showed up and logged it. Respect.', '{amount} at {place}. Awareness first, decisions later.'],
    spicy: ['{amount} at {place}. Logged. Want a limit on {category} so we can keep score?', '{place}, {amount}. Every logged entry is a rep.', '{amount} at {place}. Noted. Consistency beats perfection.'],
  },
  spend_under: {
    nice: ['Logged. You are still {left} under your {category} plan.', '{amount} at {place}. {left} left in {category}. On track.', 'Good: {left} left in {category} after that.'],
    playful: ['{amount} at {place}. {left} left in {category}. Keep it going.', 'On plan: {left} left in {category}. That is discipline.', '{place}: {amount}. {left} left. You are running this.'],
    spicy: ['{amount} at {place}. {left} left in {category}. Finish strong.', 'Logged. {left} left in {category}. Do not coast now.', '{place}, {amount}. {left} left. Make the plan proud.'],
  },
  spend_close: {
    nice: ['{amount} at {place}. {left} left in {category}. Close to plan.', 'Logged. {left} left in {category} this period.', '{amount} at {place}. {left} to go; you are nearly there.'],
    playful: ['{amount} at {place}. {left} left in {category}. Final stretch.', '{left} left in {category}. Land this one.', '{place}: {amount}. {left} left. Precision time.'],
    spicy: ['{amount} at {place}. {left} left in {category}. Every choice counts now.', '{left} left in {category}. Champions finish under plan.', '{place}, {amount}. {left} left. Hold it together.'],
  },
};

const roaster: LineSet = {
  income: {
    nice: ['{amount} in. Look at that.', '{amount} landed. Your wallet says thanks.', 'Income: {amount}. A rare and beautiful entry.'],
    playful: ['{amount} in. Please do not tell {place}.', '{amount} in. Try to remember this feeling next time you are at the mall.', '{amount} in. Quick, log it before it evaporates.'],
    spicy: ['{amount} in. Watch it leave in real time.', '{amount} in. Your dining category has already heard the news.', '{amount} landed. Somewhere a shopping cart just perked up.'],
  },
  contribution: {
    nice: ['{amount} to {goal}. That is {pct}%.', '{goal} got {amount}. {current} of {target}.', '{amount} toward {goal}. Unexpectedly responsible.'],
    playful: ['{amount} to {goal}. Future you approves. Present you is confused but proud.', '{goal} +{amount}. Who is this person?', '{pct}% to {goal}. Drinks by the pool are getting dangerously close.'],
    spicy: ['{amount} to {goal}. Did someone swap phones with you?', '{goal} at {pct}%. Frame this moment; it may not repeat.', '{amount} to {goal}. The old you is filing a complaint.'],
  },
  spend_free: {
    nice: ['{amount} at {place}. Logged.', '{amount} at {place}. Noted, calmly.', '{place}: {amount}. Fine. Fine.'],
    playful: ['{amount} at {place}? Did you buy everyone one?', '{place} has received your tribute of {amount}.', '{amount} at {place}. Did the latte come with stock options?'],
    spicy: ['{amount} at {place}? Did the barista get a tip and a car?', '{amount} at {place}. Did that come with a retirement account?', '{place} again? Their rent is basically your hobby.'],
  },
  spend_under: {
    nice: ['{amount} at {place}. {left} left in {category}. Relax.', '{amount} at {place}. Still {left} left. Look at you.', 'Logged. {left} left in {category}, surprisingly.'],
    playful: ['{amount} at {place}. Look at you being almost reasonable. {left} left.', '{place}: {amount}. {left} left, so the streak of good choices continues. Weird.', '{amount} at {place}. {left} left. I had money on you blowing it.'],
    spicy: ['{amount} at {place}? Did you buy the barista a drink too? {left} left.', '{place} again. {left} left in {category}. Your loyalty card must be glowing.', '{amount} at {place}. {left} left. Their staff know you by name, do they not.'],
  },
  spend_close: {
    nice: ['{amount} at {place}. {left} left in {category}. Easy now.', '{place}: {amount}. {left} left. Just saying.', 'Logged. {left} left in {category}. Pace yourself.'],
    playful: ['{place} again? {left} left in {category}. Choose your next latte wisely.', '{amount} at {place}. {left} left. The plan is sweating.', '{amount} at {place}. {left} left in {category}. Rationing begins.'],
    spicy: ['{amount} at {place}. {left} left. That cup better come with a plan.', '{place} again? {left} left in {category}. Even the barista is worried.', '{amount} at {place}. {left} left. Maybe the next one is tap water with attitude.'],
  },
};

export const LINES_EN: Record<Exclude<Voice, 'plain'>, LineSet> = { friend, coach, roaster };
