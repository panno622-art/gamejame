// GLOBAL GAME STATE
let currentStep = 1;
let dangerLevel = 0;
let totalMistakes = 0;
let maxDangerReached = 0;
let timerSeconds = 0;
let timerInterval = null;

// WEB AUDIO SYNTHESIZER
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
    } catch(e){}
}

function playSiren() {
    playBeep(880, 'sawtooth', 0.3);
    setTimeout(() => playBeep(440, 'sawtooth', 0.3), 150);
}

// LOGIN CHECK (PAGE 1) - พร้อมอนิเมชั่นหลอดโหลด 5 วินาที
function checkLogin() {
    const pass = document.getElementById('login-pass')?.value;
    if (pass === '12345') {
        playBeep(600, 'sine', 0.2);
        document.getElementById('login-error')?.classList.add('hidden');

        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden', '-translate-y-full');
            overlay.classList.add('translate-y-0');
        }

        let progress = 0;
        const duration = 5000; 
        const intervalTime = 50; 
        const increment = (intervalTime / duration) * 100;

        const bar = document.getElementById('loading-bar');
        const percentTxt = document.getElementById('loading-percent');
        const statusTxt = document.getElementById('loading-status');

        const statusMessages = [
            "AUTHENTICATING...",
            "DECRYPTING FILES...",
            "LOADING EVIDENCE DATABASE...",
            "INITIALIZING INTERFACE...",
            "READY!"
        ];

        const loadInterval = setInterval(() => {
            progress += increment;
            
            if (statusTxt) {
                if (progress < 25) statusTxt.innerText = statusMessages[0];
                else if (progress < 50) statusTxt.innerText = statusMessages[1];
                else if (progress < 75) statusTxt.innerText = statusMessages[2];
                else if (progress < 95) statusTxt.innerText = statusMessages[3];
                else statusTxt.innerText = statusMessages[4];
            }

            if (progress >= 100) {
                progress = 100;
                clearInterval(loadInterval);
                playBeep(880, 'sine', 0.2);
                setTimeout(() => {
                    window.location.href = 'manual.html';
                }, 400);
            }

            if (bar) bar.style.width = `${progress}%`;
            if (percentTxt) percentTxt.innerText = `${Math.floor(progress)}%`;
        }, intervalTime);

    } else {
        playBeep(200, 'sawtooth', 0.3);
        document.getElementById('login-error')?.classList.remove('hidden');
    }
}

// AUTO INITIALIZE GAME IF ON GAME PAGE (PAGE 3)
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('screen-game')) {
        startTimer();
        loadStep(1);
    }
});

