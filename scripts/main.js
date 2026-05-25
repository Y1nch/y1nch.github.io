document.addEventListener('DOMContentLoaded', () => {
    // 平滑滾動導覽
    document.querySelectorAll('.site-nav a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({behavior:'smooth',block:'start'});
        });
    });

    // 指定要顯示的遊戲（使用者提供）
    const games = [
        {title:'第五人格', desc:'非對稱對戰、心理恐懼與解謎元素並存', img:'assets/IDV.jpg', platform:'Mobile/PC'},
        {title:'Roblox', desc:'多樣化玩家自製遊戲平台與社群創作', img:'assets/RBX.jpg', platform:'PC/多平台'},
        {title:'Apex 英雄', desc:'英雄技能與快速移動的團隊射擊遊戲', img:'assets/APEX.jpg', platform:'PC/主機'},
        {title:'特戰英豪', desc:'戰術射擊、快節奏競技型玩法', img:'assets/VAL.jpg', platform:'PC'}
    ];

    const grid = document.getElementById('projectGrid');
    const modal = document.getElementById('gameModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalClose = modal ? modal.querySelector('.modal-close') : null;

    function openModal(game){
        if(!modal) return;
        modalImage.src = game.img;
        modalImage.alt = game.title;
        modalCaption.textContent = `${game.title} — ${game.platform}`;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden','false');
    }

    function closeModal(){
        if(!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
        modalImage.src = '';
    }

    if(grid){
        games.forEach(g => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="thumb" style="background-image:url('${g.img}')" role="img" aria-label="${g.title}"></div>
                <div class="card-body">
                    <h4>${g.title}</h4>
                    <p>${g.desc}</p>
                </div>`;
            card.addEventListener('click', ()=> openModal(g));
            grid.appendChild(card);
        });
    }

    if(modal){
        modal.addEventListener('click', (e)=>{
            if(e.target === modal) closeModal();
        });
    }

    if(modalClose){
        modalClose.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') closeModal();
    });

    // 聯絡表單簡單處理
    const contactForm = document.getElementById('contactForm');
    if(contactForm){
        contactForm.addEventListener('submit',(e)=>{
            e.preventDefault();
            const formData = new FormData(contactForm);
            alert(`已送出邀請，感謝 ${formData.get('name')}！`);
            contactForm.reset();
        });
    }


});