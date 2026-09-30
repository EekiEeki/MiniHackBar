// devpanel.js —— DevTools 面板逻辑：Load 当前URL、Execute 在当前页渲染、主题开关、编解码
const $ = s => document.querySelector(s);

/* ---------- 主题（默认浅色，持久化） ---------- */
const themeCb = document.getElementById('theme');
function applyTheme(dark) {
  document.body.dataset.theme = dark ? 'dark' : 'light';
  themeCb.checked = dark;
}
chrome.storage.local.get('mhb_theme').then(r => applyTheme(r.mhb_theme === 'dark'));
themeCb.addEventListener('change', () => {
  applyTheme(themeCb.checked);
  chrome.storage.local.set({ mhb_theme: themeCb.checked ? 'dark' : 'light' });
});

/* ---------- Load 当前 URL ---------- */
function loadCurrent() {
  chrome.devtools.inspectedWindow.eval('location.href', (res, err) => {
    if (!err && res) $('#url').value = res;
  });
}
loadCurrent();
$('#load').addEventListener('click', loadCurrent);

/* ---------- 编解码 ---------- */
let lastField = document.getElementById('body');
document.querySelectorAll('input,textarea').forEach(el => {
  el.addEventListener('focus', () => { lastField = el; });
});
if (window.MHB) {
  MHB.bindTools(document.getElementById('tools'), () => lastField || document.getElementById('body'));
}

/* ---------- Execute ---------- */
$('#go').addEventListener('click', () => {
  const url = $('#url').value.trim();
  const method = $('#method').value;
  const headers = $('#headers').value;
  const body = $('#body').value;
  const msg = $('#msg');

  if (!/^https?:\/\//i.test(url)) { msg.textContent = '× URL 必须是完整 http/https 地址'; return; }
  msg.textContent = '执行中…';

  // 1) 让 background 用 DNR 挂请求头
  chrome.runtime.sendMessage({ type: 'mhb_applyHeaders', url, headers }, (r) => {
    if (!r || !r.ok) { msg.textContent = '× 挂请求头失败：' + ((r && r.err) || '扩展未响应'); return; }
    if (r.invalid && r.invalid.length) {
      msg.textContent = '× 请求头有 ' + r.invalid.length + ' 行无法解析，已取消执行（格式应为 Name: Value）：\n' +
        r.invalid.map(x => '　第 ' + x.line + ' 行：' + x.text).join('\n');
      return;
    }
    // 2) 在被检查的页面里导航/提交 → 响应在当前页渲染；DevTools 面板不消失
    if ((method || 'GET').toUpperCase() === 'GET') {
      chrome.devtools.inspectedWindow.eval('location.href = ' + JSON.stringify(url));
      msg.textContent = '√ 已导航，响应渲染在页面里';
      return;
    }
    const code =
      '(function(){' +
      'var f=document.createElement("form");f.method="POST";f.action=' + JSON.stringify(url) + ';' +
      'var p=new URLSearchParams(' + JSON.stringify(body || '') + ');' +
      'p.forEach(function(v,k){var i=document.createElement("input");i.type="hidden";i.name=k;i.value=v;f.appendChild(i);});' +
      'document.body.appendChild(f);f.submit();' +
      '})()';
    chrome.devtools.inspectedWindow.eval(code);
    msg.textContent = '√ 已提交表单，响应渲染在页面里';
  });
});
