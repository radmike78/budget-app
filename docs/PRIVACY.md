# Privacy Policy — OnlyBudget

**Last updated: 4 October 2026**

OnlyBudget is a budgeting app that runs entirely on your phone. It has no server
and no account. We do not receive your budget, and there is no "we" that could:
nothing you enter is transmitted to the developer of this app, at any point, for
any reason.

This policy explains that in full, including the two cases where something does
leave your device and exactly what they involve.

## The short version

- **No account.** You never sign up, and there is nothing to sign in to.
- **No bank linking.** OnlyBudget never asks for bank credentials and has no
  ability to connect to a financial institution. Every amount is one you typed
  or spoke.
- **No analytics, no ads, no trackers.** The app contains no analytics SDK, no
  advertising identifier, no crash-reporting service and no third-party tracking
  of any kind.
- **No server.** The developer operates no backend for this app. There is
  nowhere for your data to be sent, and no database of users.
- **Your data stays on your phone**, in the app's own storage, until you delete
  it or uninstall the app.

## What the app stores, and where

Everything you enter is kept in a database inside the app's private storage on
your device: entries and their amounts, dates, notes and categories; categories
and their limits; goals; repeating entries; reminders; debts; records of
statements you imported; and your settings.

On iOS and Android this storage is private to the app and is covered by the
device's own encryption when the device is locked with a passcode. On the web
version it is stored in your browser, under the origin the app is served from.

No copy of this data exists anywhere else unless you make one yourself, by
exporting it (see **Backups and exports**).

## What leaves your device, and when

Two features involve a network, and only two. Both are described here in full.

### 1. Speech recognition, when you use the microphone

When you tap the microphone, your phone's own speech recognizer turns what you
say into text. OnlyBudget never records audio, never stores audio, and never
sends audio anywhere itself.

The recognizer is part of your operating system, not part of this app:

- Where the device supports **on-device recognition**, OnlyBudget asks for it,
  and the audio does not leave the phone.
- Where it does not, the platform's recognizer may send the audio to Apple or
  Google for processing. That is a function of your operating system, and
  **their** privacy policy governs it, not this one. Your device settings
  control it.

Microphone and speech-recognition permissions are requested the first time you
use the mic, and the microphone is active only while you are speaking an entry.
You can use every feature of the app by typing instead.

### 2. Smart parsing assist — off by default, your own key

OnlyBudget includes an optional feature that asks a language model for help when
its own parser could not understand a phrase. It is **off when you install the
app**, and turning it on requires you to paste in your own Anthropic API key.

When, and only when, you have turned it on and supplied a key:

- The phrase you typed or spoke is sent to `api.anthropic.com`, along with the
  names of your categories, so the model can pick one.
- **Card, account, routing and IBAN numbers are stripped out of the phrase
  before it is sent.** The app applies the same redaction it uses before writing
  anything to its own database.
- Nothing else is sent. Not your history, not your totals, not your goals, not
  any identifier for you or your device.
- The request goes directly from your phone to Anthropic, using your key and
  your account with them. Anthropic's terms and privacy policy apply to it. The
  developer of this app is not a party to it and cannot see it.
- Your API key is held in the device keychain (iOS) or keystore (Android), and
  in browser storage on the web version. It is never sent anywhere but to
  Anthropic, as the credential for your own request.

Turning the feature off stops this entirely. Removing the key deletes it from
the device.

`api.anthropic.com` is the only outbound host this app will ever contact. The
web version enforces that with a Content Security Policy.

## Statements you import

If you import a bank or card statement, or a credit report, as a PDF:

- The file is read **on your device**. It is not uploaded anywhere.
- Text extraction runs inside a sandboxed view with no network access at all.
- The file's bytes are wiped from memory as soon as the text has been read, and
  the app's copy of the file is deleted.
- The file's **name is not kept**, because file names often contain account
  numbers.
- Card, account, routing and IBAN numbers are removed from the text before any
  entry is saved. A line that reads `PAYMENT TO 4123456789019876 VISA` is stored
  as `PAYMENT TO VISA`.
- A PDF that carries JavaScript, an embedded executable or a launch action is
  refused rather than opened.

You see and can change every line before anything is saved.

## Notifications

Reminders you create are scheduled by your device and delivered by your device.
No reminder is sent through a server, and the app has no push-notification token
and no ability to send you anything remotely. Notification permission is
optional; if you refuse it, reminders are still saved, and the app tells you
they will not alert.

## Backups and exports

You can export your data at any time, as a CSV file, a readable summary, or a
full backup. An export goes wherever **you** send it through your phone's own
share sheet. Once it leaves the app it is an ordinary file in your control, and
this policy no longer governs it — if you put it in a cloud drive, that
provider's terms apply.

Full backups can be encrypted with a passphrase you choose. Encryption uses
scrypt for key derivation and XChaCha20-Poly1305 for the data. The passphrase is
never stored and cannot be recovered: if you lose it, that backup cannot be
opened, by us or by anyone.

## Deleting your data

Settings → **Erase everything** removes every entry, goal, reminder, debt,
import record and learned word from the device, clears your saved Smart Assist
key, and returns the app to the state it was in when you installed it. It takes
effect immediately and cannot be undone.

Uninstalling the app also removes everything.

Because no copy of your data exists off your device, there is nothing to request
deletion of from anyone else, and no request to make.

## Children

OnlyBudget is not directed at children and does not knowingly collect
information from anyone. It collects no personal information from any user, of
any age.

## Your rights

Laws such as the GDPR and the CCPA give you rights over personal data a company
holds about you — access, correction, portability, deletion, and the right to
know whether it is sold.

The developer of OnlyBudget holds no personal data about you. There is no user
record, no profile and no identifier. Your data is in your possession, on your
device, and only you can read it. In practical terms:

- **Access and portability**: everything is in the app, and the export produces
  a complete, readable copy in a standard format.
- **Correction**: every entry is editable.
- **Deletion**: Settings → Erase everything, or uninstall.
- **Sale or sharing**: your data is never sold, shared, rented or disclosed. No
  mechanism exists by which it could be.

## Changes to this policy

If this policy changes, the date at the top changes with it, and the updated
version is published at this address. A change that affects what leaves your
device will also be described in the app's release notes.

## Contact

Questions about this policy or about the app:

**[ADD A CONTACT EMAIL BEFORE PUBLISHING]**

---

*OnlyBudget is published by [ADD THE PUBLISHER NAME BEFORE PUBLISHING]. This
document describes the app's behaviour as implemented; it is not legal advice,
and you should have it reviewed before you rely on it for a store submission.*
