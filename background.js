// background.js —— 点图标 → 往当前标签注入面板；负责用 DNR 挂请求头
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['ops.js', 'panel.js'] });
  } catch (e) {
    console.warn('注入失败：', e);
  }
});

// 解析请求头文本。支持：
//   Name: Value / Name:Value / Name：Value(全角冒号) / Name=Value
//   空行跳过；以 # 开头的行视为注释
// 返回 { headers, invalid }，invalid 里是看不懂的行号+内容（不再静默丢弃）
function parseHeaders(text) {
  const headers = [];
  const invalid = [];
  String(text || '').split('\n').forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line.charAt(0) === '#') return;
    const m = line.match(/^([^\s:=：]+)\s*[:：=]\s*(.*)$/);
    if (!m || !m[1]) {
      invalid.push({ line: idx + 1, text: line });
      return;
    }
    headers.push({ header: m[1].trim(), operation: 'set', value: m[2].trim() });
  });
  return { headers, invalid };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'mhb_applyHeaders') {
    (async () => {
      try {
        const { headers, invalid } = parseHeaders(msg.headers);

        let host = '';
        try { host = new URL(msg.url).host; } catch (e) {}

        // 每次先清掉上一次的规则，避免上一轮的请求头残留到下一轮
        const old = await chrome.declarativeNetRequest.getSessionRules();
        const removeRuleIds = old.map(r => r.id);
        const addRules = [];

        if (headers.length && host) {
          // operation 'set' = 该请求头已存在则用我们的值覆盖，不存在则新增
          addRules.push({
            id: 1,
            priority: 1,
            action: { type: 'modifyHeaders', requestHeaders: headers },
            condition: { urlFilter: '||' + host, resourceTypes: ['main_frame'] }
          });
        }

        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
        sendResponse({ ok: true, count: headers.length, host, invalid });
      } catch (e) {
        sendResponse({ ok: false, err: String(e) });
      }
    })();
    return true; // 异步响应
  }
});
