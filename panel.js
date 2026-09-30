// panel.js —— 注入到当前页面的 MiniHackBar 工具条（Shadow DOM 隔离，默认浅色+暗色开关+编解码）
(() => {
  if (window.__MHB_HOST__) {                       // 已注入 → 收起/展开
    const h = window.__MHB_HOST__;
    h.style.display = (h.style.display === 'none' ? 'block' : 'none');
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;top:10px;right:10px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
  <style>
    *{box-sizing:border-box}
    .p{
      --bg:#ffffff;--fg:#1f2937;--mut:#6b7280;--bd:#e5e7eb;--in:#ffffff;--inbd:#d1d5db;
      --accent:#2563eb;--btn2:#f3f4f6;--msg:#b45309;--hdbd:#eef0f2;
      width:480px;background:var(--bg);color:var(--fg);border:1px solid var(--bd);
      border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.18);
      font:13px/1.55 -apple-system,"Segoe UI","Microsoft YaHei",Arial,sans-serif;
    }
    .p[data-theme="dark"]{
      --bg:#1f1f1f;--fg:#e5e5e5;--mut:#9ca3af;--bd:#333;--in:#2a2a2a;--inbd:#444;
      --accent:#3b82f6;--btn2:#333;--msg:#fbbf24;--hdbd:#333;
    }
    .hd{display:flex;justify-content:space-between;align-items:center;
        padding:9px 12px;border-bottom:1px solid var(--hdbd)}
    .ttl{font-weight:600;font-size:13px;color:var(--accent)}
    .r{display:flex;align-items:center;gap:8px}
    .lab{font-size:12px;color:var(--mut)}
    .x{cursor:pointer;color:var(--mut);font-size:14px;padding:0 2px}
    .x:hover{color:#ef4444}
    .bd{padding:10px 12px 12px}
    label.f{display:block;font-size:12px;color:var(--mut);margin:10px 0 4px}
    input,select,textarea{width:100%;background:var(--in);color:var(--fg);
        border:1px solid var(--inbd);border-radius:6px;padding:7px 9px;
        font:13px Consolas,"Courier New",monospace;outline:none}
    input:focus,select:focus,textarea:focus{border-color:var(--accent)}
    textarea{height:60px;resize:vertical}
    .row{display:flex;gap:6px}
    .row input{flex:1}
    .btn{border:0;border-radius:6px;padding:8px 13px;font-size:13px;cursor:pointer;transition:.15s}
    .btn2{background:var(--btn2);color:var(--fg);border:1px solid var(--bd);white-space:nowrap}
    .btn2:hover{filter:brightness(.96)}
    .go{width:100%;margin-top:12px;background:var(--accent);color:#fff;padding:9px;font-size:14px}
    .go:hover{filter:brightness(1.08)}
    .msg{margin-top:7px;font-size:12px;color:var(--msg);white-space:pre-wrap;min-height:13px}
    .tools{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
    .tools button{background:var(--btn2);color:var(--fg);border:1px solid var(--bd);
        border-radius:5px;padding:4px 8px;font-size:12px;cursor:pointer}
    .tools button:hover{filter:brightness(.95)}
    .sw{position:relative;display:inline-block;width:38px;height:21px;cursor:pointer;flex:0 0 auto}
    .sw input{display:none}
    .sw .knob{position:absolute;inset:0;background:var(--inbd);border-radius:21px;transition:.2s}
    .sw .knob::before{content:"";position:absolute;width:15px;height:15px;left:3px;top:3px;
        background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 2px rgba(0,0,0,.3)}
    .sw input:checked + .knob{background:var(--accent)}
    .sw input:checked + .knob::before{transform:translateX(17px)}
  </style>
  <div class="p" data-theme="light">
    <div class="hd">
      <span class="ttl">MiniHackBar</span>
      <span class="r">
        <span class="lab">暗色</span>
        <label class="sw"><input type="checkbox" class="theme"><span class="knob"></span></label>
        <span class="x" title="关闭">✕</span>
      </span>
    </div>
    <div class="bd">
      <label class="f">URL</label>
      <div class="row"><input class="url"><button class="btn btn2 load">Load 当前URL</button></div>
      <label class="f">方法</label>
      <select class="method"><option>GET</option><option>POST</option></select>
      <label class="f">请求头（每行一个：Name: Value）</label>
      <textarea class="headers" placeholder="X-Forwarded-For: 127.0.0.1"></textarea>
      <label class="f">POST Body（a=1&amp;b=2）</label>
      <textarea class="body" placeholder="a=1&amp;b=2"></textarea>
      <label class="f">编解码（先选中要转的文本；不选则整段）</label>
      <div class="tools">
        <button data-op="url-enc">URL 编码</button>
        <button data-op="url-dec">URL 解码</button>
        <button data-op="b64-enc">Base64 编码</button>
        <button data-op="b64-dec">Base64 解码</button>
        <button data-op="html-enc">HTML 编码</button>
        <button data-op="html-dec">HTML 解码</button>
        <button data-op="uni-enc">Unicode 编码</button>
        <button data-op="uni-dec">Unicode 解码</button>
        <button data-op="hex-enc">Hex 编码</button>
        <button data-op="hex-dec">Hex 解码</button>
      </div>
      <button class="btn go">Execute</button>
      <div class="msg"></div>
    </div>
  </div>`;

  document.documentElement.appendChild(host);
  window.__MHB_HOST__ = host;

  const $ = s => root.querySelector(s);
  const panel = $('.p');

  /* 主题 */
  const themeCb = $('.theme');
  function applyTheme(dark) { panel.dataset.theme = dark ? 'dark' : 'light'; themeCb.checked = dark; }
  try {
    chrome.storage.local.get('mhb_theme').then(r => applyTheme(r.mhb_theme === 'dark'));
    themeCb.addEventListener('change', () => {
      applyTheme(themeCb.checked);
      chrome.storage.local.set({ mhb_theme: themeCb.checked ? 'dark' : 'light' });
    });
  } catch (e) {}

  $('.url').value = location.href;
  $('.load').addEventListener('click', () => { $('.url').value = location.href; });
  $('.x').addEventListener('click', () => { host.style.display = 'none'; });

  /* 编解码 */
  let lastField = $('.body');
  root.querySelectorAll('input,textarea').forEach(el => {
    el.addEventListener('focus', () => { lastField = el; });
  });
  if (window.MHB) {
    MHB.bindTools($('.tools'), () => lastField || $('.body'));
  }

  $('.go').addEventListener('click', () => {
    const url = $('.url').value.trim();
    const method = $('.method').value;
    const headers = $('.headers').value;
    const body = $('.body').value;
    const msg = $('.msg');

    if (!/^https?:\/\//i.test(url)) { msg.textContent = '× URL 必须是完整 http/https 地址'; return; }
    msg.textContent = '执行中…';

    chrome.runtime.sendMessage({ type: 'mhb_applyHeaders', url, headers }, () => {
      if ((method || 'GET').toUpperCase() === 'GET') { location.href = url; return; }
      const f = document.createElement('form');
      f.method = 'POST'; f.action = url;
      try {
        new URLSearchParams(body || '').forEach((v, k) => {
          const i = document.createElement('input');
          i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
        });
      } catch (e) {}
      document.body.appendChild(f);
      f.submit();
    });
  });
})();
