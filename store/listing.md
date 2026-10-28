# Store listing — OnlyBudget

## Name
OnlyBudget

## Subtitle (App Store, 30 chars)
Only a budget. Nothing else.

## Short description (Play, 80 chars)
No bank linking. No ads. No subscriptions. Just tell it what you spent.

## Description

**No bank linking. No ads. No subscriptions. Just tell it what you spent.**

Free for 30 days, with no card and nothing that turns into anything. After that, one purchase keeps it going for good. The price is shown up front and never changes after you buy.

OnlyBudget is a budget you talk to. Tap the mic (or type) and say it the way you'd say it to a friend:

- "spent 12 on lunch"
- "got paid 2400"
- "goal: save 500 for a trip by December"

OnlyBudget works out the amount, whether it's money in or out, the category and the date, then shows you before it saves. Fix anything with one tap. If you correct a category, it remembers the word next time.

**What you get**
- Voice and text entry that take under ten seconds
- A monthly picture at a glance: what came in, what went out, where most of it went
- Categories with optional limits, shown as a quiet progress bar, never a red alert
- Repeating entries for rent, salary and subscriptions. Set up once, logged automatically
- Savings goals with honest pace: "You're $180 away, on pace to hit it 2 weeks early"
- Questions, answered out loud if you like: "how much did I spend on coffee this week?", "what's left for groceries?", "can I afford 80 on shoes?"
- Say what you want done, too: "pause netflix", "set my groceries plan to 400", "same again", "split 60 between groceries and household", "mark the trip goal done"
- Budget by calendar month or from payday to payday, with a "safe to spend until payday" number that keeps the bills back
- Statement import: a PDF or CSV from your bank or card, read on your phone, every line shown before anything is saved
- Reminders you set yourself. The app never notifies you on its own
- Searchable history, by category, date and type
- An app lock with Face ID, Touch ID or your passcode
- Export to CSV, a readable summary, or a full backup. Passphrase-encrypted backups you can keep in your own cloud drive
- Your data stays on your phone and is never copied anywhere by itself, so make a backup before you change phones; a backup can be added to another phone or replace what is there
- Before an update changes how your data are stored, a copy is kept on the phone, and Settings can take you back to it
- Light and dark themes
- Works in English, Spanish, French, Italian, German, Chinese, Japanese and Korean, including the voice entry

**What you never get**
- Bank linking. Not now, not later, not as an upgrade. OnlyBudget never asks for bank credentials.
- Ads, trackers or analytics. There is no server. Your data lives on your phone and nothing is sent anywhere.
- Accounts. You never sign up.
- Lock-in. Export everything as CSV or a full backup any time. The source code is public, so the app cannot quietly change what it does with your data.
- Subscriptions or trials that turn into subscriptions. The price you see is the price, and nothing you entered is ever put behind a paywall.
- Guilt. No streaks, no badges, no "you failed".

Speech is turned into text by your phone's own recognizer. On devices that support it, recognition runs on the device and audio never leaves the phone.

OnlyBudget is for people who want awareness and control over their spending without handing bank credentials to a third party, and who find most budgeting apps either too complex or too automated to trust.

## Localizations
en, es, fr, it, de, zh-Hans, ja, ko. Store copy above is the English source; translate per locale before submission.

## Keywords (App Store, 100 chars)
budget,expense tracker,spending,voice,manual budget,offline,private,savings goal,no bank,money

## What's new (1.0)
First release.

## Privacy

Full policy: `docs/PRIVACY.md`, rendered to `docs/privacy.html`. Host it and put the URL in both consoles (see `docs/RELEASE.md`).

### Apple privacy nutrition label
**Data Not Collected.** Nothing leaves the phone: there is no server, no analytics and no network feature of the app's own in 1.0 (Smart parsing is held back by `SMART_ASSIST` in `src/lib/features.ts`). The one-time purchase goes through StoreKit; Apple's label guidance counts only data the developer transmits off the device, and data Apple collects itself is not the developer's to declare. The app keeps a local flag only and never reads purchase history off the device. (This reading of the StoreKit case is an inference from Apple's frameworks wording, not a sentence naming StoreKit.)
- Speech recognition uses Apple's Speech framework (on the device where supported); that is Apple's processing, not OnlyBudget's, and is not declared.
- Backups and exports are files the user writes and keeps themselves; they are not collection.
- If Smart parsing ships in a later version, the label changes to **User Content → Other User Content** and **Financial Info → Other Financial Info**, purpose App Functionality, not used for tracking, linked to the user (the request carries their own API key), and the feature's consent dialog covers Guideline 5.1.2(i).

### Google Play data safety
- Does the app collect or share user data? **No.** The in-app purchase goes through Google Play's billing system, which Play's data-safety guidance lists among payment services whose own collection the developer need not declare when the app never accesses that data; the app keeps a local flag only.
- Is all of the user data collected by the app encrypted in transit? Not asked when nothing is collected.
- Deletion request mechanism: not asked; the developer holds no data. Settings → Erase everything clears the phone, and so does uninstalling.
- Security practices: data is stored on the device only; the user can request deletion by erasing it themselves.
- If Smart parsing ships in a later version: *Yes, collects* (Play counts data sent off the device through an optional feature), types *Other user-generated content* and *Financial info → Purchase history*, purpose App functionality, optional, encrypted in transit, not shared, not ephemeral.

