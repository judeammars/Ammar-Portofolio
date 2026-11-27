/* UNFILED Writings: safe rich text editing and optional Spotify soundtrack.
   Nothing in this file changes Athenaeum tables or its editor. */
(function () {
  'use strict';
  const editor = document.getElementById('uf-rich-editor');
  const hidden = document.getElementById('workFullText');
  const toolbar = document.getElementById('uf-writing-toolbar');
  const spotifyInput = document.getElementById('workSpotify');
  if (!editor || !hidden || !toolbar || !spotifyInput) {
    console.error('[UNFILED] Writings editor markup is missing');
    return;
  }

  const permitted = new Set(['P','DIV','BR','STRONG','B','EM','I','U','SPAN','BLOCKQUOTE']);
  const discard = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','LINK','META','FORM','INPUT','BUTTON','VIDEO','AUDIO','IMG','TEMPLATE','NOSCRIPT']);
  const alignments = new Set(['left','center','right','justify']);
  const commands = Object.freeze({
    bold:'bold', italic:'italic', underline:'underline',
    left:'justifyLeft', center:'justifyCenter', right:'justifyRight', justify:'justifyFull'
  });

  function sanitizeHtml(html) {
    if (!html) return '';
    const template = document.createElement('template');
    template.innerHTML = String(html);
    const safe = document.createElement('div');
    function collect(input, output) {
      Array.from(input.childNodes).forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          output.appendChild(document.createTextNode(node.textContent));
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || discard.has(node.tagName)) return;
        const name = node.tagName;
        if (!permitted.has(name)) {
          collect(node,output);
          return;
        }
        let target = document.createElement(name.toLowerCase());
        const align = (node.style && node.style.textAlign || node.getAttribute('align') || '').toLowerCase();
        if (alignments.has(align) && (name==='DIV'||name==='P'||name==='BLOCKQUOTE')) {
          target.style.textAlign = align;
        }
        // Some browsers implement underline with an inline span style.
        if (name==='SPAN' && node.style && (
          node.style.textDecorationLine.includes('underline') ||
          node.style.textDecoration.includes('underline')
        )) target.style.textDecoration='underline';
        collect(node,target);
        output.appendChild(target);
      });
    }
    collect(template.content,safe);
    return safe.innerHTML;
  }
  function escapeText(value) {
    const el=document.createElement('div');
    el.textContent=String(value||'');
    return el.innerHTML;
  }
  function readHtml(item) {
    const html=String(item && item.fullHtml || '').trim();
    if (html) return sanitizeHtml(html);
    return escapeText(item && (item.fullText || item.description) || '').replace(/\r\n?/g,'\n').replace(/\n/g,'<br>');
  }
  function getSnippet(item) {
    const plain=String(item && (item.fullText || '') || '').trim();
    if (plain) return plain.replace(/\s+/g,' ').slice(0,210);
    const el=document.createElement('div');
    el.innerHTML=sanitizeHtml(item && item.fullHtml || '');
    return (el.textContent || String(item && item.description || '')).replace(/\s+/g,' ').trim().slice(0,210);
  }

  function parseSpotify(value) {
    let raw=String(value||'').trim();
    if (!raw) return '';
    // Spotify share URIs may also be pasted without an https link.
    const uri = /^spotify:(track|album|playlist|episode|show):([a-zA-Z0-9]{22})$/.exec(raw);
    if (uri) return 'https://open.spotify.com/'+uri[1]+'/'+uri[2];
    let url;
    try { url=new URL(raw); } catch (_) { return null; }
    if (url.protocol!=='https:' || url.hostname.toLowerCase()!=='open.spotify.com') return null;
    let path=url.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
    if (/^intl-[a-z]{2}$/i.test(path[0]||'')) path.shift();
    if (path[0]==='embed') path.shift();
    if (path.length!==2 || !['track','album','playlist','episode','show'].includes(path[0]) || !/^[A-Za-z0-9]{22}$/.test(path[1])) return null;
    return 'https://open.spotify.com/'+path[0]+'/'+path[1];
  }
  function embedSpotify(value) {
    const canonical=parseSpotify(value);
    if (!canonical) return '';
    const parts=new URL(canonical).pathname.split('/').filter(Boolean);
    const height=parts[0]==='track' || parts[0]==='episode'?152:232;
    const src='https://open.spotify.com/embed/'+parts[0]+'/'+parts[1]+'?utm_source=generator';
    return '<div class="uf-soundtrack"><div class="uf-soundtrack-label">♫ SOUNDTRACK FOR THIS WRITING</div>'+
      '<iframe loading="lazy" title="Spotify soundtrack" src="'+src+'" width="100%" height="'+height+'" '+
      'frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" '+
      'referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  }

  function setEditor(html, fallback) {
    editor.innerHTML=html ? sanitizeHtml(html) : '';
    if (!html) editor.textContent=String(fallback||'');
    selectedRange=null;
    hidden.value=editor.innerText;
  }
  function getHtml() {return sanitizeHtml(editor.innerHTML);}
  function getText() {return (editor.innerText||editor.textContent||'').replace(/\r\n?/g,'\n').trim();}
  function syncText() {hidden.value=getText();}
  editor.addEventListener('input',syncText);
  editor.addEventListener('paste',function(e){
    e.preventDefault();
    const pasted=e.clipboardData?.getData('text/plain')||'';
    document.execCommand('insertText',false,pasted);
    syncText();
  });

  // Preserve the active text range when toolbar focus changes, including mobile.
  let selectedRange = null;
  document.addEventListener('selectionchange',function () {
    const selection=window.getSelection();
    if (!selection || !selection.rangeCount) return;
    if (editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) {
      selectedRange=selection.getRangeAt(0).cloneRange();
    }
  });
  toolbar.querySelectorAll('button[data-cmd]').forEach(function (btn) {
    // Keep the selected text highlighted when the user clicks a formatting tool.
    btn.addEventListener('mousedown',function(e){e.preventDefault();});
    btn.addEventListener('click',function(){
      const command=commands[btn.dataset.cmd];
      if (!command) return;
      editor.focus();
      if (selectedRange) {
        const selection=window.getSelection();
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
      document.execCommand(command,false,null);
      syncText();
    });
  });
  editor.addEventListener('keydown',function(e){
    if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='u') {
      e.preventDefault();
      document.execCommand('underline');
    }
  });

  function stopSpotifyInModal() {
    const modal=document.getElementById('inspectModal');
    if(!modal)return;
    modal.querySelectorAll('.uf-soundtrack iframe').forEach(function(iframe){
      iframe.removeAttribute('src');
    });
  }
  // The soundtrack is never left playing when the reader closes the file.
  const oldClose=window.closeModal;
  if (typeof oldClose==='function') {
    window.closeModal=function(id) {
      if (id==='inspectModal') stopSpotifyInModal();
      return oldClose(id);
    };
  }

  window.UNFILED_WRITING={
    sanitize:sanitizeHtml,
    setEditor:setEditor,
    getHtml:getHtml,
    getText:getText,
    readHtml:readHtml,
    snippet:getSnippet,
    normalizeSpotify:parseSpotify,
    embedSpotify:embedSpotify,
    stopSpotify:stopSpotifyInModal
  };
})();