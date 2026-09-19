// 1. تسجيل الـ Service Worker والإشعارات
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker Registered!', reg))
        .catch(err => console.log('Service Worker Error:', err));
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
    } catch (e) {}
}

async function sendNotification(title, options = {}) {
    playAudioAlert();
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification(title, {
                body: options.body || '',
                icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                vibrate: [200, 100, 200]
            });
        } catch (e) { new Notification(title, options); }
    } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) return alert('المتصفح لا يدعم الإشعارات');
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
            sendNotification('تم تفعيل الإشعارات بنجاح! 🔔', { body: 'سنساعدك على تتبع إنجازاتك اليومية' });
            enableNotificationsBtn.style.display = 'none';
        }
    });
    if ('Notification' in window && Notification.permission === 'granted') {
        enableNotificationsBtn.style.display = 'none';
    }
}

// 2. إدارة الثيم (المظهر الداكن والفاتح)
const themeToggleBtn = document.getElementById('themeToggleBtn');
const mobileThemeToggle = document.getElementById('mobileThemeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

function setTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        if (themeText) themeText.textContent = 'الوضع الفاتح';
        localStorage.setItem('theme_preference', 'dark');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        if (themeText) themeText.textContent = 'الوضع المظلم';
        localStorage.setItem('theme_preference', 'light');
    }
    renderCharts();
}

const savedTheme = localStorage.getItem('theme_preference') || 'dark';
setTheme(savedTheme === 'dark');

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        setTheme(!isDark);
    });
}
if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        setTheme(!isDark);
    });
}

// 3. التنقل والقائمة الجانبية
const navBtns = document.querySelectorAll('.nav-btn');
const appPages = document.querySelectorAll('.app-page');
const mobileToggle = document.getElementById('mobileNavToggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
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

        if (targetPage === 'stats-page') renderCharts();
    });
});

// 4. إدارة التواريخ والمهام اليومية
function getFormattedDate(dateObj) {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let selectedDate = getFormattedDate(new Date());

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const percentageNumber = document.getElementById('percentageNumber');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');

const prevDayBtn = document.getElementById('prevDayBtn');
const nextDayBtn = document.getElementById('nextDayBtn');
const todayBtn = document.getElementById('todayBtn');
const currentSelectedDateText = document.getElementById('currentSelectedDateText');
const hiddenDatePicker = document.getElementById('hiddenDatePicker');
const datePickerTrigger = document.getElementById('datePickerTrigger');

let allTasksByDate = JSON.parse(localStorage.getItem('my_habits_by_date')) || {};

function saveTasks() {
    localStorage.setItem('my_habits_by_date', JSON.stringify(allTasksByDate));
    updateUI();
}

function changeDate(daysOffset) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + daysOffset);
    selectedDate = getFormattedDate(current);
    updateUI();
}

