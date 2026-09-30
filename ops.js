// ops.js —— 共用编解码（DevTools 面板与页面工具条都用它）
var MHB = (function () {
  function b64enc(s) {
    let bin = '';
    const b = new TextEncoder().encode(s);
    for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
    return btoa(bin);
  }
  function b64dec(s) {
    const bin = atob(String(s).trim());
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(a);
  }

  const Ops = {
    'url-enc': s => encodeURIComponent(s),
    'url-dec': s => { try { return decodeURIComponent(s); } catch (e) { return s; } },

    'b64-enc': s => { try { return b64enc(s); } catch (e) { return s; } },
    'b64-dec': s => { try { return b64dec(s); } catch (e) { return s; } },

    'html-enc': s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                      .replace(/\x22/g, '&quot;').replace(/\x27/g, '&#39;'),
    'html-dec': s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '\x22').replace(/&#0*39;/g, '\x27')
                      .replace(/&#x0*27;/gi, '\x27').replace(/&amp;/g, '&'),

    'uni-enc': s => s.replace(/[^\x00-\x7F]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')),
    'uni-dec': s => s.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16))),

    'hex-enc': s => { const b = new TextEncoder().encode(s); let o = ''; for (let i = 0; i < b.length; i++) o += b[i].toString(16).padStart(2, '0'); return o; },
    'hex-dec': s => {
      const h = String(s).replace(/[^0-9a-fA-F]/g, '');
      if (h.length % 2) return s;
      const a = new Uint8Array(h.length / 2);
      for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
      try { return new TextDecoder().decode(a); } catch (e) { return s; }
    }
  };

  // 作用于某个输入框：有选区 → 只转选区；无选区 → 整段
  function applyOp(op, el) {
    if (!el || !Ops[op]) return;
    const v = el.value;
    const st = el.selectionStart, en = el.selectionEnd;
    const hasSel = (typeof st === 'number' && st !== en);
    const src = hasSel ? v.slice(st, en) : v;
    const out = Ops[op](src);
    if (hasSel) {
      el.value = v.slice(0, st) + out + v.slice(en);
      el.selectionStart = st;
      el.selectionEnd = st + out.length;
    } else {
      el.value = out;
    }
    el.focus();
  }

  // 绑定容器内所有 [data-op] 按钮；resolveField() 返回要作用的输入框
  function bindTools(container, resolveField) {
    container.querySelectorAll('[data-op]').forEach(btn => {
      btn.addEventListener('click', () => applyOp(btn.getAttribute('data-op'), resolveField()));
    });
  }

  return { applyOp, bindTools, Ops };
})();
