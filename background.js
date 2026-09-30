// background.js —— 点图标 → 往当前标签注入面板；负责用 DNR 挂请求头
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['ops.js', 'panel.js'] });
  } catch (e) {
    console.warn('注入失败：', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'mhb_applyHeaders') {
    (async () => {
      try {
        const old = await chrome.declarativeNetRequest.getSessionRules();
        const removeRuleIds = old.map(r => r.id);
        const addRules = [];

        let host = '';
        try { host = new URL(msg.url).host; } catch (e) {}

        const hs = (msg.headers || '')
          .split('\n')
          .map(line => {
            const i = line.indexOf(':');
            if (i <= 0) return null;
            return { header: line.slice(0, i).trim(), operation: 'set', value: line.slice(i + 1).trim() };
          })
          .filter(Boolean);

        if (hs.length && host) {
          addRules.push({
            id: 1,
            priority: 1,
            action: { type: 'modifyHeaders', requestHeaders: hs },
            condition: { urlFilter: '||' + host, resourceTypes: ['main_frame'] }
          });
        }

        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, err: String(e) });
      }
    })();
    return true; // 异步响应
  }
});