function updateUI() {
    const todayStr = getFormattedDate(new Date());
    if (selectedDate === todayStr) {
        currentSelectedDateText.textContent = `اليوم (${selectedDate})`;
    } else {
        currentSelectedDateText.textContent = selectedDate;
    }

    if (hiddenDatePicker) hiddenDatePicker.value = selectedDate;

    const tasks = allTasksByDate[selectedDate] || [];
    taskList.innerHTML = '';
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    if (percentageNumber) percentageNumber.textContent = `${percentage}%`;
    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${completedTasks} من ${totalTasks} مهام مكتملة في هذا اليوم`;

    const statCompletedCount = document.getElementById('statCompletedCount');
    if (statCompletedCount) statCompletedCount.textContent = completedTasks;

    if (tasks.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.style.justifyContent = 'center';
        emptyLi.style.color = 'var(--text-muted)';
        emptyLi.textContent = 'لا توجد مهام مسجلة لهذا التاريخ.';
        taskList.appendChild(emptyLi);
    } else {
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            const span = document.createElement('span');
            span.textContent = task.text;

            const delBtn = document.createElement('button');
            delBtn.className = 'icon-btn delete-btn';
            delBtn.innerHTML = `<span class="material-symbols-rounded">delete</span>`;

            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                allTasksByDate[selectedDate].splice(index, 1);
                if (allTasksByDate[selectedDate].length === 0) delete allTasksByDate[selectedDate];
                saveTasks();
            });

            li.addEventListener('click', () => {
                allTasksByDate[selectedDate][index].completed = !allTasksByDate[selectedDate][index].completed;
                saveTasks();
            });

            li.appendChild(span);
            li.appendChild(delBtn);
            taskList.appendChild(li);
        });
    }
}

if (prevDayBtn) prevDayBtn.addEventListener('click', () => changeDate(-1));
if (nextDayBtn) nextDayBtn.addEventListener('click', () => changeDate(1));
if (todayBtn) todayBtn.addEventListener('click', () => {
    selectedDate = getFormattedDate(new Date());
    updateUI();
});

if (datePickerTrigger && hiddenDatePicker) {
    datePickerTrigger.addEventListener('click', () => hiddenDatePicker.showPicker ? hiddenDatePicker.showPicker() : hiddenDatePicker.click());
    hiddenDatePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            selectedDate = e.target.value;
            updateUI();
        }
    });
}

if (addBtn) {
    addBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (!text) return alert('يرجى كتابة نص المهمة أولاً');
        if (!allTasksByDate[selectedDate]) allTasksByDate[selectedDate] = [];
        allTasksByDate[selectedDate].push({ text, completed: false });
        taskInput.value = '';
        saveTasks();
    });
}

// 5. تطوير الملاحظات السريعة (نظام الكروت)
let notesList = JSON.parse(localStorage.getItem('my_advanced_notes')) || [
    { id: 1, title: 'أفكار لمشروع جديد', content: 'البدء بتصميم واجهة المستخدم واختبار تجربة الاستخدام.' }
];

const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesGrid = document.getElementById('notesGrid');

function saveNotes() {
    localStorage.setItem('my_advanced_notes', JSON.stringify(notesList));
    renderNotes();
}

function renderNotes() {
    if (!notesGrid) return;
    notesGrid.innerHTML = '';

    if (notesList.length === 0) {
        notesGrid.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">لا توجد ملاحظات محفوظة حالياً.</p>`;
        return;
    }

    notesList.forEach((note, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <div class="note-header">
                <h4>${note.title}</h4>
                <div class="note-actions">
                    <button class="icon-btn edit-btn" onclick="editNote(${index})" title="تعديل">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteNote(${index})" title="حذف">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
            <p class="note-body">${note.content}</p>
        `;
        notesGrid.appendChild(card);
    });
}

if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
        const title = noteTitleInput.value.trim() || 'بدون عنوان';
        const content = noteContentInput.value.trim();
        if (!content) return alert('يرجى كتابة محتوى الملاحظة');

        notesList.unshift({ id: Date.now(), title, content });
        noteTitleInput.value = '';
        noteContentInput.value = '';
        saveNotes();
    });
}

window.deleteNote = function(index) {
    if (confirm('هل تريد حذف هذه الملاحظة؟')) {
        notesList.splice(index, 1);
        saveNotes();
    }
};

window.editNote = function(index) {
    const note = notesList[index];
    const newTitle = prompt('تعديل عنوان الملاحظة:', note.title);
    if (newTitle === null) return;
    const newContent = prompt('تعديل محتوى الملاحظة:', note.content);
    if (newContent === null) return;

    notesList[index].title = newTitle.trim() || 'بدون عنوان';
    notesList[index].content = newContent.trim();
    saveNotes();
};

// 6. مؤقت بومودورو
let timerInterval;
let totalTime = 25 * 60;
let timeLeft = 25 * 60;

const timerDisplay = document.getElementById('timerDisplay');
const timerProgress = document.getElementById('timerProgress');
const startTimerBtn = document.getElementById('startTimerBtn');
const pauseTimerBtn = document.getElementById('pauseTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const modeBtns = document.querySelectorAll('.mode-btn');

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
        totalTime = parseInt(btn.getAttribute('data-time')) * 60;
        timeLeft = totalTime;
        clearInterval(timerInterval);
        timerInterval = null;
        updateTimer();
    });
});

if (startTimerBtn) startTimerBtn.addEventListener('click', () => {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimer();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            sendNotification('انتهت جلسة التركيز! 🎉', { body: 'حان وقت الاستراحة أو الانتقال للمهمة التالية.' });
        }
    }, 1000);
});

if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
});

if (resetTimerBtn) resetTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = totalTime;
    updateTimer();
});

// 7. التحديات اليومية (مع إمكانية التعديل وتحسين الحذف)
let challenges = JSON.parse(localStorage.getItem('my_challenges')) || [
    { id: 1, title: 'تحدي 21 يوم قراءة وتركيز', days: new Array(21).fill(false) }
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
                    <span class="challenge-percent">(${progressPercent}%)</span>
                </div>
                <div class="challenge-actions">
                    <button class="icon-btn edit-btn" onclick="editChallengeTitle(${chIndex})" title="تعديل العنوان">
                        <span class="material-symbols-rounded">edit</span>
                    </button>
                    <button class="icon-btn delete-btn" onclick="deleteChallenge(${chIndex})" title="حذف التحدي">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
            <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="days-grid">
                ${ch.days.map((done, dIndex) => `
                    <button class="day-btn ${done ? 'completed' : ''}" onclick="toggleDay(${chIndex},${dIndex})">
                        ${dIndex + 1}
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

window.editChallengeTitle = function(chIndex) {
    const newTitle = prompt('تعديل اسم التحدي:', challenges[chIndex].title);
    if (newTitle !== null && newTitle.trim() !== '') {
        challenges[chIndex].title = newTitle.trim();
        saveChallenges();
    }
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
        challenges.push({ id: Date.now(), title, days: new Array(21).fill(false) });
        newChallengeInput.value = '';
        saveChallenges();
    });
}

