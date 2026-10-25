# Privacy Policy — OnlyBudget

**Last updated: 24 October 2026**

OnlyBudget is a budgeting app that runs entirely on your phone. It has no server
and no account. We do not receive your budget, and there is no "we" that could:
nothing you enter is transmitted to the developer of this app, at any point, for
any reason.

This policy explains that in full, including the one case where something can
leave your device and exactly what it involves.

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
device's own encryption. On iOS the files are locked whenever the device is
locked with a passcode. On the web version it is stored in your browser, under
the origin the app is served from.

OnlyBudget never makes a copy of this data anywhere else; you make one yourself
by exporting it (see **Backups and exports**). On Android the app is left out
of Google's automatic backup and of transfers to a new phone. On iOS, a backup
of the whole iPhone that you make to iCloud or to a computer includes the data
of the apps on it, OnlyBudget's too, as for any app; that backup is yours and
Apple's terms cover it, and OnlyBudget cannot read or reach it.

## What leaves your device, and when

One feature involves a network, and only one. It is described here in full.

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

### 2. Nothing else

This version of the app has no feature that sends anything off your phone. It
makes no network requests of its own: there is no server, no account, no
analytics and no crash reporting. The only outbound connection the app is built
to be capable of, an optional parsing assist that would send a single unclear
phrase to a language model with your own API key, is switched off in the code
for this release and cannot be turned on from the app. If a later version
offers it, this policy will describe it before it ships, it will be off by
default, and turning it on will ask you first.

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

## The purchase

The app is free for 30 days, then a one-time purchase keeps new entries
coming. The purchase is made through Apple's App Store or Google Play, with
your store account, under their terms and privacy policies. OnlyBudget never
sees your payment details. The app keeps one thing about it on your phone: a
note that the purchase was made (or restored), plus the day the app was first
opened and the day it was last opened, so it knows where the trial stands. None
of that is sent anywhere, and none of it is in your backups.

## Deleting your data

Settings → **Erase everything** removes every entry, goal, reminder, debt,
import record and learned word from the device, and returns the app to the state it was in when you installed it. It takes
effect immediately and cannot be undone.

Uninstalling the app also removes everything on the device. (An iPhone backup
you made earlier keeps what was there when it was made, until you delete that
backup.)

Because OnlyBudget keeps no copy of your data off your device, there is nothing
to request deletion of from us, and no request to make.

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

**[support@mradsoftware.com](mailto:support@mradsoftware.com)**

---

*OnlyBudget is published by MRAD Software Solutions LLC. This
document describes the app's behaviour as implemented; it is not legal advice,
and you should have it reviewed before you rely on it for a store submission.*
