# Getting OnlyBudget onto a phone, and then into a store

Everything in this repo has been tested against the web build in headless
Chromium. That covers the parser, the money logic, the database and the screens,
but it does not cover the parts of the app that only exist on a phone:

| What | Web build | Phone |
| --- | --- | --- |
| Voice entry | the browser's recognizer | `expo-speech-recognition`, on-device where supported |
| Reminders | nothing is scheduled | real notifications, and a permission the user can refuse |
| App lock | `authenticate()` returns true | Face ID, Touch ID or the device passcode |
| Statement import | `pdfjs-dist` in the page | `pdf.js` inside a no-network WebView |
| Database | SQLite compiled to wasm | SQLite on the device filesystem |
| Haptics | no-ops | real |

So the first job is a build you can hold. The cheapest way in is an Android APK:
it needs no developer account and no store.

## 1. A build on a real phone

```sh
npm install -g eas-cli
eas login                 # a free Expo account
eas init                  # writes extra.eas.projectId into app.json
```

### Android, no accounts needed

```sh
eas build --profile preview --platform android
```

EAS returns a link to an `.apk`. Open it on the phone, allow installs from that
source, and the app is on your home screen. This is the build to use for the
first pass over voice, notifications, the app lock and a real bank statement.

### iOS

A simulator build needs no Apple account and is enough to see the screens, but
not the microphone or Face ID:

```sh
eas build --profile development --platform ios   # simulator: true
```

For a build that runs on your own iPhone you need the Apple Developer Program
($99/year). Register the device, then:

```sh
eas build --profile device --platform ios
```

## 2. What to check on the device

The web walkthrough cannot reach any of these.

