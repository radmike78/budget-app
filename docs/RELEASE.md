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

**`eas.json` → `submit.production`** — Android is filled in (internal track,
uploaded as a draft release). The Play service-account key is uploaded to EAS
once (section 5) and never sits in the repo; `.gitignore` refuses it anyway.
iOS still needs its three values:

```jsonc
"ios": {
  "appleId": "you@example.com",
  "ascAppId": "0000000000",      // App Store Connect app ID
  "appleTeamId": "XXXXXXXXXX"
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
The email is support@mradsoftware.com, already in `docs/PRIVACY.md`. A page
next to the privacy policy (GitHub Pages works) is enough for the URL. Fill the
`[ADD THE PUBLISHER NAME…]` placeholder in `docs/PRIVACY.md` with the legal
entity's name, run `npm run build:privacy`, host the page, and set
`PRIVACY_URL` in `src/lib/links.ts` so the About screen links to it.

**iPad.** `supportsTablet` is on and the screens have a tablet layout, so Apple
requires 13-inch iPad screenshots too. Turning it off removes that, but the app
then runs as a scaled-up phone app on iPads.

**Price.** Paid, one-time, the same on both stores; `store/listing.md` has the
suggested tier. On Google Play a free app can never become paid; a paid app can
become free. Apple needs the Paid Applications agreement signed and banking and
tax forms filled in App Store Connect before a paid app can go on sale; Google
needs a payments profile in the Play Console. Both take days to clear, so start
them with the accounts.

**Smart parsing** is held back for 1.0 (`SMART_ASSIST` in `src/lib/features.ts`),
so the app has no network feature and both privacy forms are "no data
collected", as drafted in `store/listing.md`. Flipping the flag for a later
release means redoing those answers and the policy; the flag's comment lists
the places.

**The name.** `npm run rename -- "New Name" com.example.newname` changes the
display name, slug, URL scheme, Android package and iOS bundle identifier and
every mention in the locales, docs and web manifest in one go (`--dry-run`
first). Do it before the first upload, for the reasons in the next item.

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
- There is no purchase code, and none is needed: the price is the store's
  up-front price, and the app has no in-app purchases.
- Smart parsing exists in the code but is off for 1.0 (`SMART_ASSIST`), with
  its screen reachable only by deep link, where it says it is not in this
  version.

## 5. Google Play, in order

With an organization account there is no 14-day closed test. The order below
means no step waits on one that comes after it.

1. **Play Console → Create app.** Name, default language English (US), *App*,
   *Paid*. Accept the policy and US export-law declarations. The package name is
   taken from the first bundle you upload, so run the rename first if the name
   is changing.
2. **Payments profile** (Play Console → Setup → Payments profile) so a paid app
   can be sold. Google verifies it; start it now.
3. **Service account for EAS Submit**, once:
   - In Google Cloud, create a project (or use any), enable the *Google Play
     Android Developer API*, create a service account, and download a JSON key.
   - In Play Console → Users and permissions → Invite new users, add the
     service account's email with the *Release to testing tracks* and
     *Release to production* permissions for this app. Google's own steps are
     at <https://expo.fyi/creating-google-service-account>.
   - `eas credentials --platform android` → production → Google Service
     Account → upload the JSON. Then delete the file from your computer.
4. **First upload.** `eas build --profile production --platform android`, then
   `eas submit --profile production --platform android --latest`. It lands on
   the internal testing track as a draft. Play App Signing is set up on this
   first upload and is the only option for new apps; keep the upload key EAS
   generates (`eas credentials` shows it).
5. **Main store listing**: the copy in this file, the icon (512×512), the
   feature graphic (1024×500, `out/store/google/feature-graphic.png` is a
   draft), and at least two phone screenshots from the device, 16:9 or 9:16,
   1080 px or more on the short side. Add the seven-inch and ten-inch tablet
   sets if you have a tablet or emulator handy; they are optional on Play.
6. **App content** (Policy and programs): the table in `store/listing.md`
   answers every declaration. The privacy policy URL is the hosted page.
7. **Pricing and distribution**: set the price once; Play converts it per
   country and lets you adjust. Pick the countries (all is fine for a
   local-only app). Answer the EU trader question.
8. **Internal testing**: add yourself as a tester, install from the opt-in
   link, and run section 2 on that exact bundle. This is the build that goes
   to production, so there is nothing to rebuild afterwards.
9. **Promote to production** from the internal release (Release → Production →
   Create release → *Add from library*). Turn on **managed publishing** first
   if you want to pick the day it goes live after review; first reviews of a
   new app take from a day to a week.
10. After approval, the listing is live immediately or on the day you chose.
    Later releases are `eas build` + `eas submit` again; with
    `releaseStatus: draft` nothing goes out until you promote it.

## 6. Apple, in order

Apple is the long pole: organization enrollment is reviewed by hand and takes
anywhere from a few days to several weeks, so start it before anything else on
this list and ship Android while it runs. Nothing on Play waits for Apple.

1. **D-U-N-S number** for the legal entity (not a DBA or trade name). Check
   the record at <https://developer.apple.com/support/D-U-N-S/>: the legal
   name and address must match the company's registration exactly, because a
   mismatch is the usual cause of a stalled enrollment. A new number takes up
   to five business days through Apple's form.
2. **Enroll in the Apple Developer Program as an organization** ($99/year):
   the person enrolling must be an owner or have signing authority, and Apple
   may phone them to confirm it. Have a website on the company's domain and a
   work email on it. Enrollment IDs can be checked under *Account* while it is
   pending; if it goes quiet for more than two weeks, contact developer
   support with the enrollment ID.
3. **Agreements, Tax, and Banking** in App Store Connect, the day the account
   opens: accept the Paid Applications agreement and fill in the bank account
   and the tax forms. A paid app cannot be submitted until these show *Active*.
4. **App Store Connect → Apps → New App**: iOS, the name, primary language,
   the bundle identifier from `app.json`, and an SKU (any string, `budget-1`).
   Copy the *Apple ID* number from App Information into `eas.json`
   (`submit.production.ios.ascAppId`) with your Apple ID email and the team ID
   from <https://developer.apple.com/account>.
5. **API key for EAS Submit**, once, so uploads need no password or two-factor
   prompt: `eas credentials --platform ios` → production → *App Store Connect:
   Manage your API Key* → *Set up your project to use an API Key for EAS
   Submit*. EAS creates and stores the key (App Manager role).
6. **Build and upload.** Certificates and the provisioning profile are made by
   EAS on the first production build.

   ```sh
   eas build --profile production --platform ios
   eas submit --profile production --platform ios --latest
   ```

   The build shows up in TestFlight after ten to fifteen minutes of
   processing. Because `ITSAppUsesNonExemptEncryption` is true, App Store
   Connect asks the export-compliance questions once per build; the answers are
   in `store/listing.md`.
7. **TestFlight** on your own iPhone (internal testing needs no review):
   section 2 again on this exact build, plus Face ID for the app lock and the
   audio session hand-back after a spoken entry.
8. **The App Store listing**: copy from `store/listing.md`, 6.9-inch iPhone
   screenshots (three or more; `out/store/apple` holds drafts at the right
   size) and 13-inch iPad screenshots (required because `supportsTablet` is
   on), the App Privacy answers, the age rating, the price and territories.
9. **Submit for review** from the version page, picking the TestFlight build.
   Add the two review-note lines. First reviews commonly take one to three
   days; choose *Manually release this version* if you want to set the day.
10. Later releases: bump `version` in `app.json`, build, submit, and create the
    new version in App Store Connect with its What's New text.

