/**
 * Keeps every file the app writes out of Android backups and device-to-device transfer.
 *
 * `allowBackup: false` stops cloud backup, but some makers' phones still move app data to a new phone; what
 * goes is then decided by the data-extraction rules. expo-secure-store installs rules that exclude only its
 * own keys, so scheduled reminders (with their words) would travel. These rules exclude every domain; the
 * app's own backup file is the way to move to a new phone.
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const NAME = 'onlybudget_no_transfer';
const DOMAINS = ['root', 'file', 'database', 'sharedpref', 'external'];
const block = (tag) => `  <${tag}>\n${DOMAINS.map((d) => `    <exclude domain="${d}" path="." />`).join('\n')}\n  </${tag}>`;
const EXTRACTION = `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n${block('cloud-backup')}\n${block('device-transfer')}\n</data-extraction-rules>\n`;
const FULL_BACKUP = `<?xml version="1.0" encoding="utf-8"?>\n<full-backup-content>\n${DOMAINS.map((d) => `  <exclude domain="${d}" path="." />`).join('\n')}\n</full-backup-content>\n`;

module.exports = function withNoDataTransfer(config) {
  config = withDangerousMod(config, ['android', async (cfg) => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${NAME}_extraction.xml`), EXTRACTION);
    fs.writeFileSync(path.join(dir, `${NAME}_backup.xml`), FULL_BACKUP);
    return cfg;
  }]);
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:dataExtractionRules'] = `@xml/${NAME}_extraction`;
      app.$['android:fullBackupContent'] = `@xml/${NAME}_backup`;
      app.$['android:allowBackup'] = 'false';
      // The lint rule that both attributes point at rules files is satisfied; tools:replace wins over libraries.
      const replace = new Set(String(app.$['tools:replace'] ?? '').split(',').filter(Boolean));
      ['android:dataExtractionRules', 'android:fullBackupContent', 'android:allowBackup'].forEach((a) => replace.add(a));
      app.$['tools:replace'] = [...replace].join(',');
      cfg.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    return cfg;
  });
};
