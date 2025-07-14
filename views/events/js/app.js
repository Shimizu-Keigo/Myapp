const appState = {
    currentView: 'landing',
    event: null,
    eventsStorage: {} // Store multiple events locally
};

const landingView = document.getElementById('landing-view');
const createView = document.getElementById('create-view');
const dashboardView = document.getElementById('dashboard-view');

const showCreateViewBtn = document.getElementById('show-create-view-btn');
const backToLandingBtnFromCreate = document.getElementById('back-to-landing-btn-from-create');
const backToLandingBtnFromDashboard = document.getElementById('back-to-landing-btn-from-dashboard');

const createEventForm = document.getElementById('create-event-form');
const joinEventForm = document.getElementById('join-event-form');
const submitAvailabilityForm = document.getElementById('submit-availability-form');

const dashboardEventName = document.getElementById('dashboard-event-name');
const shareableId = document.getElementById('shareable-id');
const copyIdBtn = document.getElementById('copy-id-btn');
const copyMessage = document.getElementById('copy-message');
const dateSelectionGrid = document.getElementById('date-selection-grid');
const availabilityGrid = document.getElementById('availability-grid');
const bestDatesSummary = document.getElementById('best-dates-summary');

let availabilityChart = null;

function switchView(view) {
    appState.currentView = view;
    [landingView, createView, dashboardView].forEach(v => v.classList.add('hidden'));
    document.getElementById(`${view}-view`).classList.remove('hidden');
}

function generateEventId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getDatesInRange(startDate, endDate) {
    const date = new Date(startDate.getTime());
    const dates = [];
    while (date <= endDate) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return dates;
}

function formatDate(date, format = 'short') {
    if (format === 'short') {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (format === 'full'){
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toISOString().split('T')[0];
}


// --- Event Creation and Joining Logic ---
showCreateViewBtn.addEventListener('click', () => switchView('create'));
backToLandingBtnFromCreate.addEventListener('click', () => switchView('landing'));
backToLandingBtnFromDashboard.addEventListener('click', () => {
    appState.event = null;
    switchView('landing');
});

createEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventName = document.getElementById('event-name').value;
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);

    if (startDate > endDate) {
        alert('終了日は開始日より後の日付にしてください。');
        return;
    }

    const eventId = generateEventId();
    const newEvent = {
        id: eventId,
        name: eventName,
        period: { start: startDate, end: endDate },
        members: []
    };
    
    appState.eventsStorage[eventId] = newEvent;
    appState.event = newEvent;
    
    renderDashboard();
    switchView('dashboard');
});

joinEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventId = document.getElementById('join-event-id').value.toUpperCase();
    if (appState.eventsStorage[eventId]) {
        appState.event = appState.eventsStorage[eventId];
        renderDashboard();
        switchView('dashboard');
    } else {
        alert('イベントが見つかりません。IDを確認してください。');
    }
});


// --- Dashboard Rendering Logic ---
function renderDashboard() {
    if (!appState.event) return;

    dashboardEventName.textContent = appState.event.name;
    shareableId.value = appState.event.id;
    
    renderDateSelection();
    renderAvailabilityGrid();
    renderAvailabilityChart();
}

function renderDateSelection() {
    dateSelectionGrid.innerHTML = '';
    const dates = getDatesInRange(appState.event.period.start, appState.event.period.end);
    dates.forEach(date => {
        const day = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        const item = document.createElement('div');
        item.className = 'date-grid-item cursor-pointer p-3 border rounded-lg text-center';
        item.dataset.date = date.toISOString().split('T')[0];
        item.innerHTML = `<div class="font-bold">${formatDate(date)}</div><div class="text-sm text-gray-500">${day}</div>`;
        item.addEventListener('click', () => {
            item.classList.toggle('selected');
        });
        dateSelectionGrid.appendChild(item);
    });
}