### Permissions
- **Microphone**: to hear a spoken entry. Only while the mic button is active.
- **Speech recognition**: to turn speech into text for an entry.
- **Notifications** (optional): reminders the user sets (one-off or repeating) and the optional evening nudge. Rescheduled after a restart. No badges (launcher-badge permissions are blocked in `app.json`).
- **Face ID / fingerprint** (optional): only if the user turns on the app lock.
- **Internet**: declared by the framework. Nothing in 1.0 sends data apart from the store's own billing; the Android speech recognizer may use it for languages whose offline model is not installed, which is the system's own processing.

## Play Console declarations (App content page)

Every answer follows from the app having no server, no ads and no login.

| Declaration | Answer |
| --- | --- |
| Privacy policy | the hosted `privacy.html` URL (required: the app asks for the microphone) |
| Ads | No, the app contains no ads |
| App access | All functionality is available without special access (no login) |
| Content rating (IARC) | category *Utility, Productivity, Communication or Other*; every question No; this rates Everyone / PEGI 3 |
| Target audience | 18 and over (the app is not designed for children; choosing any younger group brings the Families policy with it) |
| News app | No |
| COVID-19 contact tracing | No |
| Data safety | Does not collect or share user data (see above) |
| Government app | No |
| Financial features | *My app doesn't provide any financial features* (the list is banking, loans, payments, wallets, crypto, trading, credit monitoring, financial advice, insurance; a manual budget is none of them) |
| Health | No health features |
| Advertising ID | No, the app does not use the advertising ID (`com.google.android.gms.permission.AD_ID` is in `blockedPermissions`) |

Store settings: category **Finance**, tags *budget* and *expense tracker*; contact email support@mradsoftware.com and the website the policy page lives on. The EU DSA trader question is answered yes, since the app sells an in-app purchase: MRAD Software Solutions LLC, 725-900-8131, support@mradsoftware.com, and the address on the D-U-N-S record, all shown on the listing.

## App Store Connect forms

| Form | Answer |
| --- | --- |
| App Privacy | **Data Not Collected** (see above) |
| Age rating questionnaire | every item None or No; no unrestricted web access, no gambling, no user-generated content; this rates 4+ |
| Content rights | the app contains no third-party content |
| Export compliance | uses encryption (the encrypted backup), standard algorithms only, not proprietary, exempt from documentation; France: file the declaration or leave France out of the territories |
| Sign-in | not required; nothing in the app needs an account |
| Advertising identifier (IDFA) | not used |
| Primary category | Finance; secondary Productivity |
| Price | the app is free; the in-app purchase `full_unlock` (and the free `trial_30`) need the Paid Applications agreement, banking and tax forms signed under Agreements, Tax, and Banking first |
| App Review notes | the two review-note lines below |

## Review notes (App Store / Play)
- There is no login. Reviewers can use the app immediately after onboarding.
- No financial account data of any kind is accessed. All amounts are entered manually by the user.
- Try: tap the mic, say "spent twelve dollars on lunch", confirm. Or type "goal: save 500 for a trip by December".
- The app makes no network requests of its own; the only connection is the store's own purchase sheet (StoreKit / Play Billing). There is no server, no account and no analytics; speech is recognised by the phone's own recognizer.
- The app is free for 30 days from first open, then a one-time in-app purchase (`full_unlock`) is offered under Settings → Your purchase. A fresh install is inside the trial, so every feature can be exercised without buying; the purchase sheet is the store's own and works in the sandbox. Nothing already entered is ever locked.
- Bank or card statement PDFs and CSV exports (Settings → Import a statement) are read on the device (PDFs in a sandboxed view with no network access), and are never uploaded.

## Pricing
Free to install, with a 30-day trial of the whole app and one one-time in-app purchase after it. No subscription, no renewal, no other products.

- **Product `full_unlock`** (non-consumable, both stores): the one-time purchase. Suggested $4.99; both stores localise it per country. Same product id and the same price tier on both.
- **Product `trial_30`** (App Store only, non-consumable at price tier 0, display name "30-day Trial"): Apple's way of recording a time-based trial for non-subscription apps (Guideline 3.1.1). The app takes it quietly on first run; if the person declines the sheet, the trial runs on local dates anyway.
- The trial: the whole app for 30 days from the first open. After it, everything already entered stays readable, askable and exportable, and adding new entries, goals, reminders, repeating entries, debts or imports needs the purchase. Erasing the app's data does not restart the month, and a clock set back does not stretch it.
- The listing text must say so (Apple: the trial's length, what stops, and the price, before the trial starts). The first onboarding page states it, and so does Settings → Your purchase.
- On Play a free app can never become paid, which is the point: this stays free to install for good.

### App Store listing text about the trial (add under the description)
"Free for 30 days. After that, a single purchase keeps it going; no subscription. Everything you entered stays yours to read and export whether you buy or not."

### Play: in-app products
Monetize → Products → In-app products → Create product: id `full_unlock`, name "Full unlock", one-time, the price. Add your own Google account under Setup → License testing so test purchases are free.
