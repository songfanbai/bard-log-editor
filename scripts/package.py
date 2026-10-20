"""Package only reviewed generated files; never include browser profiles or test results."""
from pathlib import Path
import json
import zipfile
root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8-sig'))['version']
files = ['吟游诗人随手记·对话log编辑器.html', '示例日志.txt', '使用说明.txt', '已知限制.md']
for name in files:
    if not (root / 'dist' / name).is_file():
        raise SystemExit('请先运行 npm run build')
output = root / 'dist' / ('bard-log-editor-' + version + '.zip')
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / 'dist' / name, name)
print(output.name)
