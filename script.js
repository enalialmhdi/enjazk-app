document.addEventListener('DOMContentLoaded', () => {
    // 1. أزرار القائمة والتنقل
    const navBtns = document.querySelectorAll('.nav-btn');
    const appPages = document.querySelectorAll('.app-page');
    const mobileToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.sidebar');

    // التنقل بنقرة زر واحدة المباشرة
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = btn.getAttribute('data-page');

            if (!targetPageId) return;

            // إزالة التفعيل السابق
            navBtns.forEach(b => b.classList.remove('active'));
            appPages.forEach(p => p.classList.remove('active'));

            // تفعيل الزر والصفحة المطلوبة
            btn.classList.add('active');
            const targetPage = document.getElementById(targetPageId);
            
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // إغلاق القائمة عند اللمس في الهاتف
            if (sidebar) {
                sidebar.classList.remove('active');
            }

            // رسم البياني إن كانت صفحة إحصائيات
            if (targetPageId === 'stats-page') {
                initChart();
            }
        });
    });

    // 2. تفعيل زر الهاتف
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // 3. تهيئة الرسم البياني (Chart.js)
    let myChart = null;
    function initChart() {
        const ctx = document.getElementById('myChart');
        if (!ctx) return;

        if (myChart) {
            myChart.destroy(); // إعادة البناء لمنع التعارض
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
                datasets: [{
                    label: 'إنجاز المشاريع',
                    data: [12, 19, 8, 15, 22, 30],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            font: { family: 'Tajawal' }
                        }
                    }
                }
            }
        });
    }
});
