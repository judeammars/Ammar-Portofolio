
/* UNFILED. only. Uses dedicated unfiled_* tables and unfiled-media bucket.
   Public key below grants no write access without backend RLS approval. */
(function () {
'use strict';
var lib = window.supabase;
if (!lib || !lib.createClient) { console.error('Supabase client library missing'); return; }
var db = lib.createClient('https://bsmapmixfpiwvoptpbxt.supabase.co','sb_publishable_a51cyBh8tj1kBOiVkgAyKQ_b6ItnHrx',
  {auth:{storageKey:'unfiled-session-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
var bucket = 'unfiled-media', admin = false, account = null, editingId = null, checkId = 0;
var profilePath = '', loaded = false;
var orig = {upload:window.openUploadModal,inspect:window.openInspectModal,
  profile:window.openEditProfileModal,export:window.exportPortfolioJSON};
var localBackup = null;
try { localBackup = JSON.parse(localStorage.getItem('messy_desk_portfolio_v1') || 'null'); } catch (_) {}
var headerActions = document.querySelector('header .flex.flex-wrap.gap-2');
var trigger = document.createElement('button');
trigger.type = 'button'; trigger.textContent = '🔒 Admin Login';
trigger.className = 'bg-white/10 hover:bg-[#f4efe6] hover:text-[#22201e] border border-white/25 px-3.5 py-2 rounded-full transition cursor-pointer';
headerActions.appendChild(trigger);
var modal = document.createElement('div');
modal.className = 'fixed inset-0 bg-[#12100e]/80 backdrop-blur-sm z-[180] hidden items-center justify-center p-4';
modal.innerHTML = '<section class="bg-[#faf7f0] text-[#22201e] w-full max-w-md rounded-2xl p-7 shadow-2xl relative">' +
'<button type="button" id="uf-close" class="absolute right-4 top-4 bg-[#22201e] text-white w-9 h-9 rounded-full">×</button>' +
'<p class="font-mono-tech text-xs text-[#c84b31] mb-2">UNFILED. // OWNER ACCESS</p>' +
'<h2 class="font-serif-editorial text-3xl font-bold mb-2">Admin Login</h2>' +
'<p class="text-xs text-[#5a554f] mb-5">Masuk dengan username <strong>AMMAR</strong> dan password akun portofoliomu. Hak edit hanya berlaku untuk UNFILED.</p>' +
'<form id="uf-login" class="flex flex-col gap-3"><input id="uf-username" type="text" autocomplete="username" required maxlength="32" placeholder="Username" value="AMMAR" class="border rounded-lg px-3 py-2.5 bg-white text-sm uppercase">' +
'<input id="uf-password" type="password" autocomplete="current-password" required placeholder="Password" class="border rounded-lg px-3 py-2.5 bg-white text-sm">' +
'<p id="uf-error" class="text-red-700 text-xs hidden" role="alert"></p>' +
'<button id="uf-submit" type="submit" class="bg-[#22201e] text-white rounded-full py-3 text-xs font-mono-tech">Login</button></form>' +
'<div id="uf-signed" class="hidden"><p id="uf-status" class="text-sm mb-4"></p>' +
'<button type="button" id="uf-logout" class="bg-[#22201e] text-white rounded-full px-5 py-3 font-mono-tech text-xs">Logout</button></div></section>';
document.body.appendChild(modal);
function closeAuth(){modal.classList.add('hidden');modal.classList.remove('flex');}
function openAuth(){syncAuth();modal.classList.remove('hidden');modal.classList.add('flex');}
trigger.addEventListener('click',openAuth);
modal.querySelector('#uf-close').addEventListener('click',closeAuth);
modal.addEventListener('click',function(e){if(e.target===modal)closeAuth();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAuth();});
function syncAuth(){
 var signed=!!account;
 modal.querySelector('#uf-login').classList.toggle('hidden',signed);
 modal.querySelector('#uf-signed').classList.toggle('hidden',!signed);
 modal.querySelector('#uf-status').textContent=signed?(admin?'You are signed in as UNFILED. administrator.':'This account is not authorized to edit UNFILED.'):'';
 trigger.textContent=admin?'✎ Admin · Account':signed?'🔒 Account':'🔒 Admin Login';
 document.body.classList.toggle('unfiled-admin',admin);
 window.UNFILED_ADMIN=admin;
 if(loaded)renderPortfolio();
 var imp=document.getElementById('uf-local-import');if(imp)imp.hidden=!admin;
}
function guard(){
 if(admin&&account)return true;
 showToast('Hanya admin UNFILED. yang boleh mengubah karya.',true);return false;
}
function httpURL(v){
 if(!v)return '';
 try{var u=new URL(String(v));return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch(e){return '';}
}
function mapWork(w){return {id:w.id,category:w.category,title:w.title,duration:w.duration,
  tools:w.tools,date:w.date_label,image:w.image_url||'',imagePath:w.image_path||'',
  thumbnail:w.thumbnail_url||'',thumbnailPath:w.thumbnail_path||'',
  link:w.link||'',fullText:w.full_text||'',description:w.description||'',
  isPublished:w.is_published!==false,sortOrder:w.sort_order||0};}
async function reload(){
 var results=await Promise.all([
  db.from('unfiled_works').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false}),
  db.from('unfiled_profile').select('*').eq('id',1).maybeSingle()]);
 if(results[0].error)throw results[0].error;
 if(results[1].error)throw results[1].error;
 portfolioState.works=(results[0].data||[]).map(mapWork);
 var p=results[1].data;
 if(p){portfolioState.profile={ownerName:p.owner_name,tagline:p.tagline,bio:p.bio,
  caption:p.caption,photo:p.photo_url||''};profilePath=p.photo_path||'';}
 loaded=true;renderPortfolio();
}
async function checkAuth(){
 var index=++checkId;
 var a=await db.auth.getUser();
 if(index!==checkId)return;
 if(a.error||!a.data.user){account=null;admin=false;syncAuth();return;}
 var acl=await db.from('unfiled_admins').select('user_id').eq('user_id',a.data.user.id).maybeSingle();
 if(index!==checkId)return;
 account=a.data.user;admin=!acl.error&&!!acl.data;syncAuth();
 if(loaded)await reload().catch(function(e){showToast(e.message,true);});
}
modal.querySelector('#uf-login').addEventListener('submit',async function(e){
 e.preventDefault();
 var btn=modal.querySelector('#uf-submit'),err=modal.querySelector('#uf-error');
 err.classList.add('hidden');btn.disabled=true;btn.textContent='Checking…';
 try{
  var response=await fetch('https://bsmapmixfpiwvoptpbxt.supabase.co/functions/v1/unfiled-username-login',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':'sb_publishable_a51cyBh8tj1kBOiVkgAyKQ_b6ItnHrx'},
    body:JSON.stringify({
      username:modal.querySelector('#uf-username').value.trim(),
      password:modal.querySelector('#uf-password').value
    })
  });
  var result=await response.json().catch(function(){return {};});
  if(!response.ok||!result.session)throw Error(result.error||'Login gagal. Silakan coba lagi.');
  var r=await db.auth.setSession({
    access_token:result.session.access_token,
    refresh_token:result.session.refresh_token
  });
  if(r.error)throw r.error;
  await checkAuth();
  modal.querySelector('#uf-password').value='';
  if(!admin)throw Error('Login berhasil, tetapi akun ini bukan admin UNFILED.');
  closeAuth();showToast('UNFILED. admin access enabled.');
 }catch(ex){err.textContent=ex.message;err.classList.remove('hidden');}
 finally{btn.disabled=false;btn.textContent='Login';}
});
modal.querySelector('#uf-logout').addEventListener('click',async function(){
 var r=await db.auth.signOut({scope:'local'});
 if(r.error){showToast(r.error.message,true);return;}
 account=null;admin=false;syncAuth();closeAuth();
 await reload().catch(function(e){showToast(e.message,true);});
});
db.auth.onAuthStateChange(function(){setTimeout(function(){checkAuth().catch(console.error);},0);});
async function upload(file){
 if(!guard())throw Error('Admin required');
 var formats={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif'};
 var ext=formats[file.type];if(!ext)throw Error('Gunakan JPG, PNG, WebP, GIF, atau AVIF.');
 if(file.size>5*1024*1024)throw Error('Maksimal ukuran foto 5 MB.');
 var path=account.id+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,10)+'.'+ext;
 var response=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
 if(response.error)throw response.error;
 return {url:db.storage.from(bucket).getPublicUrl(path).data.publicUrl,path:path};
}
// Preserve an uncropped image for the detail viewer. Large stills are reduced
// proportionally, never cropped; the thumbnail crop is saved separately.
async function prepareFullImage(file){
 if(file.size<=5*1024*1024)return file;
 if(file.type==='image/gif')throw Error('GIF utuh melebihi 5 MB. Kompres file asli sebelum mengunggah.');
 var bitmap;
 try{bitmap=await createImageBitmap(file);}catch(e){throw Error('Gambar asli tidak dapat diproses. Gunakan JPG, PNG, atau WebP.');}
 try{
  var maxDim=Math.max(bitmap.width,bitmap.height);
  var limit=Math.min(3200,maxDim),quality=.88;
  for(var attempt=0;attempt<9;attempt++){
   var scale=Math.min(1,limit/maxDim),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/webp',quality);});
   canvas.width=0;canvas.height=0;
   if(blob&&blob.size<=5*1024*1024){
    return new File([blob],file.name.replace(/\.[^.]+$/,'')+'-full.webp',{type:'image/webp'});
   }
   if(quality>.62)quality-=.07;else limit=Math.round(limit*.82);
  }
  throw Error('Gambar masih terlalu besar. Coba perkecil ukuran file asli.');
 }finally{bitmap.close();}
}
async function deleteImage(path){
 if(!path)return;
 var result=await db.storage.from(bucket).remove([path]);
 if(result.error)console.warn('UNFILED orphan image cleanup:',result.error);
}
var publication=document.createElement('div');
publication.className='sm:col-span-2 flex items-center gap-2 font-mono-tech text-xs';
publication.innerHTML='<input type="checkbox" id="uf-published" checked class="w-4 h-4 accent-[#c84b31]"><label for="uf-published">Public · visible to visitors</label>';
document.querySelector('#uploadForm .grid').appendChild(publication);
window.openUploadModal=function(cat){
 if(!guard())return;
 editingId=null;orig.upload(cat);
 if(window.UNFILED_CROP)window.UNFILED_CROP.reset('workImageFile');
 document.querySelector('#uploadModal h2').textContent='Unggah Karya ke Folder';
 document.querySelector('#uf-published').checked=true;
};
window.openEditProfileModal=function(){if(!guard())return;orig.profile();if(window.UNFILED_CROP)window.UNFILED_CROP.reset('editHomePhotoFile');};
window.exportPortfolioJSON=function(){if(guard())orig.export();};
window.openInspectModal=function(id){
 orig.inspect(id);
 if(!admin)return;
 var detail=document.getElementById('inspectContent').children[1];
 if(!detail)return;
 var btn=document.createElement('button');
 btn.type='button';btn.textContent='✎ Edit This Work';
 btn.className='bg-[#22201e] text-white rounded-xl px-4 py-3 text-xs font-mono-tech';
 btn.addEventListener('click',function(){edit(id);});detail.appendChild(btn);
};
function edit(id){
 if(!guard())return;
 var w=portfolioState.works.find(function(x){return x.id===id;});
 if(!w)return;
 orig.upload(w.category);if(window.UNFILED_CROP)window.UNFILED_CROP.reset('workImageFile');editingId=id;
 document.querySelector('#uploadModal h2').textContent='Edit Karya';
 document.querySelector('#workCategory').value=w.category;
 document.querySelector('#workTitle').value=w.title;
 document.querySelector('#workDuration').value=w.duration;
 document.querySelector('#workTools').value=w.tools;
 document.querySelector('#workDate').value=w.date;
 document.querySelector('#workLink').value=w.link||'';
 document.querySelector('#workDescription').value=w.description||'';
 document.querySelector('#workFullText').value=w.fullText||'';
 document.querySelector('#workImageUrl').value=/^https?:\/\//.test(w.image)?w.image:'';
 document.querySelector('#uf-published').checked=w.isPublished!==false;
 toggleFormFields();closeModal('inspectModal');
}
window.handleSaveWork=async function(event){
 event.preventDefault();if(!guard())return;
 var btn=document.querySelector('#uploadForm button[type=submit]');btn.disabled=true;btn.textContent='Saving…';
 var uploadedPaths=[];
 try{
  var get=function(id){return document.getElementById(id).value.trim();};
  var category=get('workCategory'),old=portfolioState.works.find(function(w){return w.id===editingId;});
  var url=get('workImageUrl'),link=get('workLink');
  if(url&&!httpURL(url))throw Error('URL gambar harus HTTP(S).');
  if(link&&!httpURL(link))throw Error('URL website harus HTTP(S).');
  var image=old?(old.image||''):'',path=old?(old.imagePath||''):'';
  var thumbnail=old?(old.thumbnail||''):'',thumbnailPath=old?(old.thumbnailPath||''):'';
  // External URLs supply the same uncropped image to cards and details.
  if(url&&url!==image){image=url;path='';thumbnail='';thumbnailPath='';}
  var original=document.getElementById('workImageFile').files[0];
  var cropped=window.UNFILED_CROP&&window.UNFILED_CROP.getFile('workImageFile');
  if(original&&category!=='writings'){
    // Keep the entire original picture for the artwork detail view.
    var full=await upload(await prepareFullImage(original));
    uploadedPaths.push(full.path);
    image=full.url;path=full.path;thumbnail='';thumbnailPath='';
    // Separately upload the owner's framing as the fixed-size gallery thumbnail.
    if(cropped&&cropped!==original){
      var thumb=await upload(cropped);
      uploadedPaths.push(thumb.path);
      thumbnail=thumb.url;thumbnailPath=thumb.path;
    }
  }
  if(category==='writings'){image='';path='';thumbnail='';thumbnailPath='';}
  var id=editingId||category+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  var record={id:id,category:category,title:get('workTitle'),duration:get('workDuration'),
   tools:get('workTools'),date_label:get('workDate')||String(new Date().getFullYear()),
   image_url:image||'',image_path:path||'',
   thumbnail_url:thumbnail||'',thumbnail_path:thumbnailPath||'',
   link:httpURL(link),full_text:get('workFullText'),description:get('workDescription'),
   is_published:document.getElementById('uf-published').checked,
   sort_order:old?old.sortOrder:0,updated_at:new Date().toISOString()};
  if(!record.title||!record.duration||!record.tools)throw Error('Lengkapi judul, durasi, dan tools.');
  var save=await db.from('unfiled_works').upsert(record,{onConflict:'id'});
  if(save.error)throw save.error;
  // Delete only superseded UNFILED files, once the database change succeeds.
  if(old&&old.imagePath&&old.imagePath!==path)await deleteImage(old.imagePath);
  if(old&&old.thumbnailPath&&old.thumbnailPath!==thumbnailPath)await deleteImage(old.thumbnailPath);
  editingId=null;await reload();closeModal('uploadModal');
  if(window.UNFILED_CROP)window.UNFILED_CROP.reset('workImageFile');
  selectFolder(category);showToast('Karya tersimpan. Thumbnail di-crop, foto detail tetap utuh.');
 }catch(ex){
  for(var savedPath of uploadedPaths)await deleteImage(savedPath);
  showToast('Gagal menyimpan: '+ex.message,true);
 }finally{btn.disabled=false;btn.textContent='Simpan ke Folder';}
};
window.deleteWork=async function(id){
 if(!guard())return;
 if(pendingDeleteId!==id){
  pendingDeleteId=id;renderPortfolio();
  setTimeout(function(){if(pendingDeleteId===id){pendingDeleteId=null;renderPortfolio();}},3200);
  return;
 }
 pendingDeleteId=null;
 var old=portfolioState.works.find(function(w){return w.id===id;});
 var result=await db.from('unfiled_works').delete().eq('id',id);
 if(result.error){showToast(result.error.message,true);return;}
 if(old&&old.imagePath)await deleteImage(old.imagePath);
 if(old&&old.thumbnailPath)await deleteImage(old.thumbnailPath);
 await reload();showToast('Karya dihapus dari UNFILED.');
};
window.saveProfileChanges=async function(event){
 event.preventDefault();if(!guard())return;
 var btn=event.target.querySelector('button[type=submit]');btn.disabled=true;
 var newPath='';
 try{
  var file=(window.UNFILED_CROP&&window.UNFILED_CROP.getFile('editHomePhotoFile'))||document.getElementById('editHomePhotoFile').files[0];
  var image=portfolioState.profile.photo||'',path=profilePath;
  if(file){var up=await upload(file);image=up.url;path=up.path;newPath=up.path;}
  var profile={id:1,owner_name:document.getElementById('editOwnerName').value.trim(),
   tagline:document.getElementById('editTagline').value.trim(),
   bio:document.getElementById('editBio').value.trim(),
   caption:document.getElementById('editCaption').value.trim(),
   photo_url:image,photo_path:path,updated_at:new Date().toISOString()};
  var result=await db.from('unfiled_profile').upsert(profile,{onConflict:'id'});
  if(result.error)throw result.error;
  if(profilePath&&profilePath!==path)await deleteImage(profilePath);
  await reload();closeModal('profileModal');if(window.UNFILED_CROP)window.UNFILED_CROP.reset('editHomePhotoFile');showToast('Profil tersimpan online.');
 }catch(ex){if(newPath)await deleteImage(newPath);showToast('Gagal menyimpan profil: '+ex.message,true);}
 finally{btn.disabled=false;}
};
async function importObject(input){
 if(!guard())return;
 if(!Array.isArray(input.works)||!input.profile)throw Error('Invalid portfolio backup');
 var count=0;
 for(var w of input.works){
  if(!['art','writings','web'].includes(w.category)||!w.title)continue;
  var id=String(w.id||'');
  if(!new RegExp('^'+w.category+'-[A-Za-z0-9_-]{1,72}$').test(id))
    id=w.category+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
  var image=String(w.image||'');var path='';
  if(image.startsWith('data:image/')&&!image.startsWith('data:image/svg+xml')){
   var f=await fetch(image).then(function(r){return r.blob();});
   var up=await upload(new File([f],'import.png',{type:f.type}));image=up.url;path=up.path;
  }else if(!image.startsWith('data:image/svg+xml')){image=httpURL(image);}
  var row={id:id,category:w.category,title:String(w.title).slice(0,200),
   duration:String(w.duration||''),tools:String(w.tools||''),date_label:String(w.date||''),
   image_url:image,image_path:path,link:httpURL(w.link),
   full_text:String(w.fullText||''),description:String(w.description||''),is_published:true};
  var result=await db.from('unfiled_works').upsert(row,{onConflict:'id'});
  if(result.error)throw result.error;
  count++;
 }
 var p=input.profile,picture=String(p.photo||''),picPath='';
 if(picture.startsWith('data:image/')&&!picture.startsWith('data:image/svg+xml')){
   var blob=await fetch(picture).then(function(r){return r.blob();});
   var up=await upload(new File([blob],'profile.png',{type:blob.type}));picture=up.url;picPath=up.path;
 }else if(!picture.startsWith('data:image/svg+xml'))picture=httpURL(picture);
 var pr=await db.from('unfiled_profile').upsert({id:1,
   owner_name:String(p.ownerName||''),tagline:String(p.tagline||''),bio:String(p.bio||''),
   caption:String(p.caption||''),photo_url:picture,photo_path:picPath},{onConflict:'id'});
 if(pr.error)throw pr.error;
 await reload();showToast(count+' karya berhasil diimpor.');
}
window.importPortfolioJSON=function(e){
 if(!guard())return;
 var file=e.target.files[0];if(!file)return;
 file.text().then(async function(text){
   if(!window.confirm('Import data ke Supabase? Karya dengan ID yang sama akan diperbarui.'))return;
   await importObject(JSON.parse(text));
 }).catch(function(ex){showToast('Import gagal: '+ex.message,true);});
 e.target.value='';
};
if(localBackup&&Array.isArray(localBackup.works)&&localBackup.works.length){
 var localBtn=document.createElement('button');localBtn.id='uf-local-import';
 localBtn.type='button';localBtn.hidden=true;
 localBtn.textContent='↑ Import Browser Data';
 localBtn.className=trigger.className;
 headerActions.insertBefore(localBtn,trigger);
 localBtn.addEventListener('click',async function(){
   if(!guard()||!window.confirm('Pindahkan data lokal browser ke database online?'))return;
   localBtn.disabled=true;
   try{await importObject(localBackup);localStorage.removeItem('messy_desk_portfolio_v1');localBtn.remove();}
   catch(ex){showToast('Import gagal: '+ex.message,true);localBtn.disabled=false;}
 });
}
reload().catch(function(ex){showToast('Gagal memuat galeri online: '+ex.message,true);console.error(ex);});
checkAuth().catch(console.error);
})();
