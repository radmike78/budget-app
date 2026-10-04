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
  on-device recognizer is used (the hint under the bar says so).
- Save a reminder, then **refuse** the notification permission. The reminder must
  still be saved and the app must say the notification could not be scheduled.
- Turn the app lock on, background the app, wait half a minute, come back.
  Cancel the biometric prompt and check you can still retry.
- Import a real bank or card statement PDF. Check no account number survives
  into any saved entry.
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

**Accounts.** Apple Developer Program, $99/year. Google Play Console, $25 once —
and a new personal Play account must run a closed test with at least 12 testers
for 14 continuous days before it can be promoted to production. Start that
clock early; it is the longest pole in the tent.

**The listing copy** is drafted in `store/listing.md`, including the answers for
Apple's privacy nutrition label and Play's data-safety form, and notes for the
reviewer. The copy is English; translate per locale before submission.

## 4. Known, and deliberate

- `npm audit` reports advisories in `brace-expansion`, `braces`, `node-forge`,
  `decode-uri-component` and `uuid`. All of them arrive through Expo's CLI and
  build tooling, not through anything in the shipped bundle, and they clear when
  Expo bumps them. Re-check with `npm audit --omit=dev` after an SDK upgrade.
- The voices (`friend`, `coach`, `roaster`) only have English lines. In any other
  app language the app stays quiet rather than speaking English at someone who
  did not ask for it.
- There is no purchase code. `store/listing.md` proposes a one-time purchase;
  shipping free is a decision, not a gap.
