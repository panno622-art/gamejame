/* ==========================================================================
   THE SHADOW FILE - SYSTEM CORE JAVASCRIPT (script.js) - FINAL COMPLETE VERSION
   ========================================================================== */

let windowCount = 0;
let timerSeconds = 0;
let activeWindows = {};

// --- สถานะเหตุการณ์สุ่ม (Hazards State) ---
window.hazardState = {
    virus: false,
    staticNoise: false,
    staticTimer: 0,
    staticInterval: null,
    hacking: false,
    hackedIcons: []
};

// ดัชนีไอคอนที่สามารถถูกแฮกซ่อนได้ (เว้นแฟ้มเอกสารหลัก index 1 ไว้)
const HACKABLE_ICON_INDEXES = [2, 3, 4, 5, 6]; 

// --- ระบบเสียง Beep เอฟเฟกต์ไซเบอร์ ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq = 440, type = 'sine', duration = 0.1) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// --- ฟังก์ชันนำทางระหว่างหน้าเว็บ (Navigation Flow) ---
function startGame() {
    playBeep(700, 'sine', 0.1);
    setTimeout(() => {
        window.location.href = 'manual.html';
    }, 200);
}

function goToProfileDev() {
    playBeep(600, 'sine', 0.1);
    setTimeout(() => {
        window.location.href = 'profile-dev.html';
    }, 200);
}

function goBackToLogin() {
    playBeep(400, 'sine', 0.1);
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 200);
}

// --- เริ่มต้นระบบเมื่อโหลดหน้า DOM เสร็จสมบูรณ์ ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. ตัวนับเวลาในหน้าเกมเดสก์ท็อป
    if (document.getElementById('os-timer')) {
        setInterval(() => {
            timerSeconds++;
            const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
            const secs = String(timerSeconds % 60).padStart(2, '0');
            const timerEl = document.getElementById('os-timer');
            if (timerEl) timerEl.innerText = `${mins}:${secs}`;
        }, 1000);
    }

    // 2. ผูกระบบคลิกลากย้ายไอคอนบนเดสก์ท็อป
    initDesktopIconsDrag();

    // 3. เริ่มระบบสุ่มเกิดเหตุการณ์ (เมื่ออยู่ในหน้าเกม)
    if (document.getElementById('desktop-area')) {
        initHazardSystem();
    }
});

// --- ระบบสุ่มเกิดเหตุการณ์ (Hazard Manager - ทุก 150 วินาที) ---
function initHazardSystem() {
    let noiseOverlay = document.createElement('div');
    noiseOverlay.id = 'static-overlay';
    noiseOverlay.className = 'static-noise-overlay';
    document.body.appendChild(noiseOverlay);

    const hazardIntervalTime = 150 * 1000; // ทุกๆ 150 วินาที (2 นาที 30 วินาที)

    setInterval(() => {
        triggerRandomHazard();
    }, hazardIntervalTime);
}

function triggerRandomHazard() {
    const hazards = ['virus', 'staticNoise', 'hacking'];
    const chosen = hazards[Math.floor(Math.random() * hazards.length)];

    console.warn(`⚠️ [HAZARD EVENT] กำลังสุ่มเกิดเหตุการณ์:`, chosen);

    if (chosen === 'virus' && !window.hazardState.virus) {
        window.hazardState.virus = true;
        playBeep(200, 'sawtooth', 0.4);
        showHazardNotification("⚠️ VIRUS ALERT: ระบบติดเชื้อไวรัส! โปรแกรมทำงานผิดปกติ");
    } 
    else if (chosen === 'staticNoise' && !window.hazardState.staticNoise) {
        window.hazardState.staticNoise = true;
        window.hazardState.staticTimer = 0;
        const overlay = document.getElementById('static-overlay');

        showHazardNotification("📺 STATIC ALERT: ตรวจพบสัญญาณรบกวนหน้าจอ (จอซ่า) รีบไปซ่อมด่วน!");

        window.hazardState.staticInterval = setInterval(() => {
            window.hazardState.staticTimer++;
            if (overlay) {
                let opacity = Math.min(1, window.hazardState.staticTimer / 12);
                overlay.style.opacity = opacity;
            }
            
            if (window.hazardState.staticTimer >= 15) {
                clearInterval(window.hazardState.staticInterval);
                gameOver("SYSTEM CRASH: จอดับเนื่องจากสัญญาณรบกวนรุนแรงเกินขีดจำกัด");
            }
        }, 1000);
    } 
    else if (chosen === 'hacking' && !window.hazardState.hacking) {
        window.hazardState.hacking = true;
        executeHackingEffect();
        showHazardNotification("💻 HACKING ALERT: แฮกเกอร์กำลังโจมตี! ไอคอนเดสก์ท็อปบางส่วนถูกซ่อน");
    }
}