- Say an entry with the mic, in a quiet room and a loud one. Check that the
  on-device recognizer is used (the hint under the bar says so). On Android,
  switch the app to a language whose offline model is not downloaded: the mic
  must still work (it falls back to the phone's ordinary recognizer once).
- Play music or a podcast, say an entry, and check the music comes back
  afterwards (iOS hands the audio session back when listening ends).
- Ask a question with the answer read aloud, then tap the mic while it is
  still talking: the voice stops before listening starts.
- Save a reminder, then **refuse** the notification permission. The reminder must
  still be saved and the app must say the notification could not be scheduled.
- Save a monthly reminder ("pay rent on the 1st at 9am") and a one-off for
  tomorrow; check both arrive, on the right channel, with the app's glyph as the
  Android notification icon. Turn the daily reminder on and leave it a day.
- Set up pay and rent in onboarding, leave the app in the background overnight,
  and open it the next day: what fell due is logged once, and Today shows the
  new day (and the new period, on a payday).
- Turn the app lock on, background the app, wait half a minute, come back.
  Cancel the biometric prompt and check you can still retry.
- Import a real bank or card statement PDF. Check no account number survives
  into any saved entry. Try one from a UK or EU bank (day-first dates) if you
  can, then take an import back from the same screen.
- Export an encrypted backup, delete the app, reinstall, restore from the file.
- Erase everything from Settings, then confirm the app is genuinely empty.
- Rotate to landscape, raise the system font size to its largest, turn on
  reduced motion, and run VoiceOver or TalkBack over the Today screen.

## 3. Before you can submit

Fill these in; nothing here can be guessed.

**`app.json`** — `version` is what people see, and `appVersionSource: "remote"`
in `eas.json` means EAS owns the build number, so you never edit it by hand.

**`eas.json` → `submit.production`** — empty on purpose:

```jsonc
"ios": {
  "appleId": "you@example.com",
  "ascAppId": "0000000000",      // App Store Connect app ID
  "appleTeamId": "XXXXXXXXXX"
},
"android": {
  "serviceAccountKeyPath": "./play-service-account.json",  // never commit this
  "track": "internal"
}
```

**A privacy policy at a public URL.** The policy is written: `docs/privacy.html`
is a self-contained page, `docs/PRIVACY.md` the same text in Markdown. The
quickest way to a URL is GitHub Pages — repository Settings → Pages → Deploy
from a branch → `main` / `/docs`, which serves it at
`https://<user>.github.io/<repo>/privacy.html`. Any static host works; both
stores only need a link that resolves.

**Store screenshots** from a device or simulator, at the sizes Apple and Google
ask for. `npm run ui:gallery` is for reviewing the app, not for submitting:
those are web captures at phone width.

**Decide the name before the first upload.** The Android package
(`app.onlybudget`) can never change once a build is on Play, and the iOS bundle
identifier is fixed to the App Store record. The display name can change later;
these cannot. If the app will not be called OnlyBudget, change both in
`app.json` first.

**Accounts.** With a D-U-N-S number, enrol both as an **organization**, so the
listing shows the company as the seller rather than your own name:

- Apple Developer Program, $99/year. Apple checks the legal entity name and
  D-U-N-S record match exactly; a mismatch is the usual cause of delay. You
  need a website for the organization and a work email on its domain.
- Google Play Console, $25 once, organization account. New *personal* accounts
  must run a closed test with 12 testers for 14 days before production;
  organization accounts are exempt, which is another reason to enrol as one.
  An internal test track is still the right first step.

**EU trader status.** Both stores ask whether you are a trader under the EU
Digital Services Act. If you charge for the app you are almost certainly one, and the
organization's address, phone and email are then shown on the EU listing.

**Export compliance.** `ITSAppUsesNonExemptEncryption` is `true` because the
encrypted backup uses XChaCha20-Poly1305. In App Store Connect answer that the
app uses standard encryption algorithms (not proprietary) and is not for
government use; that is exempt from US export documentation, but Apple then asks
whether you will distribute in **France**, which needs its own declaration. Either
file that declaration or leave France out of the territories.

**A support URL and contact.** Both stores require a support URL and an email.
A page next to the privacy policy (GitHub Pages works) is enough. Fill the
`[ADD A CONTACT EMAIL…]` and `[ADD THE PUBLISHER NAME…]` placeholders in
`docs/PRIVACY.md`, run `npm run build:privacy`, host the page, and set
`PRIVACY_URL` in `src/lib/links.ts` so the About screen links to it.

**iPad.** `supportsTablet` is on and the screens have a tablet layout, so Apple
requires 13-inch iPad screenshots too. Turning it off removes that, but the app
then runs as a scaled-up phone app on iPads.

**Price.** On Google Play a free app can never become paid; a paid app can
become free. Decide before the first production release.

**Smart parsing.** If it ships, the privacy label and data-safety answers in
`store/listing.md` include what it sends to Anthropic. If it is held back for
1.0, hide the Settings entry and drop those answers to "no data collected".

**The listing copy** is drafted in `store/listing.md`, including the answers for
Apple's privacy nutrition label and Play's data-safety form, and notes for the
reviewer. The copy is English; translate per locale before submission.

## 4. Known, and deliberate

- `npm audit` reports advisories (`brace-expansion`, `braces`, `node-forge`,
  `shell-quote`) that arrive through Expo's CLI, Metro and Jest, none of which
  ships. `npm run audit:shipped` (what CI runs) exports the Android bundle with
  source maps and fails only when a package with a high or critical advisory is
  in it; the rest are printed for information.
- Android reminders are not exact alarms: the app does not ask for
  `SCHEDULE_EXACT_ALARM`, so under Doze a 9:00 reminder can arrive some minutes
  late. That is the calm choice; a budgeting nudge does not need the alarm
  permission that clock apps request.
- The voices (`friend`, `coach`, `roaster`) only have English lines. In any other
  app language the app stays quiet rather than speaking English at someone who
  did not ask for it.
- The calendar picks single days; there is no typed date any more. A date years
  away is reached month by month, which suits a budget and nothing else needs.
- There is no purchase code. `store/listing.md` proposes a one-time purchase;
  shipping free is a decision, not a gap.
