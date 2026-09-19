// 1. تسجيل الـ Service Worker ونظام إشعارات الهاتف المنبثقة
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker Registered Successfully!', reg))
        .catch(err => console.log('Service Worker Registration Error:', err));
}

const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

function playAudioAlert() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
        console.log('Audio Context error:', e);
    }
}

async function sendNotification(title, options = {}) {
    playAudioAlert();

    // إرسال الإشعار عبر Service Worker ليظهر في أعلى الشاشة وشاشة القفل
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification(title, {
                body: options.body || '',
                icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                vibrate: [200, 100, 200],
                tag: 'enjazk-notification'
            });
        } catch (e) {
            new Notification(title, options);
        }
    } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('المتصفح أو النظام الحالي لا يدعم إشعارات النظام.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            sendNotification('تم تفعيل الإشعارات بنجاح! 🔔', {
                body: 'عد إلينا يا بطل وتابع تقدمك في إنجاز مهامك اليومية!'
            });
            if (enableNotificationsBtn) enableNotificationsBtn.style.display = 'none';
        } else {
            alert('تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح/الهاتف.');
        }
    } catch (err) {
        Notification.requestPermission(function (permission) {
            if (permission === 'granted') {
                sendNotification('تم تفعيل الإشعارات بنجاح! 🔔', {
                    body: 'عد إلينا يا بطل وتابع تقدمك في إنجاز مهامك اليومية!'
                });
                if (enableNotificationsBtn) enableNotificationsBtn.style.display = 'none';
            }
        });
    }
}

if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    if ('Notification' in window && Notification.permission === 'granted') {
        enableNotificationsBtn.style.display = 'none';
    }
}

// تذكير تلقائي ينبثق أعلى الهاتف عند الخروج من التطبيق
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        setTimeout(() => {
            sendNotification('عد إلينا يا بطل! 🚀', {
                body: 'لا تنسَ متابعة تقدمك وإكمال بقية مهامك اليوم.'
            });
        }, 30000); // يرسل الإشعار بعد 30 ثانية من مغادرة التطبيق
    }
});

// 2. التنقل والقائمة الجانبية
const navBtns = document.querySelectorAll('.nav-btn');
const appPages = document.querySelectorAll('.app-page');
const mobileToggle = document.getElementById('mobileNavToggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = btn.getAttribute('data-page');

        navBtns.forEach(b => b.classList.remove('active'));
        appPages.forEach(p => p.classList.remove('active'));

        document.querySelectorAll(`[data-page="${targetPage}"]`).forEach(b => b.classList.add('active'));
        const pageElement = document.getElementById(targetPage);
        if (pageElement) pageElement.classList.add('active');

        if (navMenu) navMenu.classList.remove('active');

        if (targetPage === 'stats-page') {
            renderCharts();
        }
    });
});

// 3. إدارة المهام والملاحظات
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const percentageNumber = document.getElementById('percentageNumber');
const progressText = document.getElementById('progressText');
const quickNotes = document.getElementById('quickNotes');

let tasks = JSON.parse(localStorage.getItem('my_habits')) || [];
if (quickNotes) {
    quickNotes.value = localStorage.getItem('my_quick_notes') || '';
    quickNotes.addEventListener('input', () => {
        localStorage.setItem('my_quick_notes', quickNotes.value);
    });
}

function saveTasks() {
    localStorage.setItem('my_habits', JSON.stringify(tasks));
    updateUI();
}