function executeHackingEffect() {
    const icons = Array.from(document.querySelectorAll('.desktop-icon'));
    window.hazardState.hackedIcons = [];

    HACKABLE_ICON_INDEXES.forEach(idx => {
        if (icons[idx]) {
            const isEvidenceFolder = icons[idx].getAttribute('data-title') === 'แฟ้มเอกสารหลัก' || 
                                     icons[idx].innerText.includes('แฟ้มเอกสาร');
            if (!isEvidenceFolder) {
                icons[idx].style.display = 'none';
                window.hazardState.hackedIcons.push(icons[idx]);
            }
        }
    });
    playBeep(300, 'square', 0.3);
}

// 🔔 ฟังก์ชันแสดงแจ้งเตือนตรงกลางหน้าจอ
function showHazardNotification(message) {
    let notif = document.getElementById('hazard-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'hazard-notification';
        notif.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[99999] bg-slate-950/95 border-2 border-red-500 text-red-200 px-6 py-4 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.6)] text-center font-mono transition-all duration-500 opacity-0 pointer-events-none';
        document.body.appendChild(notif);
    }

    notif.innerHTML = `
        <div class="text-sm font-bold text-red-400 mb-1 tracking-wider"><i class="fa-solid fa-triangle-exclamation mr-2"></i>CRITICAL WARNING</div>
        <div class="text-xs text-white leading-relaxed">${message}</div>
    `;

    setTimeout(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translate(-50%, -50%) scale(1.05)';
    }, 10);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 5000);
}

// 🛠️ ฟังก์ชันซ่อมแซมระบบ
window.repairHazard = function(type) {
    if (type === 'virus') {
        window.hazardState.virus = false;
        playBeep(800, 'sine', 0.2);
    } else if (type === 'static') {
        window.hazardState.staticNoise = false;
        if (window.hazardState.staticInterval) {
            clearInterval(window.hazardState.staticInterval);
            window.hazardState.staticInterval = null;
        }
        window.hazardState.staticTimer = 0;
        const overlay = document.getElementById('static-overlay');
        if (overlay) overlay.style.opacity = '0';
        playBeep(800, 'sine', 0.2);
    } else if (type === 'hacking') {
        window.hazardState.hacking = false;
        if (window.hazardState.hackedIcons && window.hazardState.hackedIcons.length > 0) {
            window.hazardState.hackedIcons.forEach(icon => {
                if (icon) icon.style.display = 'flex';
            });
            window.hazardState.hackedIcons = [];
        }
        const allIcons = document.querySelectorAll('.desktop-icon');
        allIcons.forEach(icon => {
            icon.style.display = 'flex';
        });
        playBeep(800, 'sine', 0.2);
    }
};

// 🔄 ตัวตรวจสอบคำสั่งซ่อมแซมจากหน้าศูนย์ซ่อม (localStorage Bridge)
let lastProcessedRepairTime = 0;
setInterval(() => {
    const repairData = localStorage.getItem('repair_action');
    if (repairData) {
        try {
            const parsed = JSON.parse(repairData);
            if (parsed && parsed.time && parsed.time !== lastProcessedRepairTime) {
                lastProcessedRepairTime = parsed.time;
                window.repairHazard(parsed.type);
            }
        } catch(e) {}
    }
}, 300);

function gameOver(reason) {
    const blackout = document.createElement('div');
    blackout.className = 'screen-blackout';
    blackout.innerHTML = `
        <h1 class="text-4xl font-bold mb-4">SYSTEM FAILURE</h1>
        <p class="text-sm text-slate-300 mb-6">${reason}</p>
        <button onclick="window.location.reload()" class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded cursor-pointer">
            RESTART SYSTEM
        </button>
    `;
    document.body.appendChild(blackout);
}