function renderAvailabilityGrid() {
    availabilityGrid.innerHTML = '';
    const dates = getDatesInRange(appState.event.period.start, appState.event.period.end);
    
    const table = document.createElement('table');
    table.className = 'w-full text-center border-collapse';

    // Header Row
    let thead = '<thead><tr class="bg-gray-100"><th class="p-2 border">名前</th>';
    dates.forEach(date => {
        const day = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        thead += `<th class="p-2 border">${formatDate(date)}<br><span class="text-xs font-normal">(${day})</span></th>`;
    });
    thead += '</tr></thead>';
    table.innerHTML += thead;

    // Body Rows
    let tbody = '<tbody>';
    if (appState.event.members.length === 0) {
        tbody += '<tr><td colspan="' + (dates.length + 1) + '" class="p-4 text-gray-500">まだ誰も回答していません。</td></tr>';
    } else {
        appState.event.members.forEach(member => {
            tbody += `<tr><td class="p-2 border font-medium">${member.name}</td>`;
            const memberAvailableDates = member.availableDates.map(d => new Date(d).toISOString().split('T')[0]);
            dates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                tbody += `<td class="p-2 border">${memberAvailableDates.includes(dateStr) ? '✓' : ''}</td>`;
            });
            tbody += '</tr>';
        });
    }
    tbody += '</tbody>';
    table.innerHTML += tbody;

    availabilityGrid.appendChild(table);
}

function renderAvailabilityChart() {
    const ctx = document.getElementById('availability-chart').getContext('2d');
    const dates = getDatesInRange(appState.event.period.start, appState.event.period.end);
    
    const counts = new Array(dates.length).fill(0);
    appState.event.members.forEach(member => {
        member.availableDates.forEach(availDateStr => {
            const availDate = new Date(availDateStr).toISOString().split('T')[0];
            const index = dates.findIndex(d => d.toISOString().split('T')[0] === availDate);
            if (index !== -1) {
                counts[index]++;
            }
        });
    });

    const maxCount = Math.max(...counts, 0);
    const bestDates = [];
    if(maxCount > 0){
        counts.forEach((count, index) => {
            if (count === maxCount) {
                bestDates.push(dates[index]);
            }
        });
    }
    
    if (bestDates.length > 0) {
         bestDatesSummary.innerHTML = `✨ <strong class="text-emerald-700">${bestDates.map(d => formatDate(d)).join(', ')}</strong> が <strong class="text-emerald-700">${maxCount}人</strong>で最有力候補です！`;
    } else {
        bestDatesSummary.textContent = 'まだ回答がありません。あなたの予定を登録しましょう！';
    }


    const backgroundColors = counts.map(count => count === maxCount && maxCount > 0 ? '#F97316' : '#0D9488');

    if (availabilityChart) {
        availabilityChart.data.labels = dates.map(d => formatDate(d));
        availabilityChart.data.datasets[0].data = counts;
        availabilityChart.data.datasets[0].backgroundColor = backgroundColors;
        availabilityChart.update();
    } else {
        availabilityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(d => formatDate(d)),
                datasets: [{
                    label: '参加可能な人数',
                    data: counts,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: '人数'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0,
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return formatDate(dates[context[0].dataIndex]);
                            }
                        }
                    }
                }
            }
        });
    }
}

// --- User Interaction Logic ---
submitAvailabilityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const memberName = document.getElementById('member-name').value;
    const selectedItems = document.querySelectorAll('.date-grid-item.selected');
    const availableDates = Array.from(selectedItems).map(item => item.dataset.date);

    let member = appState.event.members.find(m => m.name === memberName);
    if (member) {
        // Update existing member's availability
        member.availableDates = availableDates;
    } else {
        // Add new member
        appState.event.members.push({ name: memberName, availableDates });
    }
    
    // Clear selections after submission
    document.getElementById('member-name').value = '';
    selectedItems.forEach(item => item.classList.remove('selected'));
    
    renderDashboard();
});

copyIdBtn.addEventListener('click', () => {
    shareableId.select();
    document.execCommand('copy');
    copyMessage.textContent = 'コピーしました！';
    setTimeout(() => { copyMessage.textContent = '' }, 2000);
});

// Initialize with a mock event for demonstration if needed, or start fresh
function initializeApp() {
     // For easy testing, let's create a default event on load.
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 9);
    const eventId = "DEMO123";
    
    appState.eventsStorage[eventId] = {
        id: eventId,
        name: "夏のバーベキュー大会",
        period: { start: today, end: endDate },
        members: [
            { name: "田中", availableDates: [new Date(today.getFullYear(), today.getMonth(), today.getDate()+2), new Date(today.getFullYear(), today.getMonth(), today.getDate()+3)] },
            { name: "佐藤", availableDates: [new Date(today.getFullYear(), today.getMonth(), today.getDate()+3), new Date(today.getFullYear(), today.getMonth(), today.getDate()+4), new Date(today.getFullYear(), today.getMonth(), today.getDate()+8)] },
        ]
    };
    appState.event = appState.eventsStorage[eventId];
    
    switchView('dashboard');
    renderDashboard();
}

// Let's start with the landing view
 switchView('landing');
// Or uncomment below to start with the demo event
// initializeApp();
