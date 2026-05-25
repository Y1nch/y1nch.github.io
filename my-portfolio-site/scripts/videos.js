// videos.js — 使用 IndexedDB 儲存影片檔案（本機）
(function(){
    const DB_NAME = 'my-videos-db';
    const STORE = 'videos';
    let db;

    function openDB(){
        return new Promise((resolve, reject)=>{
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => {
                const idb = e.target.result;
                if(!idb.objectStoreNames.contains(STORE)){
                    idb.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = e => { db = e.target.result; resolve(db); };
            req.onerror = e => reject(e.target.error);
        });
    }

    async function addVideo(file, title){
        if(!db) await openDB();
        return new Promise((resolve,reject)=>{
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const item = { title: title || file.name, file: file, created: Date.now() };
            const req = store.add(item);
            req.onsuccess = ()=> resolve(req.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    async function getAllVideos(){
        if(!db) await openDB();
        return new Promise((resolve,reject)=>{
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const req = store.getAll();
            req.onsuccess = ()=> resolve(req.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    async function getVideo(id){
        if(!db) await openDB();
        return new Promise((resolve,reject)=>{
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const req = store.get(Number(id));
            req.onsuccess = ()=> resolve(req.result);
            req.onerror = e => reject(e.target.error);
        });
    }

    async function deleteVideo(id){
        if(!db) await openDB();
        return new Promise((resolve,reject)=>{
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const req = store.delete(Number(id));
            req.onsuccess = ()=> resolve();
            req.onerror = e => reject(e.target.error);
        });
    }

    function createListItem(v){
        const wrap = document.createElement('div');
        wrap.className = 'video-item';
        const title = document.createElement('div');
        title.className = 'video-item-title';
        title.textContent = v.title || '未命名影片';
        const meta = document.createElement('div');
        meta.className = 'video-item-meta';
        meta.textContent = new Date(v.created).toLocaleString();
        const btns = document.createElement('div');
        btns.className = 'video-item-actions';
        const play = document.createElement('button'); play.textContent='播放'; play.className='btn';
        play.addEventListener('click', async ()=>{
            const record = await getVideo(v.id);
            if(record && record.file){
                const url = URL.createObjectURL(record.file);
                const player = document.getElementById('player');
                const wrapper = document.getElementById('playerWrapper');
                player.src = url;
                document.getElementById('playerMeta').textContent = record.title;
                wrapper.style.display = 'block';
                player.play();
            }
        });
        const del = document.createElement('button'); del.textContent='刪除'; del.className='btn btn-ghost';
        del.addEventListener('click', async ()=>{
            if(confirm('確定要刪除此影片？')){
                await deleteVideo(v.id);
                renderList();
                const player = document.getElementById('player');
                player.pause(); player.src='';
                document.getElementById('playerWrapper').style.display='none';
            }
        });
        btns.appendChild(play); btns.appendChild(del);
        wrap.appendChild(title); wrap.appendChild(meta); wrap.appendChild(btns);
        return wrap;
    }

    async function renderList(){
        const list = document.getElementById('videoList');
        list.innerHTML = '';
        const items = await getAllVideos();
        if(!items || items.length===0){
            list.textContent = '目前沒有上傳的影片。';
            return;
        }
        items.sort((a,b)=>b.created-a.created);
        items.forEach(it=> list.appendChild(createListItem(it)));
    }

    // init
    document.addEventListener('DOMContentLoaded', async ()=>{
        await openDB();
        renderList();
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('videoFile');
        const titleInput = document.getElementById('videoTitle');

        uploadBtn.addEventListener('click', async ()=>{
            const files = fileInput.files;
            if(!files || files.length===0){ alert('請先選擇一個影片檔案'); return; }
            const file = files[0];
            if(file.size > 200 * 1024 * 1024){ // 200MB limit as safety
                if(!confirm('檔案可能過大，可能導致儲存失敗，仍要繼續上傳？')) return;
            }
            try{
                await addVideo(file, titleInput.value.trim());
                fileInput.value = '';
                titleInput.value = '';
                renderList();
                alert('影片已儲存至本機瀏覽器資料庫。');
            }catch(err){
                console.error(err); alert('儲存失敗：'+err);
            }
        });
    });
})();