// --- ระบบคลิกลากย้ายตำแหน่งไอคอนเดสก์ท็อป ---
function initDesktopIconsDrag() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        let isDragging = false, hasMoved = false;
        let startX, startY, initialX, initialY;

        icon.onmousedown = (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX; startY = e.clientY;
            initialX = icon.offsetLeft; initialY = icon.offsetTop;
            icon.style.zIndex = 1000;

            document.onmousemove = (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX, dy = e.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
                icon.style.left = `${initialX + dx}px`;
                icon.style.top = `${initialY + dy}px`;
                icon.style.right = 'auto';
            };

            document.onmouseup = () => {
                isDragging = false;
                document.onmousemove = null; document.onmouseup = null;
                icon.style.zIndex = '1';
            };
        };

        icon.onclick = () => {
            if (!hasMoved) {
                const action = icon.getAttribute('data-action');
                const title = icon.getAttribute('data-title') || '';
                let targetType = action;

                // เงื่อนไขไวรัส: ทำงานผิดปกติ
                if (window.hazardState.virus) {
                    const isEvidenceFolder = (action === 'explorer' && (title.includes('แฟ้มเอกสาร') || icon.innerText.includes('แฟ้มเอกสาร'))) || title.includes('แฟ้ม');

                    if (!isEvidenceFolder) {
                        const randomTypes = ['thisPC', 'browser', 'fileViewer'];
                        targetType = randomTypes[Math.floor(Math.random() * randomTypes.length)];
                    }
                }

                if (targetType === 'thisPC') openWindow('thisPC');
                else if (targetType === 'explorer') openWindow('explorer', { path: icon.getAttribute('data-path'), title: icon.getAttribute('data-title') });
                else if (targetType === 'pornhip') openWindow('pornhip');
                else if (targetType === 'urias') openWindow('urias');
                else if (targetType === 'jing') openWindow('jing');
                else if (targetType === 'project') openWindow('project');
                else if (targetType === 'folder5') openWindow('folder5');
                else if (targetType === 'fileViewer') openWindow('fileViewer', { title: icon.getAttribute('data-title'), content: icon.getAttribute('data-content') });
                else if (targetType === 'browser') openWindow('browser');
            }
        };
    });
}