function updateUI() {
    taskList.innerHTML = '';
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    if (percentageNumber) percentageNumber.textContent = `${percentage}%`;
    if (progressText) progressText.textContent = `${completedTasks} من ${totalTasks} مهام مكتملة اليوم`;
    if (taskCount) taskCount.textContent = totalTasks - completedTasks;

    const statCompletedCount = document.getElementById('statCompletedCount');
    if (statCompletedCount) statCompletedCount.textContent = completedTasks;

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        const span = document.createElement('span');
        span.textContent = task.text;

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-task-btn';
        delBtn.innerHTML = `<span class="material-symbols-rounded">delete</span>`;

        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tasks.splice(index, 1);
            saveTasks();
        });

        li.addEventListener('click', () => {
            tasks[index].completed = !tasks[index].completed;
            
            if (tasks[index].completed) {
                sendNotification('أحسنت! 👏', {
                    body: `أنجزت المهمة: "${task.text}"`
                });
            }
            
            saveTasks();
        });

        li.appendChild(span);
        li.appendChild(delBtn);
        taskList.appendChild(li);
    });
}

if (addBtn) {
    addBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (!text) return alert('يرجى كتابة نص المهمة أولاً');
        tasks.push({ text, completed: false });
        taskInput.value = '';
        saveTasks();
    });
}

// 4. مؤقت بومودورو
let timerInterval;
let totalTime = 25 * 60;
let timeLeft = 25 * 60;

const timerDisplay = document.getElementById('timerDisplay');
const timerProgress = document.getElementById('timerProgress');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const quickPomodoroBtn = document.getElementById('quickPomodoroBtn');

function updateTimer() {
    if (!timerDisplay || !timerProgress) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const fullDash = 283;
    const offset = fullDash - (timeLeft / totalTime) * fullDash;
    timerProgress.style.strokeDashoffset = offset;
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const minutes = parseInt(btn.getAttribute('data-time'));
        totalTime = minutes * 60;
        timeLeft = totalTime;
        clearInterval(timerInterval);
        timerInterval = null;
        updateTimer();
    });
});

function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimer();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            
            sendNotification('انتهت جلسة التركيز! 🎉', {
                body: 'حان وقت الاستراحة أو الانتقال للمهمة التالية.'
            });
        }
    }, 1000);
}

if (startTimerBtn) startTimerBtn.addEventListener('click', startTimer);

if (pauseTimerBtn) {
    pauseTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
    });
}

if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = totalTime;
        updateTimer();
    });
}

if (quickPomodoroBtn) {
    quickPomodoroBtn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        appPages.forEach(p => p.classList.remove('active'));

        const pomodoroNavBtn = document.querySelector('[data-page="pomodoro-page"]');
        const pomodoroPage = document.getElementById('pomodoro-page');

        if (pomodoroNavBtn && pomodoroPage) {
            pomodoroNavBtn.classList.add('active');
            pomodoroPage.classList.add('active');
        }

        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = totalTime;
        updateTimer();
        startTimer();
    });
}

// 5. التحديات اليومية
let challenges = JSON.parse(localStorage.getItem('my_challenges')) || [
    { id: 1, title: 'تحدي 21 يوم قراءة وتركيز', days: [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false] }
];

const challengesContainer = document.getElementById('challengesContainer');
const createChallengeBtn = document.getElementById('createChallengeBtn');
const newChallengeInput = document.getElementById('newChallengeInput');

function saveChallenges() {
    localStorage.setItem('my_challenges', JSON.stringify(challenges));
    renderChallenges();
}

function renderChallenges() {
    if (!challengesContainer) return;
    challengesContainer.innerHTML = '';

    const statActiveChallenges = document.getElementById('statActiveChallenges');
    if (statActiveChallenges) statActiveChallenges.textContent = challenges.length;

    challenges.forEach((ch, chIndex) => {
        const completedDays = ch.days.filter(Boolean).length;
        const progressPercent = Math.round((completedDays / 21) * 100);

        const card = document.createElement('div');
        card.className = 'challenge-card';

        card.innerHTML = `
            <div class="challenge-header">
                <div class="challenge-title-group">
                    <span class="challenge-title">${ch.title}</span>
                    <span style="font-weight:bold; color:#10b981;">(${progressPercent}%)</span>
                </div>
                <button class="delete-challenge-btn" onclick="deleteChallenge(${chIndex})">
                    <span class="material-symbols-rounded">delete</span>
                    حذف
                </button>
            </div>
            <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="days-grid">
                ${ch.days.map((done, dIndex) => `
                    <button class="day-btn ${done ? 'completed' : ''}" onclick="toggleDay(${chIndex},${dIndex})">
                        يوم ${dIndex + 1}
                    </button>
                `).join('')}
            </div>
        `;
        challengesContainer.appendChild(card);
    });
}