// 8. الملف الشخصي
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
            reader.onload = (event) => {
                userProfile.avatar = event.target.result;
                localStorage.setItem('my_user_profile', JSON.stringify(userProfile));
                loadProfile();
            };
            reader.readAsDataURL(file);
        }
    });
}

// 9. الإحصائيات ورسومات Chart.js
let weeklyChartInstance, statusChartInstance;

function renderCharts() {
    const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (!weeklyCtx || !statusCtx) return;

    if (weeklyChartInstance) weeklyChartInstance.destroy();
    if (statusChartInstance) statusChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f8fafc' : '#1e293b';

    const last7DaysLabels = [];
    const last7DaysData = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getFormattedDate(d);
        last7DaysLabels.push(d.toLocaleDateString('ar-EG', { weekday: 'short' }));
        const dayTasks = allTasksByDate[dateStr] || [];
        last7DaysData.push(dayTasks.filter(t => t.completed).length);
    }

    weeklyChartInstance = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: last7DaysLabels,
            datasets: [{
                label: 'المهام المنجزة',
                data: last7DaysData,
                backgroundColor: '#6366f1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                x: { ticks: { color: textColor } },
                y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor } }
            }
        }
    });

    let monthlyCompleted = 0, monthlyTotal = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayTasks = allTasksByDate[getFormattedDate(d)] || [];
        monthlyTotal += dayTasks.length;
        monthlyCompleted += dayTasks.filter(t => t.completed).length;
    }

    statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['مكتملة', 'غير مكتملة'],
            datasets: [{
                data: [monthlyCompleted, monthlyTotal - monthlyCompleted],
                backgroundColor: ['#10b981', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor } },
                title: { display: true, text: `الإنجاز الشهري (${monthlyCompleted} من ${monthlyTotal})`, color: textColor }
            }
        }
    });
}

// التشغيل الأولي
loadProfile();
updateUI();
updateTimer();
renderChallenges();
renderNotes();