// --- ระบบเปิดและจัดการหน้าต่างโปรแกรมจำลอง (Window Manager) ---
function openWindow(type, data = {}) {
    const winKey = type === 'fileViewer' || type === 'explorer' ? `${type}-${data.title || data.path}` : type;

    if (activeWindows[winKey]) {
        const existingWin = document.getElementById(activeWindows[winKey]);
        if (existingWin) {
            existingWin.style.display = 'flex';
            existingWin.style.zIndex = ++windowCount;
            return;
        }
    }

    playBeep(700, 'sine', 0.08);
    windowCount++;
    const container = document.getElementById('window-container');
    const template = document.getElementById('window-template');
    if (!container || !template) return;

    const clone = template.content.cloneNode(true);
    const win = clone.querySelector('.os-window');
    const titleText = clone.querySelector('.title-text');
    const addressBar = clone.querySelector('.address-bar');
    const body = clone.querySelector('.window-body');

    const winId = `win-${windowCount}`;
    win.id = winId;
    activeWindows[winKey] = winId;

    const offset = (windowCount % 5) * 25;
    win.style.top = `${50 + offset}px`;
    win.style.left = `${80 + offset}px`;

    if (type === 'thisPC') {
        const initialTab = data.tab || 'home';
        titleText.innerText = "This PC Explorer";
        addressBar.innerText = `This PC\\${initialTab.toUpperCase()}`;

        body.innerHTML = `
            <div class="w-44 bg-slate-900/80 border-r border-slate-800 p-2.5 space-y-1 text-xs select-none">
                <div onclick="switchPCTab(this, 'home')" class="nav-tab p-2 rounded cursor-pointer transition-colors flex items-center ${initialTab === 'home' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                    <i class="fa-solid fa-house mr-2.5 text-cyan-400"></i>Home
                </div>
                <div onclick="switchPCTab(this, 'gallery')" class="nav-tab p-2 rounded cursor-pointer transition-colors flex items-center ${initialTab === 'gallery' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                    <i class="fa-solid fa-images mr-2.5 text-amber-400"></i>Gallery
                </div>
                <div onclick="switchPCTab(this, 'downloads')" class="nav-tab p-2 rounded cursor-pointer transition-colors flex items-center ${initialTab === 'downloads' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                    <i class="fa-solid fa-download mr-2.5 text-emerald-400"></i>Downloads
                </div>
                <div onclick="switchPCTab(this, 'video')" class="nav-tab p-2 rounded cursor-pointer transition-colors flex items-center ${initialTab === 'video' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                    <i class="fa-solid fa-video mr-2.5 text-purple-400"></i>Video
                </div>
                <div onclick="switchPCTab(this, 'drives')" class="nav-tab p-2 rounded cursor-pointer transition-colors flex items-center ${initialTab === 'drives' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                    <i class="fa-solid fa-computer mr-2.5 text-cyan-400"></i>This PC
                </div>
            </div>
            <div id="pc-content-area" class="flex-1 p-5 overflow-y-auto">
                ${getPCTabContent(initialTab)}
            </div>
        `;
    } else if (type === 'explorer') {
        const title = data.title || `Folder: ${data.path}`;
        titleText.innerText = title;
        addressBar.innerText = `C:\\ShadowOS\\${data.path || 'Documents'}`;
        body.innerHTML = `
            <iframe src="evidence.html" class="w-full h-full border-none bg-transparent"></iframe>
        `;
    } else if (type === 'pornhip') {
        titleText.innerText = "Pornhip - AI Dating Simulator";
        addressBar.innerText = "https://www.pornhip-dating.net/match";
        body.innerHTML = `<iframe src="pornhip.html" class="w-full h-full border-none bg-transparent"></iframe>`;
    } else if (type === 'urias') {
        titleText.innerText = "U-rias Secure Gateway";
        addressBar.innerText = "https://www.urias-secure.net/terminal";
        body.innerHTML = `<iframe src="urias.html" class="w-full h-full border-none bg-transparent"></iframe>`;
    } else if (type === 'jing') {
        titleText.innerText = "Jing News Portal";
        addressBar.innerText = "https://www.jing-news.net/feed";
        body.innerHTML = `<iframe src="jing.html" class="w-full h-full border-none bg-transparent"></iframe>`;
    } else if (type === 'project') {
        titleText.innerText = "Project Documentation";
        addressBar.innerText = "C:\\ShadowOS\\Project";
        body.innerHTML = `<iframe src="project.html" class="w-full h-full border-none bg-transparent"></iframe>`;
    } else if (type === 'folder5') {
        titleText.innerText = "Final Accusation - สรุปคดี";
        addressBar.innerText = "C:\\ShadowOS\\Final_Accusation";
        body.innerHTML = `<iframe src="folder5.html" class="w-full h-full border-none bg-transparent"></iframe>`;
    } else if (type === 'fileViewer') {
        titleText.innerText = data.title || "Document Viewer";
        addressBar.innerText = `C:\\ShadowOS\\Files\\${data.title}`;
        body.innerHTML = `
            <div class="flex-1 p-6">
                <div class="bg-black/60 p-5 rounded-lg border border-cyan-500/20 leading-relaxed text-xs text-slate-200 whitespace-pre-line font-mono shadow-inner">
                    ${data.content || "ไม่มีเนื้อหาในเอกสารนี้"}
                </div>
            </div>
        `;
    } else if (type === 'browser') {
        titleText.innerText = "U-rias Browser";
        addressBar.innerText = "https://www.shadow-secure.net/investigation-portal";
        body.innerHTML = `
            <div class="flex-1 p-6 space-y-4">
                <div class="bg-black/80 p-3.5 rounded-lg flex items-center space-x-3 border border-cyan-500/30">
                    <i class="fa-solid fa-globe text-blue-400 text-xl"></i>
                    <div>
                        <p class="text-xs font-bold text-cyan-300">U-rias Secure Search Engine</p>
                        <p class="text-[10px] text-slate-400">ระบบสืบค้นข้อมูลอินทราเน็ตองค์กร</p>
                    </div>
                </div>
            </div>
        `;
    }

    container.appendChild(clone);
    makeWindowDraggable(win);

    win.onmousedown = () => {
        win.style.zIndex = ++windowCount;
    };
}

function switchPCTab(tabEl, tabName) {
    playBeep(600, 'sine', 0.05);
    const navTabs = tabEl.parentElement.querySelectorAll('.nav-tab');
    navTabs.forEach(t => {
        t.className = "nav-tab p-2 rounded cursor-pointer transition-colors flex items-center text-slate-400 hover:bg-slate-800 hover:text-white";
    });
    tabEl.className = "nav-tab p-2 rounded cursor-pointer transition-colors flex items-center bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30";

    const contentArea = document.getElementById('pc-content-area');
    if (contentArea) {
        contentArea.innerHTML = getPCTabContent(tabName);
    }
}

