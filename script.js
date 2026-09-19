// 1. نظام الإشعارات والتنبيهات الصوتية
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

function playAudioAlert() {
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
}

function sendNotification(title, options) {
    playAudioAlert();
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', () => {
        if (!('Notification' in window)) {
            alert('المتصفح لديك لا يدعم إشعارات النظام.');
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendNotification('تم تفعيل الإشعارات بنجاح! 🔔', {
                    body: 'ستتلقى تنبيهات مباشرة عند اكتمال جلسات البومودورو والمهام.'
                });
                enableNotificationsBtn.style.display = 'none';
            } else {
                alert('تم رفض صلاحية الإشعارات.');
            }
        });
    });

    if ('Notification' in window && Notification.permission === 'granted') {
        enableNotificationsBtn.style.display = 'none';
    }
}

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
        document.getElementById(targetPage).classList.add('active');

        if (navMenu) navMenu.classList.remove('active');

        if (targetPage === 'stats-page') {
            renderCharts();
        }
    });
});

// 3. إدارة المهام والملاحظات (تخزين محلي جديد للعميل)
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const percentageNumber = document.getElementById('percentageNumber');
const progressText = document.getElementById('progressText');
const quickNotes = document.getElementById('quickNotes');

// تبدأ المصفوفة فارغة لكل مستخدم جديد
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

    percentageNumber.textContent = `${percentage}%`;
    progressText.textContent = `${completedTasks} من ${totalTasks} مهام مكتملة اليوم`;
    taskCount.textContent = totalTasks;

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
            const isNowCompleted = !tasks[index].completed;
            tasks[index].completed = isNowCompleted;
            
            if (isNowCompleted) {
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
    if (!timerDisplay) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const fullDash = 283;
    const offset = fullDash - (timeLeft / totalTime) * fullDash;
    if (timerProgress) timerProgress.style.strokeDashoffset = offset;
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

// 5. التحديات اليومية (مفرغة تبدأ فارغة للمستخدم الجديد)
let challenges = JSON.parse(localStorage.getItem('my_challenges')) || [];

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

// 6. إدارة الملف الشخصي (قيم افتراضية عامة للمستخدم الجديد)
const profileForm = document.getElementById('profileForm');
const userNameInput = document.getElementById('userNameInput');
const userTitleInput = document.getElementById('userTitleInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileDisplayTitle = document.getElementById('profileDisplayTitle');
const sidebarUserName = document.getElementById('sidebarUserName');
const avatarUpload = document.getElementById('avatarUpload');
const profileAvatar = document.getElementById('profileAvatar');
const sidebarAvatar = document.getElementById('sidebarAvatar');

let userProfile = JSON.parse(localStorage.getItem('my_user_profile')) || {
    name: 'مستخدم جديد',
    title: 'عضو منجز',
    avatar: 'https://ui-avatars.com/api/?name=User&background=4f46e5&color=fff'
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
        userProfile.name = userNameInput.value.trim() || 'مستخدم جديد';
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
                data: [0, 0, 0, 0, 0, 0, 0],
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
                data: [completedCount, pendingCount],
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