window.toggleDay = function(chIndex, dIndex) {
    challenges[chIndex].days[dIndex] = !challenges[chIndex].days[dIndex];
    saveChallenges();
};

window.deleteChallenge = function(chIndex) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا التحدي؟')) {
        challenges.splice(chIndex, 1);
        saveChallenges();
    }
};

if (createChallengeBtn) {
    createChallengeBtn.addEventListener('click', () => {
        const title = newChallengeInput.value.trim();
        if (!title) return alert('أدخل عنوان التحدي');
        challenges.push({
            id: Date.now(),
            title: title,
            days: new Array(21).fill(false)
        });
        newChallengeInput.value = '';
        saveChallenges();
    });
}

// 6. إدارة الملف الشخصي (Profile Management)
const profileDisplayName = document.getElementById('profileDisplayName');
const profileDisplayTitle = document.getElementById('profileDisplayTitle');
const sidebarUserName = document.getElementById('sidebarUserName');
const userNameInput = document.getElementById('userNameInput');
const userTitleInput = document.getElementById('userTitleInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const avatarUpload = document.getElementById('avatarUpload');
const profileAvatar = document.getElementById('profileAvatar');
const sidebarAvatar = document.getElementById('sidebarAvatar');

let userProfile = JSON.parse(localStorage.getItem('my_user_profile')) || {
    name: 'علي المهدي',
    title: 'مطور ومهندس إنتاجية',
    avatar: 'https://ui-avatars.com/api/?name=Ali+Almhdi&background=4f46e5&color=fff'
};

function loadProfile() {
    if (profileDisplayName) profileDisplayName.textContent = userProfile.name;
    if (profileDisplayTitle) profileDisplayTitle.textContent = userProfile.title;
    if (sidebarUserName) sidebarUserName.textContent = userProfile.name;
    if (userNameInput) userNameInput.value = userProfile.name;
    if (userTitleInput) userTitleInput.value = userProfile.title;

    if (userProfile.avatar) {
        if (profileAvatar) profileAvatar.src = userProfile.avatar;
        if (sidebarAvatar) sidebarAvatar.src = userProfile.avatar;
    }
}

if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        userProfile.name = userNameInput.value.trim() || 'علي المهدي';
        userProfile.title = userTitleInput.value.trim() || 'عضو منجز';

        localStorage.setItem('my_user_profile', JSON.stringify(userProfile));
        loadProfile();
        alert('تم حفظ البيانات الشخصية بنجاح! ✨');
    });
}

if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                userProfile.avatar = event.target.result;
                localStorage.setItem('my_user_profile', JSON.stringify(userProfile));
                loadProfile();
            };
            reader.readAsDataURL(file);
        }
    });
}

// 7. الرسوم البيانية الإحصائية
let weeklyChartInstance, statusChartInstance;

function renderCharts() {
    const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');

    if (!weeklyCtx || !statusCtx) return;

    if (weeklyChartInstance) weeklyChartInstance.destroy();
    if (statusChartInstance) statusChartInstance.destroy();

    weeklyChartInstance = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            datasets: [{
                label: 'المهام المنجزة',
                data: [5, 7, 8, 6, 9, 4, 8],
                backgroundColor: '#6366f1',
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;

    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['مكتملة', 'قيد الانتظار'],
            datasets: [{
                data: [completedCount || 1, pendingCount],
                backgroundColor: ['#10b981', '#f59e0b']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// التشغيل الابتدائي
loadProfile();
updateUI();
updateTimer();
renderChallenges();
