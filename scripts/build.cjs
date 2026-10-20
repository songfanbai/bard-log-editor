const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'app'), out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + fs.readFileSync(path.join(src, 'style.css'), 'utf8') + '</style>');
for (const file of ['core.js', 'fonts.js', 'app.js', 'customize.js', 'workspace.js']) {
  html = html.replace('<script src="' + file + '"></script>', () => '<script>' + fs.readFileSync(path.join(src, file), 'utf8') + '</script>');
}
fs.writeFileSync(path.join(out, '吟游诗人随手记·对话log编辑器.html'), html);
fs.copyFileSync(path.join(root, 'examples', '示例日志.txt'), path.join(out, '示例日志.txt'));
fs.copyFileSync(path.join(root, 'docs', '使用说明.txt'), path.join(out, '使用说明.txt'));
fs.copyFileSync(path.join(root, 'docs', 'KNOWN_ISSUES.md'), path.join(out, '已知限制.md'));
console.log('Built dist/吟游诗人随手记·对话log编辑器.html (all runtime dependencies embedded)');