function startTimer() {
    timerInterval = setInterval(() => {
        timerSeconds++;
        const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        const secs = String(timerSeconds % 60).padStart(2, '0');
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

// DANGER ALERT SYSTEM (LEVEL 1-5)
function increaseDanger() {
    dangerLevel++;
    totalMistakes++;
    if (dangerLevel > maxDangerReached) maxDangerReached = dangerLevel;

    playSiren();
    updateDangerUI();

    const container = document.getElementById('puzzle-container');
    if (container) {
        container.classList.add('shake-anim');
        setTimeout(() => container.classList.remove('shake-anim'), 400);
    }

    if (dangerLevel >= 5) {
        triggerBlackout();
    }
}

function updateDangerUI() {
    const txt = document.getElementById('danger-level-txt');
    if (txt) txt.innerText = dangerLevel;
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`danger-${i}`);
        if (!el) continue;
        if (i <= dangerLevel) {
            el.classList.add('danger-active', 'text-white');
            el.classList.remove('text-slate-500');
        } else {
            el.classList.remove('danger-active', 'text-white');
            el.classList.add('text-slate-500');
        }
    }
}

function triggerBlackout() {
    const screen = document.getElementById('blackout-screen');
    if (!screen) return;
    screen.classList.remove('hidden');
    let count = 5;
    const timerEl = document.getElementById('blackout-timer');
    if (timerEl) timerEl.innerText = count;

    const interval = setInterval(() => {
        count--;
        if (timerEl) timerEl.innerText = count;
        if (count <= 0) {
            clearInterval(interval);
            screen.classList.add('hidden');
            dangerLevel = 0;
            updateDangerUI();
            loadStep(1);
        }
    }, 1000);
}


function toggleEvidenceModal() {
    const modal = document.getElementById('evidence-modal');
    const list = document.getElementById('evidence-list');
    if (!modal || !list) return;
    modal.classList.toggle('hidden');

    if (!modal.classList.contains('hidden')) {
        list.innerHTML = '';
        for (let i = 1; i <= currentStep; i++) {
            list.innerHTML += `
                <div class="bg-slate-800 p-3 rounded border border-cyan-500/20">
                    <span class="text-amber-400 font-bold"><i class="fa-solid fa-file-lines mr-1"></i> [Folder_Step0${i}]</span>
                    <p class="text-slate-300 text-xs mt-1">${stepEvidenceData[i] || 'ไม่มีข้อมูล'}</p>
                </div>
            `;
        }
    }
}

// STEPS PUZZLE LOGIC
const stepsData = [
    { num: 1, title: "ตู้ล็อกเกอร์ผู้เสียชีวิต", badge: "KEYPAD PIN", desc: "ใส่รหัส PIN 4 หลักเพื่อเปิดล็อกเกอร์ของวิกเตอร์:", render: () => `<input type="text" id="ans-1" maxlength="4" placeholder="----" class="bg-black border border-cyan-500 text-center text-2xl text-cyan-400 p-3 rounded w-48 mono tracking-widest">`, check: () => document.getElementById('ans-1')?.value.trim() === '1994' },
    { num: 2, title: "ถอดรหัสไฟล์คอมพิวเตอร์", badge: "CAESAR CIPHER", desc: "ถอดรหัสข้อความ 'E B S L' (ถอยหลัง 1 อักขระ):", render: () => `<input type="text" id="ans-2" placeholder="คำตอบ 4 อักขระ" class="bg-black border border-cyan-500 text-center text-xl text-cyan-400 p-3 rounded w-64 mono uppercase">`, check: () => document.getElementById('ans-2')?.value.trim().toUpperCase() === 'FCTM' },
    { num: 3, title: "เรียง Timeline เหตุการณ์", badge: "TIMELINE", desc: "เรียงลำดับเหตุการณ์ 1-4 ตามเวลาที่เกิดขึ้นจริง:", render: () => `<input type="text" id="ans-3" placeholder="1234" maxlength="4" class="bg-black border border-cyan-500 text-center text-2xl text-cyan-400 p-3 rounded w-48 mono">`, check: () => document.getElementById('ans-3')?.value.trim() === '1234' },
    { num: 4, title: "จับคู่หลักฐาน DNA/นิ้วมือ", badge: "MATCHING", desc: "เลือกจับคู่หลักฐาน DNA กับรหัสตัวอย่างที่ถูกต้อง:", render: () => `<select id="ans-4" class="bg-slate-800 border border-cyan-500 text-cyan-300 p-3 rounded w-full max-w-xs mono"><option value="">-- เลือกคู่ --</option><option value="A09">คราบเลือด - DNA #09 / นิ้วมือ #02</option><option value="A01">คราบเลือด - DNA #01 / นิ้วมือ #05</option></select>`, check: () => document.getElementById('ans-4')?.value === 'A09' },
    { num: 5, title: "ถอดข้อความสลับอักษร", badge: "ANAGRAM", desc: "เรียงตัวอักษร 'W O D A H S' ใหม่ให้มีความหมาย:", render: () => `<input type="text" id="ans-5" placeholder="คำตอบ..." class="bg-black border border-cyan-500 text-center text-xl text-cyan-400 p-3 rounded w-64 mono uppercase">`, check: () => document.getElementById('ans-5')?.value.trim().toUpperCase() === 'SHADOW' },
    { num: 6, title: "คำนวณพิกัดกบดาน", badge: "COORDINATES", desc: "ระบุพิกัด (ละติจูด 10x4, ลองจิจูด 100-15) รูปแบบ '40, 85':", render: () => `<input type="text" id="ans-6" placeholder="40, 85" class="bg-black border border-cyan-500 text-center text-xl text-cyan-400 p-3 rounded w-64 mono">`, check: () => { const v = document.getElementById('ans-6')?.value.replace(/\s+/g,''); return v === '40,85' || v === '4085'; } },
    { num: 7, title: "ตัดสายไฟประตูห้องแล็บ", badge: "WIRING LOCK", desc: "เลือกตัดสายไฟที่ถูกต้อง (ห้ามตัดสายสีแดง):", render: () => `<div class="flex space-x-4"><button onclick="selectWire('red')" id="w-red" class="p-3 bg-red-900 border border-red-500 text-white rounded font-bold text-xs">สายสีแดง</button><button onclick="selectWire('green')" id="w-green" class="p-3 bg-emerald-900 border border-emerald-500 text-white rounded font-bold text-xs">สายสีเขียว</button><button onclick="selectWire('blue')" id="w-blue" class="p-3 bg-blue-900 border border-blue-500 text-white rounded font-bold text-xs">สายสีน้ำเงิน</button></div><input type="hidden" id="ans-7">`, check: () => document.getElementById('ans-7')?.value === 'green' },
    { num: 8, title: "สอบสวนจับโกหก", badge: "LIE DETECTOR", desc: "อเล็กซ์อ้างว่าอยู่ร้านอาหาร 21:30 น. แต่ร้านปิด 20:00 น.:", render: () => `<select id="ans-8" class="bg-slate-800 border border-cyan-500 text-cyan-300 p-3 rounded w-full max-w-md text-xs mono"><option value="">-- เลือกข้อสรุป --</option><option value="lie">จับโกหก: ใบเสร็จปลอม เพราะร้านปิดตั้งแต่ 20:00 น.</option><option value="truth">เชื่อคำให้การ</option></select>`, check: () => document.getElementById('ans-8')?.value === 'lie' },
    { num: 9, title: "ปลดชนวน Wiper Bomb", badge: "MASTER KEY", desc: "ใส่ Master Key (ผลรวม Step 1: 1994 + Step 6: 4085):", render: () => `<input type="text" id="ans-9" placeholder="ผลรวมตัวเลข" class="bg-black border border-cyan-500 text-center text-2xl text-cyan-400 p-3 rounded w-48 mono">`, check: () => document.getElementById('ans-9')?.value.trim() === '6079' },
    { num: 10, title: "ชี้ตัวผู้บงการตัวจริง", badge: "FINALE", desc: "ใครคือผู้อยู่เบื้องหลังคดีตัวจริง?", render: () => `<select id="ans-10" class="bg-slate-800 border border-cyan-500 text-cyan-300 p-3 rounded w-full max-w-xs mono"><option value="">-- เลือกผู้ต้องสงสัย --</option><option value="alex">อเล็กซ์ (มือขวา)</option><option value="boss">บอสใหญ่ "เงา" (The Shadow)</option><option value="guard">รปภ.</option></select>`, check: () => document.getElementById('ans-10')?.value === 'boss' }
];

function selectWire(color) {
    const input7 = document.getElementById('ans-7');
    if (input7) input7.value = color;
    ['red', 'green', 'blue'].forEach(c => {
        const btn = document.getElementById(`w-${c}`);
        if (!btn) return;
        if (c === color) btn.classList.add('ring-2', 'ring-cyan-400');
        else btn.classList.remove('ring-2', 'ring-cyan-400');
    });
}

function loadStep(stepNum) {
    currentStep = stepNum;
    const data = stepsData[stepNum - 1];
    if (!data) return;

    const stepNumEl = document.getElementById('current-step-num');
    const stepTitleEl = document.getElementById('step-title');
    const puzzleHeadingEl = document.getElementById('puzzle-heading');
    const puzzleBadgeEl = document.getElementById('puzzle-badge');
    const puzzleDescEl = document.getElementById('puzzle-desc');
    const puzzleInteractiveEl = document.getElementById('puzzle-interactive');

    if (stepNumEl) stepNumEl.innerText = data.num;
    if (stepTitleEl) stepTitleEl.innerText = data.title;
    if (puzzleHeadingEl) puzzleHeadingEl.innerText = `${data.num}. ${data.title}`;
    if (puzzleBadgeEl) puzzleBadgeEl.innerText = data.badge;
    if (puzzleDescEl) puzzleDescEl.innerText = data.desc;
    if (puzzleInteractiveEl) puzzleInteractiveEl.innerHTML = data.render();

    if (stepNum > 2 && Math.random() > 0.5) {
        const layer = document.getElementById('disruption-layer');
        if (layer) {
            layer.classList.remove('hidden');
            setTimeout(() => layer.classList.add('hidden'), 800);
        }
    }
}

function submitAnswer() {
    const data = stepsData[currentStep - 1];
    if (!data) return;
    
    if (data.check()) {
        playBeep(880, 'sine', 0.15);
        if (currentStep < 10) {
            loadStep(currentStep + 1);
        } else {
            finishGame();
        }
    } else {
        increaseDanger();
    }
}

function finishGame() {
    clearInterval(timerInterval);
    const victoryScreen = document.getElementById('screen-victory');
    if (victoryScreen) victoryScreen.classList.remove('hidden');

    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    
    const timeEl = document.getElementById('stat-time');
    const mistakesEl = document.getElementById('stat-mistakes');
    const dangerEl = document.getElementById('stat-danger');
    const rankEl = document.getElementById('stat-rank');

    if (timeEl) timeEl.innerText = `${mins}:${secs}`;
    if (mistakesEl) mistakesEl.innerText = `${totalMistakes} ครั้ง`;
    if (dangerEl) dangerEl.innerText = `Level ${maxDangerReached}`;

    let rank = "MASTER DETECTIVE";
    if (totalMistakes > 5) rank = "SENIOR INVESTIGATOR";
    if (totalMistakes > 8) rank = "JUNIOR AGENT";
    if (rankEl) rankEl.innerText = rank;
}

// EVIDENCE FOLDER EXPLORER (ดีไซน์ตารางโฟลเดอร์แบบ Windows)
const stepEvidenceData = {
    1: { title: "Step_01_Locker.folder", desc: "คำใบ้ล็อกเกอร์: องค์กรก่อตั้งปี 1990 และมีสมาชิกก่อตั้ง 4 คน (นำมารวมกันเป็น PIN 4 หลัก)" },
    2: { title: "Step_02_Cyber_File.folder", desc: "ข้อความเข้ารหัสถอยหลัง 1 อักขระ: E->F, B->C, S->T, L->M" },
    3: { title: "Step_03_CCTV_Log.folder", desc: "บันทึกเวลา: 1.ไฟดับ -> 2.ชายหมวกเดินเข้า -> 3.เสียงกระจกแตก -> 4.รถขับออก" },
    4: { title: "Step_04_DNA_Match.folder", desc: "ตัวอย่าง DNA #09 ตรงกับคราบเลือด, รอยนิ้วมือ #02 ตรงกับแก้วน้ำ" },
    5: { title: "Step_05_Threat_Note.folder", desc: "Anagram: เรียงอักษร W-O-D-A-H-S ใหม่ได้เป็นคำว่า SHADOW" },
    6: { title: "Step_06_Coordinates.folder", desc: "พิกัด: ละติจูด 10x4 = 40, ลองจิจูด 100-15 = 85 (ใส่ 40, 85)" },
    7: { title: "Step_07_Lab_Wiring.folder", desc: "การตัดสายไฟ: ห้ามตัดสายสีแดง สาย Ground ที่ถูกต้องคือสีเขียว" },
    8: { title: "Step_08_Interrogate.folder", desc: "คำให้การอเล็กซ์: อ้างว่าอยู่ร้านอาหาร 21:30 น. แต่ร้านปิด 20:00 น. (จับโกหก)" },
    9: { title: "Step_09_Wiper_Bomb.folder", desc: "Master Key: นำตัวเลข Step 1 (1994) + Step 6 (4085) = 6079" },
    10: { title: "Step_10_Mastermind.folder", desc: "บอสใหญ่ 'เงา' คือผู้อยู่เบื้องหลังคดีจากการจับคู่ DNA ใน Step 4" }
};

function toggleEvidenceModal() {
    const modal = document.getElementById('evidence-modal');
    const grid = document.getElementById('evidence-folder-grid');
    if (!modal || !grid) return;
    
    modal.classList.toggle('hidden');

    if (!modal.classList.contains('hidden')) {
        grid.innerHTML = '';
        // สร้างโฟลเดอร์เรียงตามด่าน 1 ถึง 10 (เปิดให้ดูเนื้อหาทั้งหมดตามที่คุณต้องการ)
        for (let i = 1; i <= 10; i++) {
            const data = stepEvidenceData[i];
            const isLocked = i > currentStep; // ถ้ายังไม่ถึงด่านนั้น อาจจะทำเป็นจางๆ หรือเปิดให้ดูได้เลยตามใจชอบ
            
            grid.innerHTML += `
                <div onclick="openFile(${i})" class="folder-item flex flex-col items-center justify-center p-4 rounded-lg border border-transparent bg-slate-900/40 text-center select-none group">
                    <div class="text-amber-400 text-5xl mb-2 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                        <i class="fa-solid fa-folder"></i>
                    </div>
                    <span class="text-xs text-cyan-300 font-mono tracking-wider truncate w-full group-hover:text-cyan-200">
                        Case_0${i < 10 ? '0' + i : i}
                    </span>
                    <span class="text-[10px] text-slate-400 truncate w-full mt-0.5">
                        Step ${i} ${isLocked ? '(Locked)' : ''}
                    </span>
                </div>
            `;
        }
    }
}

function openFile(stepNum) {
    playBeep(700, 'sine', 0.1);
    const viewer = document.getElementById('file-viewer-modal');
    const titleEl = document.getElementById('viewer-title');
    const contentEl = document.getElementById('viewer-content');
    
    if (!viewer || !titleEl || !contentEl) return;

    const data = stepEvidenceData[stepNum];
    titleEl.innerHTML = `<i class="fa-solid fa-file-lines mr-2 text-amber-400"></i> ${data.title}`;
    contentEl.innerText = data.desc;
    
    viewer.classList.remove('hidden');
}

function closeFileViewer() {
    playBeep(400, 'sine', 0.1);
    const viewer = document.getElementById('file-viewer-modal');
    if (viewer) viewer.classList.add('hidden');
}