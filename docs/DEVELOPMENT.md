# 开发与测试

运行应用无需安装依赖。源码入口为 `app/index.html`，需保留同目录资源。构建需要 Node.js 20+，ZIP 打包需要 Python 3。

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run package
```

可通过 `BROWSER_EXECUTABLE` 指定已安装的 Chrome/Chromium。Playwright 仅用于测试，不进入离线应用。

`app/` 为源码，`tests/` 为回归测试，`scripts/` 为构建脚本；`dist/` 和 `test-results/` 为不提交的生成物。发布仅上传白名单构建文件，不打包浏览器数据或开发目录。
