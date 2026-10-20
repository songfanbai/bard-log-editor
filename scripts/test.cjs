const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
process.chdir(path.resolve(__dirname, '..'));
fs.mkdirSync('test-results', { recursive: true });
const files = ['test-clock-tags.cjs','test-readme-examples.cjs','test-dice.cjs','test-bold-label.cjs','test-safety-conflicts.cjs'];
if (process.argv.includes('--browser')) {
  cp.execFileSync(process.execPath,['scripts/build.cjs'],{stdio:'inherit'});
  files.push('test-dialog-rc6.cjs','test-txt-drop.cjs','test-idb-basic.cjs','test-idb-failures.cjs','test-idb-mutations.cjs','test-help.cjs','test-role-toolbar-fixed.cjs');
}
for (const file of files) cp.execFileSync(process.execPath,[path.join('tests',file)],{stdio:'inherit'});
