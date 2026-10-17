# Store listing — OnlyBudget

## Name
OnlyBudget

## Subtitle (App Store, 30 chars)
Only a budget. Nothing else.

## Short description (Play, 80 chars)
No bank account required. No ads. No subscriptions. Just tell it what you spent.

## Description

**No bank account required. No ads. No subscriptions. Just tell it what you spent.**

OnlyBudget is a budget you talk to. Tap the mic (or type) and say it the way you'd say it to a friend:

- "spent 12 on lunch"
- "got paid 2400"
- "goal: save 500 for a trip by December"

OnlyBudget works out the amount, whether it's money in or out, the category and the date, then shows you before it saves. Fix anything with one tap. If you correct a category, it remembers the word next time.

**What you get**
- Voice and text entry that take under ten seconds
- A monthly picture in plain sentences: what came in, what went out, where most of it went
- Categories with optional limits, shown as a quiet progress bar, never a red alert
- Repeating entries for rent, salary and subscriptions. Set up once, logged automatically
- Savings goals with honest pace: "You're $180 away, on pace to hit it 2 weeks early"
- Searchable history, by category, date and type
- Export to CSV, a readable summary, or a full backup. Passphrase-encrypted backups you can keep in your own cloud drive
- Light and dark themes
- Works in English, Spanish, French, Italian, German, Chinese, Japanese and Korean, including the voice entry

**What you never get**
- Bank linking. Not now, not later, not as an upgrade. OnlyBudget never asks for bank credentials.
- Ads, trackers or analytics. There is no server. Your data lives on your phone. (The one exception is optional: Smart parsing, off unless you turn it on with your own key, sends only phrases the app couldn't read to Anthropic.)
- Accounts. You never sign up.
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
Because the optional Smart parsing can send a phrase off the phone, the label is not "Data Not Collected" while that feature ships. Declare:
- **User Content → Other User Content** and **Financial Info → Other Financial Info** (a phrase like "got paid 2400").
- Purpose: **App Functionality**. Used for tracking: **No**.
- Linked to the user: **Yes** is the safer answer (each request carries the user's own API key, so Anthropic can tie it to their Anthropic account).
- Speech recognition uses Apple's Speech framework (on the device where supported); that is Apple's processing, not OnlyBudget's, and is not declared.
- Turning Smart parsing on asks first, in so many words, who receives what (Guideline 5.1.2(i)).
- If Smart parsing is left out of 1.0, the label becomes **Data Not Collected**.

### Google Play data safety
- Does the app collect or share user data? **Yes, collects** (Play counts any data sent off the device, including through an optional feature; "No by default" is not an answer the form offers).
- Data types: *Other user-generated content*, and *Financial info → Purchase history* ("spent 32 at Joe's"). Purpose: *App functionality*. Optional: *Yes*. Encrypted in transit: *Yes*. Ephemeral: *No* (Anthropic keeps requests under its own terms).
- Shared: *No* (sent only after the user's explicit permission, which Play treats as user-initiated).
- Deletion request mechanism: *No* (the developer holds no data; Erase everything clears the phone).
- If Smart parsing is left out of 1.0: *No data collected*.
- Data is stored on the device only. Users can delete all of it at any time with Settings → Erase everything, which also clears the optional Smart Assist key, or by uninstalling the app.

### Permissions
- **Microphone**: to hear a spoken entry. Only while the mic button is active.
- **Speech recognition**: to turn speech into text for an entry.
- **Notifications** (optional): reminders the user sets (one-off or repeating) and the optional evening nudge. Rescheduled after a restart. No badges (launcher-badge permissions are blocked in `app.json`).
- **Face ID / fingerprint** (optional): only if the user turns on the app lock.
- **Internet**: only for the optional Smart parsing.

## Review notes (App Store / Play)
- There is no login. Reviewers can use the app immediately after onboarding.
- No financial account data of any kind is accessed. All amounts are entered manually by the user.
- Try: tap the mic, say "spent twelve dollars on lunch", confirm. Or type "goal: save 500 for a trip by December".
- The optional "Smart parsing assist" in Settings requires the reviewer's own API key and is not needed to exercise any feature. Turning it on first asks for explicit permission to send unclear phrases to Anthropic.
- Bank or card statement PDFs (Settings → Import a statement) are read on the device in a sandboxed view with no network access, and are never uploaded.

## Pricing
One-time purchase (suggested $4.99–$9.99), or free with a single optional one-time "supporter" unlock for cosmetic extras (icons, themes). No subscriptions. No trial periods.