function getPCTabContent(tabName) {
    switch (tabName) {
        case 'home':
            return `
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-cyan-300 tracking-wider uppercase border-b border-slate-800 pb-2">Home Directory</h3>
                    <div class="grid grid-cols-3 gap-6">
                        <div onclick="switchPCTabByBtn('downloads')" class="flex flex-col items-center p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer group transition-all">
                            <i class="fa-solid fa-folder text-amber-400 text-5xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="text-xs font-mono text-slate-200">Downloads</span>
                        </div>
                        <div onclick="switchPCTabByBtn('video')" class="flex flex-col items-center p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer group transition-all">
                            <i class="fa-solid fa-folder text-amber-400 text-5xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="text-xs font-mono text-slate-200">Video</span>
                        </div>
                        <div onclick="switchPCTabByBtn('drives')" class="flex flex-col items-center p-4 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer group transition-all">
                            <i class="fa-solid fa-folder text-amber-400 text-5xl mb-2 group-hover:scale-110 transition-transform"></i>
                            <span class="text-xs font-mono text-slate-200">This PC</span>
                        </div>
                    </div>
                </div>
            `;
        case 'gallery':
            return `<iframe src="gallery.html" class="w-full h-full border-none bg-transparent"></iframe>`;
        case 'downloads':
            return `<iframe src="downloads.html" class="w-full h-full border-none bg-transparent"></iframe>`;
        case 'video':
            return `<iframe src="video.html" class="w-full h-full border-none bg-transparent"></iframe>`;
        case 'drives':
        default:
            return `
                <div class="space-y-4">
                    <h3 class="text-xs font-bold text-cyan-300 tracking-wider uppercase border-b border-slate-800 pb-2">System Drives</h3>
                    <div class="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-center space-x-3">
                        <i class="fa-solid fa-hard-drive text-cyan-400 text-2xl"></i>
                        <div class="flex-1">
                            <p class="text-xs text-white font-mono">Local Disk (C:)</p>
                            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div class="bg-cyan-500 h-full w-[65%]"></div>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-1">ใช้ไป 32.5 GB จาก 50.0 GB</p>
                        </div>
                    </div>
                </div>
            `;
    }
}

function switchPCTabByBtn(tabName) {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabMap = { 'home': 0, 'gallery': 1, 'downloads': 2, 'video': 3, 'drives': 4 };
    if (tabs[tabMap[tabName]]) {
        switchPCTab(tabs[tabMap[tabName]], tabName);
    }
}

// --- ฟังก์ชันเปิดหน้าต่างแสดงรูปภาพ (Gallery Lightbox) ---
function openImageViewer(imgUrl, title) {
    playBeep(700, 'sine', 0.05);
    openWindow('fileViewer', {
        title: title || 'Image Viewer',
        content: `<div class="flex flex-col items-center justify-center h-full space-y-3 p-2">
                    <img src="${imgUrl}" class="max-h-[350px] rounded border border-cyan-500/40 shadow-lg object-contain" alt="Evidence">
                    <p class="text-[11px] text-cyan-300 font-mono">${title}</p>
                  </div>`
    });
}

// --- ฟังก์ชันเปิดหน้าต่างเล่นวิดีโอ (Video Player) ---
function openVideoPlayer(videoUrl, title) {
    playBeep(700, 'sine', 0.05);
    openWindow('fileViewer', {
        title: title || 'Video Player',
        content: `<div class="flex flex-col items-center justify-center h-full space-y-3 p-2">
                    <video controls class="w-full max-h-[340px] rounded border border-purple-500/40 bg-black shadow-lg">
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <p class="text-[11px] text-purple-300 font-mono"><i class="fa-solid fa-film mr-1"></i> ${title}</p>
                  </div>`
    });
}

function makeWindowDraggable(win) {
    const header = win.querySelector('.window-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
        win.style.zIndex = ++windowCount;

        document.onmousemove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = `${initialLeft + dx}px`;
            win.style.top = `${initialTop + dy}px`;
        };

        document.onmouseup = () => {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}

function closeWindow(btn) {
    const win = btn.closest('.os-window');
    if (!win) return;
    for (let key in activeWindows) {
        if (activeWindows[key] === win.id) {
            delete activeWindows[key];
            break;
        }
    }
    win.remove();
}

function minimizeWindow(btn) {
    const win = btn.closest('.os-window');
    if (win) win.style.display = 'none';
}

function maximizeWindow(btn) {
    const win = btn.closest('.os-window');
    if (!win) return;
    if (win.dataset.maximized === 'true') {
        win.style.top = '50px';
        win.style.left = '80px';
        win.style.width = '1000px';
        win.style.height = '580px';
        win.dataset.maximized = 'false';
    } else {
        win.style.top = '0px';
        win.style.left = '0px';
        win.style.width = '100vw';
        win.style.height = '100vh';
        win.dataset.maximized = 'true';
    }
}