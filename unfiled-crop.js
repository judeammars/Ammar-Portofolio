/* UNFILED. picture framing editor. Client-side only: no photo sent until owner saves. */
(function () {
  'use strict';
  var selections = new Map(), previews = new Map();
  var current = null, dragging = null;
  var css = document.createElement('style');
  css.textContent = [
    '#uf-crop-modal{position:fixed;inset:0;z-index:250;background:rgba(18,16,14,.84);',
    'backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:14px}',
    '#uf-crop-modal.open{display:flex}',
    '.uf-crop-panel{width:min(100%,620px);max-height:95vh;overflow:auto;background:#faf7f0;',
    'color:#22201e;border-radius:18px;padding:22px;box-shadow:0 30px 90px #0008;font-family:"Plus Jakarta Sans",sans-serif}',
    '.uf-crop-head{display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '.uf-crop-label{font-family:"Space Mono",monospace;font-size:11px;color:#c84b31;letter-spacing:.12em}',
    '.uf-crop-title{font-family:"Cormorant Garamond",serif;font-size:34px;font-weight:700;line-height:1.1;margin:7px 0}',
    '.uf-crop-caption{font-size:12px;color:#696157;line-height:1.55;margin:0 0 12px}',
    '#uf-crop-canvas{display:block;width:100%;height:auto;touch-action:none;cursor:grab;user-select:none;',
    'border:1px solid #bfb7ad;border-radius:9px;background:#e7e2d9}',
    '#uf-crop-canvas:active{cursor:grabbing}',
    '.uf-crop-control{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:13px 0}',
    '.uf-crop-control label{font-size:12px;font-weight:700}',
    '#uf-crop-zoom{flex:1;min-width:130px;accent-color:#c84b31}',
    '.uf-crop-options{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}',
    '.uf-crop-options button{border:1px solid #c8c1b8;padding:8px 12px;border-radius:999px;',
    'font:11px "Space Mono",monospace;background:#fff;cursor:pointer}',
    '.uf-crop-options button[aria-pressed=true]{background:#22201e;color:#fff;border-color:#22201e}',
    '.uf-crop-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:17px}',
    '.uf-crop-actions button{border:1px solid #c8c1b8;padding:11px 15px;border-radius:999px;',
    'font:11px "Space Mono",monospace;cursor:pointer;background:#fff;color:#22201e}',
    '.uf-crop-actions .uf-crop-save{background:#c84b31;color:white;border-color:#c84b31;font-weight:700}',
    '#uf-crop-error{color:#b42d22;font-size:12px;margin-top:8px}',
    '@media(max-width:420px){.uf-crop-panel{padding:15px}.uf-crop-title{font-size:29px}}'
  ].join('');
  document.head.appendChild(css);
  var dialog = document.createElement('div');
  dialog.id = 'uf-crop-modal';
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-label','Atur crop foto');
  dialog.innerHTML =
    '<div class="uf-crop-panel">' +
      '<div class="uf-crop-head"><span class="uf-crop-label">UNFILED. / IMAGE ADJUSTMENT</span>' +
      '<button type="button" id="uf-crop-x" aria-label="Tutup editor" style="background:#22201e;color:white;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">×</button></div>' +
      '<h2 class="uf-crop-title">Atur Komposisi Foto</h2>' +
      '<p class="uf-crop-caption">Geser foto untuk menentukan bagian yang terlihat. Atur zoom atau pilih <b>Muat utuh</b> agar ilustrasi tidak terpotong. Ukuran bingkai tetap.</p>' +
      '<canvas id="uf-crop-canvas" width="1600" height="1200" aria-label="Area foto yang dapat digeser"></canvas>' +
      '<div class="uf-crop-options" aria-label="Cara menampilkan foto">' +
        '<button type="button" id="uf-crop-fill" aria-pressed="true">Crop / Isi bingkai</button>' +
        '<button type="button" id="uf-crop-fit" aria-pressed="false">Muat utuh</button>' +
      '</div>' +
      '<div class="uf-crop-control"><label for="uf-crop-zoom">Zoom</label>' +
        '<input id="uf-crop-zoom" type="range" min="1" max="3" step=".01" value="1">' +
        '<button type="button" id="uf-crop-reset" style="background:transparent;border:0;color:#c84b31;cursor:pointer;font-size:12px">Reset</button>' +
      '</div>' +
      '<p id="uf-crop-error" role="alert" hidden></p>' +
      '<div class="uf-crop-actions"><button type="button" id="uf-crop-cancel">Batal</button>' +
        '<button type="button" id="uf-crop-original">Gunakan foto asli</button>' +
        '<button type="button" id="uf-crop-apply" class="uf-crop-save">Terapkan Crop</button></div>' +
    '</div>';
  document.body.appendChild(dialog);
  var canvas = dialog.querySelector('#uf-crop-canvas');
  var ctx = canvas.getContext('2d');
  var zoomInput = dialog.querySelector('#uf-crop-zoom');
  var errLabel = dialog.querySelector('#uf-crop-error');
  var fillBtn = dialog.querySelector('#uf-crop-fill'), fitBtn = dialog.querySelector('#uf-crop-fit');

  function resetSelection(id) {
    selections.delete(id);
    var old = previews.get(id);
    if (old) URL.revokeObjectURL(old);
    previews.delete(id);
    if (id === 'workImageFile') {
      var preview = document.getElementById('uploadPreviewImg');
      if (preview) { preview.removeAttribute('src'); preview.classList.add('hidden'); }
    }
  }
  function error(message) { errLabel.textContent = message || ''; errLabel.hidden = !message; }
  function clampOffsets() {
    if (!current) return;
    var W = canvas.width, H = canvas.height, img = current.img;
    var base = current.mode === 'fill'
      ? Math.max(W / img.naturalWidth, H / img.naturalHeight)
      : Math.min(W / img.naturalWidth, H / img.naturalHeight);
    var width = img.naturalWidth * base * current.zoom;
    var height = img.naturalHeight * base * current.zoom;
    var boundX = Math.max(0, (width - W) / 2);
    var boundY = Math.max(0, (height - H) / 2);
    current.dx = Math.max(-boundX, Math.min(boundX, current.dx));
    current.dy = Math.max(-boundY, Math.min(boundY, current.dy));
    return {width:width, height:height};
  }
  function render() {
    if (!current || !current.img.complete) return;
    var dim = clampOffsets();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Neutral mat is visible only where "Muat utuh" leaves room around the artwork.
    if (current.mode === 'fit') {
      ctx.fillStyle = '#eee9e1';
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(current.img,
      (canvas.width - dim.width) / 2 + current.dx,
      (canvas.height - dim.height) / 2 + current.dy,
      dim.width, dim.height);
    fillBtn.setAttribute('aria-pressed',String(current.mode === 'fill'));
    fitBtn.setAttribute('aria-pressed',String(current.mode === 'fit'));
    zoomInput.value = String(current.zoom);
  }
  function close() {
    dialog.classList.remove('open');
    if (current && current.sourceURL) URL.revokeObjectURL(current.sourceURL);
    current = null; dragging = null;
  }
  function commit(file) {
    if (!current) return;
    var id = current.id;
    resetSelection(id);
    selections.set(id, file);
    var objectURL = URL.createObjectURL(file);
    previews.set(id,objectURL);
    if (id === 'workImageFile') {
      var preview = document.getElementById('uploadPreviewImg');
      if (preview) {
        preview.src = objectURL;
        preview.classList.remove('hidden');
      }
    } else {
      var profilePreview = document.getElementById('uf-profile-crop-preview');
      if (profilePreview) { profilePreview.src = objectURL; profilePreview.hidden = false; }
    }
    close();
  }
  function cancel() {
    if (!current) return;
    var id = current.id;
    var input = document.getElementById(id);
    if (input) input.value = '';
    resetSelection(id);
    close();
  }
  function begin(input, file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 25*1024*1024) {
      if (typeof showToast === 'function') showToast('Foto lebih dari 25 MB. Pilih file lebih kecil.',true);
      input.value = '';
      return;
    }
    close(); resetSelection(input.id);
    error('');
    var sourceURL = URL.createObjectURL(file);
    var img = new Image();
    var mode = input.id === 'editHomePhotoFile' ? 'home' : 'work';
    canvas.width = 1600;
    canvas.height = mode === 'home' ? 900 : 1200;
    current = { id:input.id, file:file, sourceURL:sourceURL, img:img, mode:'fill', zoom:1, dx:0, dy:0 };
    img.onload = function () {
      if (!current || current.sourceURL !== sourceURL) return;
      render();
      dialog.classList.add('open');
      zoomInput.focus();
    };
    img.onerror = function () {
      if (!current || current.sourceURL !== sourceURL) return;
      error('Gambar tidak dapat dibuka. Coba gunakan PNG atau JPG.');
      if (typeof showToast === 'function') showToast('Gambar gagal dimuat untuk crop.',true);
      cancel();
    };
    img.src = sourceURL;
  }

  ['workImageFile','editHomePhotoFile'].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('change', function (event) {
      var file = input.files && input.files[0];
      if (!file) return;
      // Prevent the old base64 preview handler from replacing our crop preview.
      event.stopImmediatePropagation();
      begin(input,file);
    }, true);
  });

  dialog.querySelector('#uf-crop-x').addEventListener('click',cancel);
  dialog.querySelector('#uf-crop-cancel').addEventListener('click',cancel);
  dialog.addEventListener('click',function(e){if(e.target === dialog) cancel();});
  document.addEventListener('keydown',function(e){
    if (e.key === 'Escape' && dialog.classList.contains('open')) {
      e.stopImmediatePropagation();
      cancel();
    }
  },true);
  fillBtn.addEventListener('click',function(){if(!current)return;current.mode='fill';current.dx=0;current.dy=0;render();});
  fitBtn.addEventListener('click',function(){if(!current)return;current.mode='fit';current.dx=0;current.dy=0;render();});
  zoomInput.addEventListener('input',function(){if(!current)return;current.zoom=Number(zoomInput.value);render();});
  dialog.querySelector('#uf-crop-reset').addEventListener('click',function(){
    if (!current) return;
    current.zoom = 1;current.dx = 0;current.dy = 0;render();
  });
  canvas.addEventListener('pointerdown',function(e){
    if (!current) return;
    dragging = {pointerId:e.pointerId,x:e.clientX,y:e.clientY,dx:current.dx,dy:current.dy};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',function(e){
    if (!dragging || !current || dragging.pointerId !== e.pointerId) return;
    var rect = canvas.getBoundingClientRect(), factor = canvas.width / rect.width;
    current.dx = dragging.dx + (e.clientX - dragging.x)*factor;
    current.dy = dragging.dy + (e.clientY - dragging.y)*factor;
    render();
  });
  function endDrag(e){if (dragging && dragging.pointerId === e.pointerId) dragging=null;}
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('wheel',function(e){
    if (!current) return;
    e.preventDefault();
    current.zoom = Math.max(1,Math.min(3,current.zoom + (e.deltaY < 0 ? .06 : -.06)));
    render();
  },{passive:false});
  dialog.querySelector('#uf-crop-original').addEventListener('click',function(){
    if (!current) return;
    if (current.file.size > 5*1024*1024) {
      error('Foto asli lebih dari 5 MB. Gunakan crop agar ukurannya lebih kecil.');
      return;
    }
    commit(current.file);
  });
  dialog.querySelector('#uf-crop-apply').addEventListener('click',function(){
    if (!current) return;
    var button=this, state=current;
    button.disabled=true;button.textContent='Memproses…';
    error('');
    canvas.toBlob(function(blob) {
      button.disabled=false;button.textContent='Terapkan Crop';
      if (!state || current!==state) return;
      if (!blob) { error('Gagal memproses gambar. Coba lagi.'); return; }
      var extension=blob.type==='image/webp'?'webp':'jpg';
      var name=state.file.name.replace(/\.[^.]+$/,'')+'-cropped.'+extension;
      if(blob.size>5*1024*1024){error('Hasil crop lebih dari 5 MB. Coba zoom atau foto berbeda.');return;}
      commit(new File([blob],name,{type:blob.type||'image/jpeg'}));
    },'image/webp',.9);
  });

  // Keep the crop result in browser memory until the secure upload has finished.
  window.UNFILED_CROP = {
    getFile:function(id) { return selections.get(id) || null; },
    reset:function(id) {
      if (current && current.id===id) close();
      resetSelection(id);
      var input = document.getElementById(id);
      if(input) input.value='';
      var profilePreview=document.getElementById('uf-profile-crop-preview');
      if (id === 'editHomePhotoFile' && profilePreview) profilePreview.hidden=true;
    }
  };
  // Make the confirmed profile crop visible before submitting profile changes.
  var profileInput=document.getElementById('editHomePhotoFile');
  if(profileInput) {
    var preview=document.createElement('img');
    preview.id='uf-profile-crop-preview';preview.hidden=true;preview.alt='Pratinjau crop foto Home';
    preview.style.cssText='display:block;max-width:100%;max-height:180px;margin-top:8px;border-radius:8px;object-fit:contain';
    profileInput.insertAdjacentElement('afterend',preview);
    // "hidden" is overridden by display:block in some stylesheets.
    var pcss=document.createElement('style');
    pcss.textContent='#uf-profile-crop-preview[hidden]{display:none!important}';
    document.head.appendChild(pcss);
  }
})();