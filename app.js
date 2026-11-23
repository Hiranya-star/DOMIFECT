const TASKS_KEY = 'domifect_tasks';
const ARCHIVE_KEY = 'domifect_archive';
const PROFILE_KEY = 'domifect_profile';
const SCHEDULE_KEY = 'domifect_schedule';
const GEAR_KEY = 'domifect_gear';
const STATS_KEY = 'domifect_stats';
const ALARM_MODE_KEY = 'domifect_alarm_mode';
const EXAM_MODE_KEY = 'domifect_exam_mode';

const DAYS_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NAMES_BY_INDEX = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_ORDER = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };

let tasks = [];
let archivedTasks = [];
let schedules = [];
let gears = [];
let stats = { onTime: 0, late: 0, streak: 0 };
let userProfile = { name: '', className: '', school: '', targetHours: 3 };
let isExamMode = false;
let currentTaskFilter = 'all';
let lastPanicTextWA = '';
let deferredInstallPrompt = null;
const notifiedTaskWindows = new Set();

let focusTimerInterval = null;
let focusSecondsRemaining = 25 * 60;
let isFocusRunning = false;

function showToast(msg) {
  const el = document.getElementById('toastFeedback');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() {
    el.classList.add('hidden');
  }, 2800);
}



/* PENGHUBUNG KONTROL HTML KE FUNGSI JAVASCRIPT */
function bindUIEvents() {
  const on = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
  on('btnSidebarTheme', 'click', toggleTheme);
  on('btnMobileTheme', 'click', toggleTheme);
  on('btnEnableNotif', 'click', requestNotificationPermission);
  on('btnInstallPWA', 'click', installPWA);
  on('btnMobileNotif', 'click', requestNotificationPermission);
  on('btnEnableNotifMobile', 'click', requestNotificationPermission);
  on('btnQuickAdd', 'click', () => window.uiQuickAdd());
  on('btnAddFromActive', 'click', () => window.uiQuickAdd());
  on('btnPanic', 'click', triggerPanicMode);
  on('btnAntiMager', 'click', () => window.uiAntiMager());
  on('btnToggleExamMode', 'click', () => window.uiToggleExamMode());
  on('btnClosePanic', 'click', () => window.uiClosePanic());
  on('btnSharePanicWA', 'click', () => window.uiSharePanicWA());
  on('btnGoActiveTasks', 'click', () => navigateTo('active-tasks'));
  on('btnCancelEdit', 'click', () => window.uiCancelEdit());
  on('btnGenerateChat', 'click', handleGenerateChat);
  on('btnCopyChat', 'click', () => window.uiCopyChat());
  on('btnStartTimer', 'click', handleStartTimer);
  on('btnPauseTimer', 'click', () => window.uiPauseTimer());
  on('btnResetTimer', 'click', () => window.uiResetTimer());
  on('btnExportData', 'click', handleExportData);
  on('btnClosePopup', 'click', () => window.uiClosePopup());

  on('taskForm', 'submit', e => { e.preventDefault(); handleTaskSubmit(); });
  on('scheduleForm', 'submit', e => { e.preventDefault(); handleScheduleSubmit(); });
  on('gearForm', 'submit', e => { e.preventDefault(); handleGearSubmit(); });
  on('profileForm', 'submit', e => { e.preventDefault(); handleProfileSubmit(); });

  on('tQuickSchedule', 'change', e => window.uiOnQuickScheduleChange(e.target.value));
  on('tPersona', 'change', e => window.uiOnPersonaChange(e.target.value));
  on('simTaskSelect', 'change', renderSimulator);
  on('simDelaySlider', 'input', renderSimulator);
  on('customTimerInput', 'input', e => window.uiOnTimerInputChange(e.target.value));
  on('alarmModeSelect', 'change', e => window.uiOnAlarmModeChange(e.target.value));
  on('inputImportData', 'change', e => window.uiImportData(e.target));

  document.querySelectorAll('.filter-tab[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => window.uiFilterTasks(btn.dataset.filter));
  });
}

function initApp() {
  initTheme();
  loadAllData();
  setDefaultTaskDates();
  updateNotifStatusBadge();
  bindUIEvents();
  registerServiceWorker();
  setupPWAInstall();
  renderAll();
  startWatchdog();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js', {scope:'./'}).then(reg => reg.update()).catch(err => console.warn('DOMIFECT SW:', err));
}

function setupPWAInstall() {
  const installBtn = document.getElementById('btnInstallPWA');
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    if (installBtn) installBtn.classList.add('hidden');
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredInstallPrompt = event;
    if (installBtn) installBtn.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
    showToast('✅ DOMIFECT berhasil dipasang sebagai aplikasi!');
  });
}

async function installPWA() {
  if (!deferredInstallPrompt) {
    showToast('Buka menu Chrome ⋮ lalu pilih “Tambahkan ke layar utama” atau “Install app”.');
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
}


function initTheme() {
  const saved = localStorage.getItem('domifect_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButtonText(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('domifect_theme', next);
  updateThemeButtonText(next);
}

function updateThemeButtonText(theme) {
  const btn = document.getElementById('btnSidebarTheme');
  const mobileBtn = document.getElementById('btnMobileTheme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap';
  if (mobileBtn) mobileBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toLocalDatetimeInputValue(dateObj) {
  const pad = function(n) { return String(n).padStart(2, '0'); };
  return dateObj.getFullYear() + '-' + pad(dateObj.getMonth() + 1) + '-' + pad(dateObj.getDate()) + 'T' + pad(dateObj.getHours()) + ':' + pad(dateObj.getMinutes());
}

function setDefaultTaskDates() {
  const workEl = document.getElementById('tWorkSchedule');
  const deadEl = document.getElementById('tDeadline');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 3600000);
  tomorrow.setHours(7, 0, 0, 0);
  if (workEl) workEl.value = toLocalDatetimeInputValue(now);
  if (deadEl) deadEl.value = toLocalDatetimeInputValue(tomorrow);
}

function loadAllData() {
  try {
    const rawProf = localStorage.getItem(PROFILE_KEY);
    if (rawProf) {
      userProfile = JSON.parse(rawProf);
      const pName = document.getElementById('pName');
      const pClass = document.getElementById('pClass');
      const pSchool = document.getElementById('pSchool');
      const pTargetHours = document.getElementById('pTargetHours');
      if (pName) pName.value = userProfile.name || '';
      if (pClass) pClass.value = userProfile.className || '';
      if (pSchool) pSchool.value = userProfile.school || '';
      if (pTargetHours) pTargetHours.value = userProfile.targetHours || 3;
      updateStudentTags();
    }
  } catch (e) {}

  try { tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || []; } catch (e) { tasks = []; }
  try { archivedTasks = JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || []; } catch (e) { archivedTasks = []; }
  try { schedules = sortSchedulesByDay(JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || []); } catch (e) { schedules = []; }
  try { gears = JSON.parse(localStorage.getItem(GEAR_KEY)) || []; } catch (e) { gears = []; }
  try { stats = JSON.parse(localStorage.getItem(STATS_KEY)) || { onTime: 0, late: 0, streak: 0 }; } catch (e) {}

  isExamMode = localStorage.getItem(EXAM_MODE_KEY) === 'true';
  updateExamModeUI();

  const savedAlarmMode = localStorage.getItem(ALARM_MODE_KEY) || 'sound';
  const alarmSelect = document.getElementById('alarmModeSelect');
  if (alarmSelect) alarmSelect.value = savedAlarmMode;
}

function saveTasks() { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); syncTasksToServiceWorker(); }
function saveArchive() { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedTasks)); }
function saveSchedules() {
  schedules = sortSchedulesByDay(schedules);
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}
function saveGears() { localStorage.setItem(GEAR_KEY, JSON.stringify(gears)); }
function saveStats() { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }

function sortSchedulesByDay(list) {
  return list.slice().sort(function(a, b) {
    const dayA = DAY_ORDER[a.day] || 99;
    const dayB = DAY_ORDER[b.day] || 99;
    if (dayA !== dayB) return dayA - dayB;
    return (a.subject || '').localeCompare(b.subject || '');
  });
}

function updateStudentTags() {
  const tagText = userProfile.name
    ? userProfile.name + (userProfile.className ? ' • ' + userProfile.className : '')
    : 'Planner SMA & SMK';
  const sideTag = document.getElementById('sidebarStudentTag');
  const mobTag = document.getElementById('mobileStudentTag');
  if (sideTag) sideTag.textContent = tagText;
  if (mobTag) mobTag.textContent = userProfile.name ? tagText : 'SMA & SMK';
}

function updateExamModeUI() {
  const badge = document.getElementById('examModeBadge');
  const btn = document.getElementById('btnToggleExamMode');
  if (badge) badge.classList.toggle('hidden', !isExamMode);
  if (btn) {
    btn.textContent = isExamMode
      ? '🎓 Nonaktifkan Mode Ujian / Pekan Praktik'
      : '🎓 Aktifkan Mode Ujian / Pekan Praktik (UKK / SAS)';
    btn.className = isExamMode ? 'btn btn-danger btn-block btn-sm' : 'btn btn-secondary btn-block btn-sm';
  }
}

/* NAVIGASI HALAMAN */
const pageTitles = {
  dashboard: 'Dashboard Akademik & Kejuruan',
  'create-task': 'Buat / Edit Tugas Baru',
  'active-tasks': 'Daftar Tugas Aktif & Arsip',
  simulator: 'Simulasi Efek Domino',
  schedule: 'Jadwal Pelajaran & Perlengkapan',
  alerts: 'Pusat Teror & Chat Negosiasi Guru',
  focus: 'Mode Fokus Pengerjaan Kustom',
  profile: 'Profil Siswa, Statistik & Backup'
};

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(function(b) {
    b.classList.remove('active');
  });

  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) targetPage.classList.add('active');

  const targetNav = document.querySelector('.nav-item[data-page="' + pageId + '"]');
  if (targetNav) targetNav.classList.add('active');

  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = pageTitles[pageId] || 'DOMIFECT';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAll();
}

window.navigateTo = navigateTo;

/* GLOBAL UI HANDLERS */
window.uiGoPage = function(pageId) {
  const editField = document.getElementById('editTaskId');
  if (pageId === 'create-task' && (!editField || !editField.value)) {
    resetTaskForm();
  }
  navigateTo(pageId);
};

window.uiToggleTheme = function() { toggleTheme(); };
window.uiRequestNotif = function() { requestNotificationPermission(); };
window.uiQuickAdd = function() { resetTaskForm(); navigateTo('create-task'); };
window.uiPanic = function() { triggerPanicMode(); };
window.uiClosePanic = function() {
  const box = document.getElementById('panicBox');
  if (box) box.classList.add('hidden');
};
window.uiSharePanicWA = function() {
  if (lastPanicTextWA) {
    window.open('https://wa.me/?text=' + encodeURIComponent(lastPanicTextWA), '_blank');
  }
};
window.uiAntiMager = function() {
  const targetLabel = document.getElementById('focusTaskTargetLabel');
  if (targetLabel) targetLabel.textContent = '⚡ Tantangan Anti-Mager 5 Menit — Mulai Sekarang!';
  navigateTo('focus');
  startCustomFocus(5);
};
window.uiToggleExamMode = function() {
  isExamMode = !isExamMode;
  localStorage.setItem(EXAM_MODE_KEY, String(isExamMode));
  updateExamModeUI();
  renderAll();
  showToast(isExamMode ? '🎓 Mode Ujian / UKK Aktif!' : 'Mode Ujian Dinonaktifkan');
};
window.uiFilterTasks = function(filterType) {
  currentTaskFilter = filterType || 'all';
  document.querySelectorAll('.filter-tab').forEach(function(t) {
    t.className = t.getAttribute('data-filter') === currentTaskFilter
      ? 'btn btn-sm btn-primary filter-tab'
      : 'btn btn-sm btn-secondary filter-tab';
  });
  renderAssignments();
};
window.uiCancelEdit = function() { resetTaskForm(); navigateTo('active-tasks'); };
window.uiOnQuickScheduleChange = function(val) {
  const sch = schedules.find(function(s) { return s.id === val; });
  if (sch) {
    document.getElementById('tSubject').value = sch.subject;
    document.getElementById('tTeacher').value = sch.teacher;
  }
};
window.uiOnPersonaChange = function(val) {
  const customGroup = document.getElementById('customPersonaGroup');
  if (!customGroup) return;
  if (val === 'custom') customGroup.classList.remove('hidden');
  else customGroup.classList.add('hidden');
};
window.uiSubmitTask = function(e) { if (e) e.preventDefault(); handleTaskSubmit(); return false; };
window.uiSubmitSchedule = function(e) { if (e) e.preventDefault(); handleScheduleSubmit(); return false; };
window.uiSubmitGear = function(e) { if (e) e.preventDefault(); handleGearSubmit(); return false; };
window.uiSubmitProfile = function(e) { if (e) e.preventDefault(); handleProfileSubmit(); return false; };
window.uiStartTimer = function() { handleStartTimer(); };
window.uiPauseTimer = function() {
  clearInterval(focusTimerInterval);
  isFocusRunning = false;
  showToast('⏸️ Timer dijeda');
};
window.uiResetTimer = function() {
  clearInterval(focusTimerInterval);
  isFocusRunning = false;
  const inputVal = document.getElementById('customTimerInput') ? document.getElementById('customTimerInput').value : 25;
  const mins = Math.max(1, Math.min(180, parseInt(inputVal, 10) || 25));
  focusSecondsRemaining = mins * 60;
  updateTimerDisplay();
  showToast('🔄 Timer di-reset');
};
window.uiOnTimerInputChange = function(val) {
  if (!isFocusRunning) {
    focusSecondsRemaining = Math.max(1, Math.min(180, parseInt(val, 10) || 25)) * 60;
    updateTimerDisplay();
  }
};
window.uiGenerateChat = function() { handleGenerateChat(); };
window.uiCopyChat = function() {
  const output = document.getElementById('negoChatOutput');
  if (output) {
    output.select();
    if (navigator.clipboard) navigator.clipboard.writeText(output.value);
    showToast('📋 Draf chat WhatsApp berhasil disalin!');
  }
};
window.uiOnAlarmModeChange = function(val) { localStorage.setItem(ALARM_MODE_KEY, val); };
window.uiExportData = function() { handleExportData(); };
window.uiImportData = function(inputEl) {
  if (inputEl && inputEl.files && inputEl.files[0]) {
    handleImportData(inputEl.files[0]);
  }
};
window.uiClosePopup = function() {
  const banner = document.getElementById('popupTerrorBanner');
  if (banner) banner.classList.add('hidden');
};

function handleTaskSubmit() {
  const titleVal = (document.getElementById('tTitle')?.value || '').trim();
  const subjectVal = (document.getElementById('tSubject')?.value || '').trim();
  const teacherVal = (document.getElementById('tTeacher')?.value || '').trim();
  const workVal = document.getElementById('tWorkSchedule')?.value || '';
  const deadlineVal = document.getElementById('tDeadline')?.value || '';

  if (!titleVal || !subjectVal || !teacherVal || !deadlineVal) {
    alert('⚠️ Mohon isi Nama Tugas, Mata Pelajaran, Nama Guru, dan Deadline!');
    return;
  }

  const existingId = document.getElementById('editTaskId')?.value || '';
  const id = existingId || ('t_' + Date.now());
  const rawSubs = (document.getElementById('tSubTasks')?.value || '').trim();
  let parsedSubTasks = [];

  if (rawSubs) {
    const oldTask = tasks.find(function(t) { return t.id === existingId; });
    parsedSubTasks = rawSubs.split(',').map(function(s) { return s.trim(); }).filter(Boolean).map(function(text) {
      const prev = oldTask && oldTask.subTasks ? oldTask.subTasks.find(function(os) { return os.text === text; }) : null;
      return { text: text, done: prev ? prev.done : false };
    });
  }

  const newTask = {
    id: id,
    title: titleVal,
    subject: subjectVal,
    teacher: teacherVal,
    gradeWeight: document.getElementById('tGradeWeight')?.value || '1',
    persona: document.getElementById('tPersona')?.value || 'killer',
    customText: (document.getElementById('tCustomText')?.value || '').trim(),
    workSchedule: workVal || deadlineVal,
    deadline: deadlineVal,
    duration: parseFloat(document.getElementById('tDuration')?.value) || 1,
    dependsOn: document.getElementById('tDependsOn')?.value || '',
    subTasks: parsedSubTasks,
    groupMembers: (document.getElementById('tGroupMembers')?.value || '').trim(),
    status: 'active'
  };

  const idx = tasks.findIndex(function(t) { return t.id === id; });
  if (idx >= 0) tasks[idx] = newTask;
  else tasks.push(newTask);

  saveTasks();
  resetTaskForm();
  currentTaskFilter = 'all';
  navigateTo('active-tasks');
  showToast('✅ Tugas berhasil disimpan!');
  triggerNotifications(newTask);
}

function handleScheduleSubmit() {
  const day = document.getElementById('sDay').value;
  const subject = document.getElementById('sSubject').value.trim();
  const teacher = document.getElementById('sTeacher').value.trim();
  if (!subject || !teacher) return;
  schedules.push({ id: 's_' + Date.now(), day: day, subject: subject, teacher: teacher });
  saveSchedules();
  const form = document.getElementById('scheduleForm');
  if (form) form.reset();
  renderAll();
  showToast('📅 Mapel ' + subject + ' (' + day + ') tersimpan!');
}

function handleGearSubmit() {
  const input = document.getElementById('gearInput');
  const val = input ? input.value.trim() : '';
  if (!val) return;
  gears.push({ id: 'g_' + Date.now(), text: val, checked: false });
  saveGears();
  input.value = '';
  renderAll();
  showToast('🎒 Perlengkapan ditambahkan!');
}

function handleProfileSubmit() {
  userProfile = {
    name: document.getElementById('pName').value.trim(),
    className: document.getElementById('pClass').value.trim(),
    school: document.getElementById('pSchool').value.trim(),
    targetHours: parseFloat(document.getElementById('pTargetHours').value) || 3
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
  updateStudentTags();
  renderAll();
  showToast('✅ Profil siswa berhasil disimpan!');
}

function handleGenerateChat() {
  const taskId = document.getElementById('negoTaskSelect')?.value;
  const reason = document.getElementById('negoReasonSelect')?.value;
  const task = tasks.find(function(t) { return t.id === taskId; });
  if (!task) {
    alert('Tambahkan atau pilih tugas terlebih dahulu!');
    return;
  }
  const studentName = userProfile.name || '[Nama Saya]';
  const studentClass = userProfile.className || '[Kelas]';
  const reasonTexts = {
    alat: 'dikarenakan terdapat kendala teknis pada perangkat/alat praktik atau laptop yang sedang mengalami gangguan',
    sakit: 'dikarenakan kondisi kesehatan saya sedang kurang fit / sakit sehingga proses pengerjaan sedikit terhambat',
    bertumpuk: 'dikarenakan bersamaan dengan jadwal uji kompetensi/praktik mata pelajaran lain yang cukup padat',
    revisi: 'dikarenakan saya sedang melakukan pengecekan ulang dan penyempurnaan hasil agar sesuai dengan standar yang diminta',
    listrik: 'dikarenakan terjadi pemadaman listrik dan gangguan jaringan internet di wilayah tempat tinggal saya sejak tadi malam',
    keluarga: 'dikarenakan terdapat urusan keluarga yang sangat mendesak / anggota keluarga sedang sakit sehingga saya harus mendampingi',
    dispen: 'dikarenakan saya sedang menjalankan tugas dispensasi kegiatan sekolah / lomba mewakili sekolah',
    pkl: 'dikarenakan terdapat penyesuaian jadwal kerja / lembur di tempat PKL (Prakerin) yang baru selesai cukup malam',
    kelompok: 'dikarenakan kami masih menunggu kelengkapan data dari salah satu anggota kelompok agar laporan dapat digabungkan secara utuh'
  };

  const lines = [
    "Assalamu'alaikum / Selamat pagi/siang " + task.teacher + ".",
    "",
    "Mohon maaf mengganggu waktunya. Saya " + studentName + " dari kelas " + studentClass + ". Saya ingin mengonfirmasi terkait tugas \"" + task.title + "\" pada mata pelajaran " + task.subject + ".",
    "",
    "Saat ini progres pengerjaan sudah berjalan, namun " + (reasonTexts[reason] || reasonTexts.alat) + ". Saya memohon izin untuk dapat mengumpulkan tugas tersebut paling lambat pada [Sebutkan Jam/Hari].",
    "",
    "Terima kasih banyak atas pengertian dan bimbingannya, " + task.teacher + "."
  ];

  document.getElementById('negoChatOutput').value = lines.join('\n');
  document.getElementById('negoResultBox').classList.remove('hidden');
  showToast('✍️ Draf chat WhatsApp siap disalin!');
}

function handleExportData() {
  const backup = {
    userProfile: userProfile,
    tasks: tasks,
    archivedTasks: archivedTasks,
    schedules: schedules,
    gears: gears,
    stats: stats
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DOMIFECT_Backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇️ File backup berhasil diunduh!');
}

function handleImportData(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.userProfile) userProfile = data.userProfile;
      if (data.tasks) tasks = data.tasks;
      if (data.archivedTasks) archivedTasks = data.archivedTasks;
      if (data.schedules) schedules = sortSchedulesByDay(data.schedules);
      if (data.gears) gears = data.gears;
      if (data.stats) stats = data.stats;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
      saveTasks();
      saveArchive();
      saveSchedules();
      saveGears();
      saveStats();
      loadAllData();
      renderAll();
      showToast('✅ Data backup berhasil dipulihkan!');
    } catch (err) {
      alert('⚠️ File backup tidak valid!');
    }
  };
  reader.readAsText(file);
}

const terrorMatrix = {
  killer: {
    openers: ["Perhatian penuh untukmu!", "Peringatan keras dari {teacher}!", "Kesabaran {teacher} sudah di batas akhir!"],
    cores: ["Tugas '{title}' mapel {subject} masih kosong melompong tanpa progres.", "Nilai rapor {subject}-mu berada di ujung tanduk karena mengabaikan '{title}'."],
    closers: ["Kerjakan sekarang atau terima nilai nol bulat!", "Buka buku dan laptopmu detik ini juga!"]
  },
  sarcastic: {
    openers: ["Wah, luar biasa sekali santainya...", "Selamat menikmati waktu rebahanmu ya..."],
    cores: ["Tugas '{title}' dari {teacher} pasti bisa selesai sendiri lewat kekuatan pikiran.", "{teacher} sudah menyiapkan formulir remidi edisi spesial untuk {subject}."],
    closers: ["Mau lanjut santai atau mulai kerja sekarang?", "Mulai cicil sekarang sebelum waktu habis!"]
  },
  disciplined: {
    openers: ["Alarm kedisiplinan berbunyi!", "Waktu berjalan presisi tanpa kompromi!"],
    cores: ["{teacher} menghitung setiap detik keterlambatan pada pengerjaan '{title}'.", "Menunda '{title}' akan memicu efek domino ke seluruh target belajarmu."],
    closers: ["Eksekusi sesuai jadwal detik ini juga!", "Jaga stabilitas jadwalmu tetap 100%!"]
  },
  friendly: {
    openers: ["Halo, semangat ya hari ini!", "Sedikit pengingat hangat untukmu..."],
    cores: ["{teacher} menantikan hasil terbaikmu pada tugas '{title}' ({subject}).", "Jangan sampai tugas '{title}' menumpuk dan membuatmu stres."],
    closers: ["Yuk mulai kerjakan sekarang, kamu pasti bisa!", "Buat {teacher} bangga dengan hasil kerjamu!"]
  },
  vocational: {
    openers: ["Perhatian standar bengkel & lab!", "Peringatan SOP praktik kejuruan!"],
    cores: ["Laporan '{title}' pada kompetensi {subject} belum tuntas.", "Di dunia industri, keterlambatan '{title}' berarti gagal memenuhi SOP."],
    closers: ["Eksekusi sesuai prosedur sekarang juga!", "Buktikan kompetensi kejuruanmu di depan {teacher}!"]
  },
  silentkiller: {
    openers: ["Hening bukan berarti aman...", "Waspadai ketenangan {teacher}..."],
    cores: ["{teacher} jarang menegur, tapi status '{title}' milikmu sudah ditandai.", "Tanpa peringatan ulang, nilai {subject} untuk '{title}' bisa dikosongkan."],
    closers: ["Segera amankan posisimu sebelum terlambat!", "Kumpulkan '{title}' sebelum namamu dicoret!"]
  },
  motivator: {
    openers: ["Bangkit dan tatap masa depanmu!", "Mental juara ditempa dari hal-hal kecil!"],
    cores: ["Menyelesaikan '{title}' ({subject}) adalah latihan nyata menghadapi tantangan.", "{teacher} ingin melihatmu tumbuh menjadi lulusan berintegritas."],
    closers: ["Ambil kendali atas waktumu dan mulai sekarang!", "Tuntaskan '{title}' dengan kualitas terbaikmu!"]
  },
  custom: {
    openers: ["Peringatan khusus dari {teacher}!", "Ingat kata-kata {teacher}!"],
    cores: ["\"{customText}\" — Terkait tugas '{title}' ({subject})."],
    closers: ["Segera buka dan kerjakan sekarang!"]
  }
};

// 50 pesan tambahan untuk setiap karakter guru: 10 pembuka x 5 inti.
// Gaya pesan tetap jenaka dan suportif, bukan ancaman atau penghinaan.
const extraTerrorBank = {
  killer: [
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Ayo kerjakan sekarang!",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Jangan ditunda lagi ya.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Waktu terus berjalan.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Buktikan kemampuanmu!",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Segera kumpulkan ke {teacher}.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Semangat!",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Biar tidak panik di akhir.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Amankan nilaimu.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Fokus 15 menit saja.",
    "🚨 Panggilan darurat dari {teacher}! Tugas '{title}' mapel {subject} masih kosong. Segera selesaikan sebelum nilai rapormu nol! Pasti beres!",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Ayo kerjakan sekarang!",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Jangan ditunda lagi ya.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Waktu terus berjalan.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Buktikan kemampuanmu!",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Segera kumpulkan ke {teacher}.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Semangat!",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Biar tidak panik di akhir.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Amankan nilaimu.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Fokus 15 menit saja.",
    "🔔 Alarm {teacher} berbunyi! '{title}' ({subject}) belum ada progres. Jangan menyesal di akhir! Pasti beres!",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Ayo kerjakan sekarang!",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Jangan ditunda lagi ya.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Waktu terus berjalan.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Buktikan kemampuanmu!",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Segera kumpulkan ke {teacher}.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Semangat!",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Biar tidak panik di akhir.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Amankan nilaimu.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Fokus 15 menit saja.",
    "Perhatian dari {teacher}: '{title}' di {subject} menunggumu. Kerjakan sekarang juga! Pasti beres!",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Ayo kerjakan sekarang!",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Jangan ditunda lagi ya.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Waktu terus berjalan.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Buktikan kemampuanmu!",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Segera kumpulkan ke {teacher}.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Semangat!",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Biar tidak panik di akhir.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Amankan nilaimu.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Fokus 15 menit saja.",
    "Breaking news: {teacher} mencatat '{title}' ({subject}) belum dikumpul. Cepat selesaikan! Pasti beres!",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Ayo kerjakan sekarang!",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Jangan ditunda lagi ya.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Waktu terus berjalan.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Buktikan kemampuanmu!",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Segera kumpulkan ke {teacher}.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Semangat!",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Biar tidak panik di akhir.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Amankan nilaimu.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Fokus 15 menit saja.",
    "Status merah untukmu dari {teacher}! Tugas '{title}' ({subject}) harus segera diselesaikan hari ini. Pasti beres!",
  ],
  sarcastic: [
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Ayo kerjakan sekarang!",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Jangan ditunda lagi ya.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Waktu terus berjalan.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Buktikan kemampuanmu!",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Segera kumpulkan ke {teacher}.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Semangat!",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Biar tidak panik di akhir.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Amankan nilaimu.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Fokus 15 menit saja.",
    "Wah, tugas '{title}' dari {teacher} sepertinya lagi asyik liburan. Kapan mau disentuh? Pasti beres!",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Ayo kerjakan sekarang!",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Jangan ditunda lagi ya.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Waktu terus berjalan.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Buktikan kemampuanmu!",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Segera kumpulkan ke {teacher}.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Semangat!",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Biar tidak panik di akhir.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Amankan nilaimu.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Fokus 15 menit saja.",
    "Halo pejuang santai, '{title}' ({subject}) titip salam, katanya kangen dikerjakan. Pasti beres!",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Ayo kerjakan sekarang!",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Jangan ditunda lagi ya.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Waktu terus berjalan.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Buktikan kemampuanmu!",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Segera kumpulkan ke {teacher}.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Semangat!",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Biar tidak panik di akhir.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Amankan nilaimu.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Fokus 15 menit saja.",
    "Hebat ya, {teacher} nungguin '{title}' ({subject}) selesai sendiri lewat tenaga gaib. Pasti beres!",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Ayo kerjakan sekarang!",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Jangan ditunda lagi ya.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Waktu terus berjalan.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Buktikan kemampuanmu!",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Segera kumpulkan ke {teacher}.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Semangat!",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Biar tidak panik di akhir.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Amankan nilaimu.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Fokus 15 menit saja.",
    "Mau nunggu '{title}' beranak di daftar tugas atau mau dikerjakan sekarang? Pasti beres!",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Ayo kerjakan sekarang!",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Jangan ditunda lagi ya.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Waktu terus berjalan.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Buktikan kemampuanmu!",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Segera kumpulkan ke {teacher}.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Semangat!",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Biar tidak panik di akhir.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Amankan nilaimu.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Fokus 15 menit saja.",
    "Santai banget kelihatannya, padahal '{title}' ({subject}) tinggal hitungan jam. Pasti beres!",
  ],
  disciplined: [
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Ayo kerjakan sekarang!",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Jangan ditunda lagi ya.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Waktu terus berjalan.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Buktikan kemampuanmu!",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Segera kumpulkan ke {teacher}.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Semangat!",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Biar tidak panik di akhir.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Amankan nilaimu.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Fokus 15 menit saja.",
    "⏱️ Target waktu presisi: '{title}' ({subject}) harus selesai sesuai jadwal dari {teacher}. Pasti beres!",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Ayo kerjakan sekarang!",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Jangan ditunda lagi ya.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Waktu terus berjalan.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Buktikan kemampuanmu!",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Segera kumpulkan ke {teacher}.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Semangat!",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Biar tidak panik di akhir.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Amankan nilaimu.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Fokus 15 menit saja.",
    "Sistem mencatat deviasi waktu pada '{title}' ({subject}). Segera eksekusi! Pasti beres!",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Ayo kerjakan sekarang!",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Jangan ditunda lagi ya.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Waktu terus berjalan.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Buktikan kemampuanmu!",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Segera kumpulkan ke {teacher}.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Semangat!",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Biar tidak panik di akhir.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Amankan nilaimu.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Fokus 15 menit saja.",
    "Kedisiplinan diuji pada '{title}' ({subject}). Patuhi batas waktu dari {teacher}. Pasti beres!",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Ayo kerjakan sekarang!",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Jangan ditunda lagi ya.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Waktu terus berjalan.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Buktikan kemampuanmu!",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Segera kumpulkan ke {teacher}.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Semangat!",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Biar tidak panik di akhir.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Amankan nilaimu.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Fokus 15 menit saja.",
    "Manajemen waktu {teacher} menuntut '{title}' ({subject}) selesai tepat jamnya. Pasti beres!",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Ayo kerjakan sekarang!",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Jangan ditunda lagi ya.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Waktu terus berjalan.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Buktikan kemampuanmu!",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Segera kumpulkan ke {teacher}.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Semangat!",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Biar tidak panik di akhir.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Amankan nilaimu.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Fokus 15 menit saja.",
    "Jadwal harian terganggu karena '{title}' ({subject}) belum tuntas. Pasti beres!",
  ],
  friendly: [
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Ayo kerjakan sekarang!",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Jangan ditunda lagi ya.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Waktu terus berjalan.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Buktikan kemampuanmu!",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Segera kumpulkan ke {teacher}.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Semangat!",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Biar tidak panik di akhir.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Amankan nilaimu.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Fokus 15 menit saja.",
    "Hai! Pesan ramah dari {teacher}: yuk cicil '{title}' ({subject}) pelan-pelan. Pasti beres!",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Ayo kerjakan sekarang!",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Jangan ditunda lagi ya.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Waktu terus berjalan.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Buktikan kemampuanmu!",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Segera kumpulkan ke {teacher}.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Semangat!",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Biar tidak panik di akhir.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Amankan nilaimu.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Fokus 15 menit saja.",
    "Halo, semangat ya! '{title}' ({subject}) pasti bisa kamu selesaikan hari ini. Pasti beres!",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Ayo kerjakan sekarang!",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Jangan ditunda lagi ya.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Waktu terus berjalan.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Buktikan kemampuanmu!",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Segera kumpulkan ke {teacher}.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Semangat!",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Biar tidak panik di akhir.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Amankan nilaimu.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Fokus 15 menit saja.",
    "🌻 Dukungan hangat dari {teacher} untuk tugas '{title}' ({subject}). Kamu pasti bisa! Pasti beres!",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Ayo kerjakan sekarang!",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Jangan ditunda lagi ya.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Waktu terus berjalan.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Buktikan kemampuanmu!",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Segera kumpulkan ke {teacher}.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Semangat!",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Biar tidak panik di akhir.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Amankan nilaimu.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Fokus 15 menit saja.",
    "Sedikit pengingat lembut: tugas '{title}' ({subject}) menunggu sentuhanmu. Pasti beres!",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Ayo kerjakan sekarang!",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Jangan ditunda lagi ya.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Waktu terus berjalan.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Buktikan kemampuanmu!",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Segera kumpulkan ke {teacher}.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Semangat!",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Biar tidak panik di akhir.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Amankan nilaimu.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Fokus 15 menit saja.",
    "Yuk luangkan 15 menit buat '{title}' ({subject}) supaya nanti lebih tenang. Pasti beres!",
  ],
  vocational: [
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Ayo kerjakan sekarang!",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Jangan ditunda lagi ya.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Waktu terus berjalan.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Buktikan kemampuanmu!",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Segera kumpulkan ke {teacher}.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Semangat!",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Biar tidak panik di akhir.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Amankan nilaimu.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Fokus 15 menit saja.",
    "🧰 Standar SOP bengkel: '{title}' ({subject}) belum lolos uji oleh {teacher}. Pasti beres!",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Ayo kerjakan sekarang!",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Jangan ditunda lagi ya.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Waktu terus berjalan.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Buktikan kemampuanmu!",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Segera kumpulkan ke {teacher}.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Semangat!",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Biar tidak panik di akhir.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Amankan nilaimu.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Fokus 15 menit saja.",
    "Laporan praktikum '{title}' ({subject}) wajib sesuai standar industri. Pasti beres!",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Ayo kerjakan sekarang!",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Jangan ditunda lagi ya.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Waktu terus berjalan.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Buktikan kemampuanmu!",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Segera kumpulkan ke {teacher}.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Semangat!",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Biar tidak panik di akhir.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Amankan nilaimu.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Fokus 15 menit saja.",
    "Instruktur {teacher} menagih lembar kerja '{title}' ({subject}) hari ini. Pasti beres!",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Ayo kerjakan sekarang!",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Jangan ditunda lagi ya.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Waktu terus berjalan.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Buktikan kemampuanmu!",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Segera kumpulkan ke {teacher}.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Semangat!",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Biar tidak panik di akhir.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Amankan nilaimu.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Fokus 15 menit saja.",
    "Quality control {subject}: '{title}' harus dirapikan sesuai instruksi bengkel. Pasti beres!",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Ayo kerjakan sekarang!",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Jangan ditunda lagi ya.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Waktu terus berjalan.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Buktikan kemampuanmu!",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Segera kumpulkan ke {teacher}.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Semangat!",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Biar tidak panik di akhir.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Amankan nilaimu.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Fokus 15 menit saja.",
    "Dunia kerja menuntut ketepatan '{title}' ({subject}). Segera selesaikan! Pasti beres!",
  ],
  silentkiller: [
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Ayo kerjakan sekarang!",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Jangan ditunda lagi ya.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Waktu terus berjalan.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Buktikan kemampuanmu!",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Segera kumpulkan ke {teacher}.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Semangat!",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Biar tidak panik di akhir.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Amankan nilaimu.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Fokus 15 menit saja.",
    "...Pemberitahuan senyap dari {teacher}: '{title}' ({subject}) dicatat. Pasti beres!",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Ayo kerjakan sekarang!",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Jangan ditunda lagi ya.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Waktu terus berjalan.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Buktikan kemampuanmu!",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Segera kumpulkan ke {teacher}.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Semangat!",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Biar tidak panik di akhir.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Amankan nilaimu.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Fokus 15 menit saja.",
    "Tanpa banyak bicara, {teacher} memantau status '{title}' ({subject}). Pasti beres!",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Ayo kerjakan sekarang!",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Jangan ditunda lagi ya.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Waktu terus berjalan.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Buktikan kemampuanmu!",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Segera kumpulkan ke {teacher}.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Semangat!",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Biar tidak panik di akhir.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Amankan nilaimu.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Fokus 15 menit saja.",
    "Waspada senyap: nilai {subject} untuk '{title}' menunggu keputusan. Pasti beres!",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Ayo kerjakan sekarang!",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Jangan ditunda lagi ya.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Waktu terus berjalan.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Buktikan kemampuanmu!",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Segera kumpulkan ke {teacher}.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Semangat!",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Biar tidak panik di akhir.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Amankan nilaimu.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Fokus 15 menit saja.",
    "Catatan rahasia {teacher}: '{title}' belum menunjukkan pergerakan. Pasti beres!",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Ayo kerjakan sekarang!",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Jangan ditunda lagi ya.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Waktu terus berjalan.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Buktikan kemampuanmu!",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Segera kumpulkan ke {teacher}.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Semangat!",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Biar tidak panik di akhir.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Amankan nilaimu.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Fokus 15 menit saja.",
    "Pembaruan sunyi dari sistem: tugas '{title}' ({subject}) mendekati deadline. Pasti beres!",
  ],
  motivator: [
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Ayo kerjakan sekarang!",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Jangan ditunda lagi ya.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Waktu terus berjalan.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Buktikan kemampuanmu!",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Segera kumpulkan ke {teacher}.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Semangat!",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Biar tidak panik di akhir.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Amankan nilaimu.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Fokus 15 menit saja.",
    "🏆 Bangkitlah! '{title}' ({subject}) adalah batu loncatan kesuksesanmu dari {teacher}. Pasti beres!",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Ayo kerjakan sekarang!",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Jangan ditunda lagi ya.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Waktu terus berjalan.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Buktikan kemampuanmu!",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Segera kumpulkan ke {teacher}.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Semangat!",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Biar tidak panik di akhir.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Amankan nilaimu.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Fokus 15 menit saja.",
    "Masa depanmu dibentuk dari ketuntasan '{title}' ({subject}). Semangat! Pasti beres!",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Ayo kerjakan sekarang!",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Jangan ditunda lagi ya.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Waktu terus berjalan.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Buktikan kemampuanmu!",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Segera kumpulkan ke {teacher}.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Semangat!",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Biar tidak panik di akhir.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Amankan nilaimu.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Fokus 15 menit saja.",
    "Tunjukkan mental juara pada tugas '{title}' ({subject}) bersama {teacher}! Pasti beres!",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Ayo kerjakan sekarang!",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Jangan ditunda lagi ya.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Waktu terus berjalan.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Buktikan kemampuanmu!",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Segera kumpulkan ke {teacher}.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Semangat!",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Biar tidak panik di akhir.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Amankan nilaimu.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Fokus 15 menit saja.",
    "Setiap hambatan di '{title}' ({subject}) bisa kamu taklukkan. Ayo bertindak! Pasti beres!",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Ayo kerjakan sekarang!",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Jangan ditunda lagi ya.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Waktu terus berjalan.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Buktikan kemampuanmu!",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Segera kumpulkan ke {teacher}.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Semangat!",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Biar tidak panik di akhir.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Amankan nilaimu.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Fokus 15 menit saja.",
    "Inspirasi dari {teacher}: taklukkan '{title}' ({subject}) hari ini juga! Pasti beres!",
  ],
  custom: [
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Ayo kerjakan sekarang!",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Jangan ditunda lagi ya.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Waktu terus berjalan.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Buktikan kemampuanmu!",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Segera kumpulkan ke {teacher}.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Semangat!",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Biar tidak panik di akhir.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Amankan nilaimu.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Fokus 15 menit saja.",
    "📣 Pesan khusus {teacher}: '{customText}' untuk tugas '{title}' ({subject}). Pasti beres!",
    "Ingat pesan personalmu: '{customText}' ({title}). Ayo kerjakan sekarang!",
    "Ingat pesan personalmu: '{customText}' ({title}). Jangan ditunda lagi ya.",
    "Ingat pesan personalmu: '{customText}' ({title}). Waktu terus berjalan.",
    "Ingat pesan personalmu: '{customText}' ({title}). Buktikan kemampuanmu!",
    "Ingat pesan personalmu: '{customText}' ({title}). Segera kumpulkan ke {teacher}.",
    "Ingat pesan personalmu: '{customText}' ({title}). Semangat!",
    "Ingat pesan personalmu: '{customText}' ({title}). Biar tidak panik di akhir.",
    "Ingat pesan personalmu: '{customText}' ({title}). Amankan nilaimu.",
    "Ingat pesan personalmu: '{customText}' ({title}). Fokus 15 menit saja.",
    "Ingat pesan personalmu: '{customText}' ({title}). Pasti beres!",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Ayo kerjakan sekarang!",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Jangan ditunda lagi ya.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Waktu terus berjalan.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Buktikan kemampuanmu!",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Segera kumpulkan ke {teacher}.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Semangat!",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Biar tidak panik di akhir.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Amankan nilaimu.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Fokus 15 menit saja.",
    "Instruksi khas {teacher}: '{customText}' - segera kerjakan '{title}'. Pasti beres!",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Ayo kerjakan sekarang!",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Jangan ditunda lagi ya.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Waktu terus berjalan.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Buktikan kemampuanmu!",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Segera kumpulkan ke {teacher}.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Semangat!",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Biar tidak panik di akhir.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Amankan nilaimu.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Fokus 15 menit saja.",
    "Catatan penting: '{customText}' (Tugas: '{title}'). Pasti beres!",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Ayo kerjakan sekarang!",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Jangan ditunda lagi ya.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Waktu terus berjalan.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Buktikan kemampuanmu!",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Segera kumpulkan ke {teacher}.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Semangat!",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Biar tidak panik di akhir.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Amankan nilaimu.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Fokus 15 menit saja.",
    "Pesan yang kamu buat: '{customText}' pada mapel {subject}. Pasti beres!",
  ],
};


function generateTerrorMessage(task) {
  const persona = task.persona || 'killer';
  const bank = extraTerrorBank[persona] || extraTerrorBank.killer;
  const message = bank[Math.floor(Math.random() * bank.length)];
  const customVal = (task.customText || '').trim() || ('Ayo segera selesaikan tugas ' + task.subject + ' tepat waktu!');
  return message
    .replace(/\{teacher\}/g, task.teacher || 'Guru')
    .replace(/\{title\}/g, task.title || 'tugasmu')
    .replace(/\{subject\}/g, task.subject || 'mata pelajaran')
    .replace(/\{customText\}/g, customVal);
}
function calculateSlack(task) {
  if (!task || !task.deadline) return 0;
  const deadlineTime = new Date(task.deadline).getTime();
  if (isNaN(deadlineTime)) return 0;
  const dur = parseFloat(task.duration) || 1;
  if (!task.dependsOn) {
    return Math.round(((deadlineTime - Date.now()) / 3600000 - dur) * 10) / 10;
  }
  const parent = tasks.find(function(t) { return t.id === task.dependsOn; });
  if (!parent || !parent.deadline) {
    return Math.round(((deadlineTime - Date.now()) / 3600000 - dur) * 10) / 10;
  }
  return Math.round(((deadlineTime - dur * 3600000 - new Date(parent.deadline).getTime()) / 3600000) * 10) / 10;
}

function getEffectiveWeight(task) {
  const base = parseInt(task && task.gradeWeight, 10) || 1;
  return (isExamMode && base >= 3) ? base * 2 : base;
}

function getGradeLabel(weight) {
  const w = parseInt(weight, 10) || 1;
  if (w === 4) return '🏆 Ujian Praktik / UKK (4x)';
  if (w === 3) return '📕 Project / PKL (3x)';
  if (w === 2) return '📙 Ulangan (2x)';
  return '📘 Tugas Harian (1x)';
}

function getDownstreamTasks(taskId) {
  const affected = [];
  const visited = {};
  visited[taskId] = true;
  function findChildren(parentId) {
    tasks.forEach(function(t) {
      if (t.status === 'active' && t.dependsOn === parentId && !visited[t.id]) {
        visited[t.id] = true;
        affected.push(t);
        findChildren(t.id);
      }
    });
  }
  findChildren(taskId);
  return affected;
}

function updateNotifStatusBadge() {
  const badge = document.getElementById('notifStatusBadge');
  if (!badge) return;
  if (!('Notification' in window)) {
    badge.textContent = '🔴 Browser Tidak Mendukung';
    badge.className = 'slack-pill slack-danger';
  } else if (Notification.permission === 'granted') {
    badge.textContent = '🟢 Notifikasi Pop-up Aktif';
    badge.className = 'slack-pill slack-safe';
  } else if (Notification.permission === 'denied') {
    badge.textContent = '🔴 Diblokir Browser';
    badge.className = 'slack-pill slack-danger';
  } else {
    badge.textContent = '🟡 Belum Diizinkan';
    badge.className = 'slack-pill';
  }
}

function showScreenPopup(task) {
  const banner = document.getElementById('popupTerrorBanner');
  if (!banner) return;
  document.getElementById('popupTeacherTag').textContent = task.teacher + ' • ' + task.subject;
  document.getElementById('popupTaskTitle').textContent = task.title;
  document.getElementById('popupTerrorText').textContent = generateTerrorMessage(task);
  banner.classList.remove('hidden');
}

window.triggerTestPopup = function(taskId) {
  const task = tasks.find(function(t) { return t.id === taskId; });
  if (task) triggerNotifications(task);
};

function syncTasksToServiceWorker() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const activeSummary = tasks.filter(function(t) { return t.status === 'active'; }).map(function(t) {
      return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        teacher: t.teacher,
        workSchedule: t.workSchedule,
        deadline: t.deadline,
        status: t.status,
        sampleMessage: generateTerrorMessage(t)
      };
    });
    navigator.serviceWorker.controller.postMessage({
      type: 'DOMIFECT_SYNC_TASKS',
      tasks: activeSummary,
      permission: ('Notification' in window) ? Notification.permission : 'default'
    });
  }
}

function getDynamicIntervalMs(diffHours) {
  if (diffHours <= 2) {
    return 30 * 1000; // Mendekati deadline (<= 2 jam): muncul tiap 30 detik
  } else {
    return 60 * 1000; // Masih lama (> 2 jam): muncul tiap 1 menit
  }
}

function triggerNotifications(task) {
  showScreenPopup(task);
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const targetTime = task.workSchedule ? new Date(task.workSchedule).getTime() : new Date(task.deadline).getTime();
  const diffHours = (targetTime - Date.now()) / 3600000;
  const intervalMs = getDynamicIntervalMs(diffHours);
  const dynamicBucket = Math.floor(Date.now() / intervalMs);
  const windowKey = String(task.id) + ':' + dynamicBucket;
  if (notifiedTaskWindows.has(windowKey)) return;
  notifiedTaskWindows.add(windowKey);
  if (notifiedTaskWindows.size > 200) {
    const first = notifiedTaskWindows.values().next().value;
    notifiedTaskWindows.delete(first);
  }
  const urgencyLabel = diffHours <= 2 ? '🚨 KRITIS (30s)' : '⏰ PENGINGAT (1m)';
  const title = urgencyLabel + ' DOMIFECT: ' + task.teacher.toUpperCase() + ' (' + task.subject + ')';
  const body = generateTerrorMessage(task);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.showNotification(title, {
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: 'task-' + task.id + '-' + dynamicBucket,
        renotify: true,
        vibrate: diffHours <= 2 ? [300, 100, 300] : [200, 100, 200],
        data: { url: './index.html' }
      });
    }).catch(function() {});
  } else {
    try { new Notification(title, { body: body }); } catch (e) {}
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Browser ini belum mendukung notifikasi.'); return; }
  if (!window.isSecureContext) { showToast('Notifikasi memerlukan HTTPS. Buka DOMIFECT dari GitHub Pages.'); return; }
  Notification.requestPermission().then(function(p) {
    updateNotifStatusBadge();
    syncTasksToServiceWorker();
    showToast(p === 'granted' ? '✅ Izin notifikasi aktif (kritis: 30s, normal: 1m).' : '⚠️ Izin notifikasi belum diberikan');
  }).catch(function() { showToast('Tidak dapat meminta izin notifikasi.'); });
}

function checkDueTasksAndNotify() {
  const now = Date.now();
  tasks.forEach(function(t) {
    if (t.status === 'active') {
      const targetTime = t.workSchedule ? new Date(t.workSchedule).getTime() : new Date(t.deadline).getTime();
      const diffHours = (targetTime - now) / 3600000;
      if (diffHours > -24) {
        triggerNotifications(t);
      }
    }
  });
  syncTasksToServiceWorker();
}

function startWatchdog() {
  checkDueTasksAndNotify();
  setInterval(checkDueTasksAndNotify, 30000); // detak watchdog tiap 30 detik agar sigap
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkDueTasksAndNotify();
    } else {
      syncTasksToServiceWorker();
    }
  });
}

function triggerPanicMode() {
  const active = tasks.filter(function(t) { return t.status === 'active'; });
  const panicBox = document.getElementById('panicBox');
  const panicContent = document.getElementById('panicContent');
  if (!panicBox || !panicContent) return;

  if (active.length === 0) {
    panicBox.classList.remove('hidden');
    panicContent.innerHTML = '<p class="hint">Tidak ada tugas aktif saat ini. Jadwalmu aman terkendali!</p>';
    lastPanicTextWA = 'Jadwal DOMIFECT aman terkendali!';
    return;
  }

  const sorted = active.slice().sort(function(a, b) {
    return (calculateSlack(a) / getEffectiveWeight(a)) - (calculateSlack(b) / getEffectiveWeight(b));
  });
  let planHtml = '<ol style="padding-left:20px; display:flex; flex-direction:column; gap:10px;">';
  const waLines = ['🚨 *RENCANA DARURAT KILAT DOMIFECT* 🚨', ''];

  sorted.forEach(function(t, idx) {
    const slack = calculateSlack(t);
    const mins = Math.round((parseFloat(t.duration) || 1) * 60);
    const statusText = slack <= 0 ? 'KRITIS — KERJAKAN SEKARANG!' : 'Sisa cadangan ' + slack + ' jam';
    planHtml += '<li><strong>[Langkah ' + (idx + 1) + '] ' + t.title + ' (' + t.subject + ' - ' + t.teacher + ')</strong><br/><small>' + getGradeLabel(t.gradeWeight) + ' • Alokasi: <strong>' + mins + ' menit</strong> • <span style="color:var(--danger);">' + statusText + '</span></small></li>';
    waLines.push((idx + 1) + '. *' + t.title + '* (' + t.subject + ') | ' + mins + ' menit | ' + statusText);
  });
  planHtml += '</ol>';
  lastPanicTextWA = waLines.join('\n');
  panicBox.classList.remove('hidden');
  panicContent.innerHTML = planHtml;
  showToast('🚨 Rencana Darurat Kilat disusun!');
}

window.focusOnTask = function(taskId) {
  const t = tasks.find(function(item) { return item.id === taskId; });
  const targetLabel = document.getElementById('focusTaskTargetLabel');
  if (targetLabel && t) targetLabel.textContent = '🎯 Sedang Fokus: "' + t.title + '" (' + t.subject + ')';
  const mins = t ? Math.min(180, Math.max(5, Math.round((parseFloat(t.duration) || 1) * 60))) : 25;
  navigateTo('focus');
  startCustomFocus(mins);
};

function startCustomFocus(minutes) {
  clearInterval(focusTimerInterval);
  const inputEl = document.getElementById('customTimerInput');
  if (inputEl) inputEl.value = minutes;
  focusSecondsRemaining = minutes * 60;
  updateTimerDisplay();
  isFocusRunning = true;
  focusTimerInterval = setInterval(function() {
    if (focusSecondsRemaining > 0) {
      focusSecondsRemaining--;
      updateTimerDisplay();
    } else {
      clearInterval(focusTimerInterval);
      isFocusRunning = false;
      alert('⏱️ Waktu sesi fokus selesai!');
    }
  }, 1000);
}

function handleStartTimer() {
  if (!isFocusRunning) {
    const inputVal = document.getElementById('customTimerInput') ? document.getElementById('customTimerInput').value : 25;
    const mins = Math.max(1, Math.min(180, parseInt(inputVal, 10) || 25));
    if (focusSecondsRemaining <= 0) focusSecondsRemaining = mins * 60;
    isFocusRunning = true;
    showToast('▶️ Timer fokus berjalan!');
    focusTimerInterval = setInterval(function() {
      if (focusSecondsRemaining > 0) {
        focusSecondsRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(focusTimerInterval);
        isFocusRunning = false;
        alert('⏱️ Waktu sesi fokus selesai!');
      }
    }, 1000);
  }
}

function updateTimerDisplay() {
  const m = Math.floor(focusSecondsRemaining / 60);
  const s = focusSecondsRemaining % 60;
  const disp = document.getElementById('timerDisplay');
  if (disp) disp.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function resetTaskForm() {
  const form = document.getElementById('taskForm');
  if (form) form.reset();
  const editId = document.getElementById('editTaskId');
  if (editId) editId.value = '';
  const formTitle = document.getElementById('formModeTitle');
  if (formTitle) formTitle.textContent = '➕ Buat Tugas & Karakter Guru';
  const btnSub = document.getElementById('btnSubmitTask');
  if (btnSub) btnSub.textContent = '💾 Simpan Tugas & Aktifkan Teror';
  const btnCancel = document.getElementById('btnCancelEdit');
  if (btnCancel) btnCancel.classList.add('hidden');
  const custGroup = document.getElementById('customPersonaGroup');
  if (custGroup) custGroup.classList.add('hidden');
  setDefaultTaskDates();
}

function renderAll() {
  renderDropdowns();
  renderDashboard();
  renderAssignments();
  renderSimulator();
  renderScheduleAndGear();
  renderAlerts();
  renderStats();
}

function renderDropdowns() {
  const active = tasks.filter(function(t) { return t.status === 'active'; });
  const dep = document.getElementById('tDependsOn');
  const sim = document.getElementById('simTaskSelect');
  const nego = document.getElementById('negoTaskSelect');
  const quickSch = document.getElementById('tQuickSchedule');

  if (dep) {
    const prev = dep.value;
    dep.innerHTML = '<option value="">-- Tugas Mandiri --</option>' + active.map(function(t) {
      return '<option value="' + t.id + '">' + t.title + ' (' + t.subject + ')</option>';
    }).join('');
    if (prev) dep.value = prev;
  }
  if (sim) {
    const prev = sim.value;
    sim.innerHTML = active.length ? active.map(function(t) {
      return '<option value="' + t.id + '">' + t.title + ' — ' + t.teacher + '</option>';
    }).join('') : '<option value="">-- Belum ada tugas --</option>';
    if (prev && active.some(function(t) { return t.id === prev; })) sim.value = prev;
  }
  if (nego) {
    const prev = nego.value;
    nego.innerHTML = active.length ? active.map(function(t) {
      return '<option value="' + t.id + '">' + t.title + ' (' + t.teacher + ')</option>';
    }).join('') : '<option value="">-- Belum ada tugas --</option>';
    if (prev && active.some(function(t) { return t.id === prev; })) nego.value = prev;
  }
  if (quickSch) {
    quickSch.innerHTML = '<option value="">-- Pilih Mapel dari Jadwal Tersimpan --</option>' + sortSchedulesByDay(schedules).map(function(s) {
      return '<option value="' + s.id + '">[' + s.day + '] ' + s.subject + ' — ' + s.teacher + '</option>';
    }).join('');
  }
}

function renderDashboard() {
  const active = tasks.filter(function(t) { return t.status === 'active'; });
  const navCount = document.getElementById('navTaskCount');
  if (navCount) navCount.textContent = active.length;
  const streakEl = document.getElementById('streakBadge');
  if (streakEl) streakEl.textContent = '🔥 Streak: ' + stats.streak + ' Tepat Waktu';

  const critical = active.filter(function(t) { return calculateSlack(t) <= 0; });
  const totalWorkHours = active.reduce(function(sum, t) { return sum + (parseFloat(t.duration) || 0); }, 0);
  const mentalLoadPercent = Math.min(100, Math.round((totalWorkHours / ((userProfile.targetHours || 3) * 2)) * 100));
  const greeting = userProfile.name ? 'Halo, ' + userProfile.name + '! ' : '';

  const scoreEl = document.getElementById('stabilityScore');
  const descEl = document.getElementById('stabilityDesc');
  if (scoreEl && descEl) {
    if (active.length === 0) {
      scoreEl.textContent = '100% — Jadwal Stabil | Beban Mental: 0%';
      descEl.textContent = greeting + 'Belum ada tugas terdaftar. Tekan "+ Tugas" untuk mulai mengatur jadwal.';
    } else if (critical.length > 0) {
      scoreEl.textContent = '⚠️ Jalur Kritis (' + critical.length + ' Tugas) | Beban Mental: ' + mentalLoadPercent + '%';
      descEl.textContent = greeting + 'Waspada efek domino! Gunakan Panic Button untuk urutan penyelamatan nilai.';
    } else {
      scoreEl.textContent = '✅ Jadwal Aman | Beban Mental: ' + mentalLoadPercent + '%';
      descEl.textContent = greeting + 'Total estimasi kerja: ' + totalWorkHours + ' jam.';
    }
  }

  const tomorrowBox = document.getElementById('tomorrowGearAlert');
  if (tomorrowBox) {
    const tomorrowIdx = (new Date().getDay() + 1) % 7;
    const tomorrowName = DAY_NAMES_BY_INDEX[tomorrowIdx];
    const tomorrowSubjects = schedules.filter(function(s) { return s.day === tomorrowName; });
    const uncheckedGears = gears.filter(function(g) { return !g.checked; });
    if (tomorrowSubjects.length > 0 || uncheckedGears.length > 0) {
      tomorrowBox.classList.remove('hidden');
      document.getElementById('tomorrowDayLabel').textContent = tomorrowName;
      document.getElementById('tomorrowScheduleHint').textContent = tomorrowSubjects.length
        ? 'Jadwal ' + tomorrowName + ': ' + tomorrowSubjects.map(function(s) { return s.subject; }).join(', ')
        : 'Tidak ada jadwal kelas tercatat untuk hari ' + tomorrowName + '.';
      document.getElementById('tomorrowGearSummary').innerHTML = uncheckedGears.length
        ? '<small style="color:var(--warning);">Belum siap (' + uncheckedGears.length + '): ' + uncheckedGears.map(function(g) { return g.text; }).join(', ') + '</small>'
        : '<small style="color:var(--success);">✓ Semua perlengkapan besok sudah siap!</small>';
    } else {
      tomorrowBox.classList.add('hidden');
    }
  }

  const priorityList = document.getElementById('todayActionList');
  if (priorityList) {
    const sorted = active.slice().sort(function(a, b) {
      return (calculateSlack(a) / getEffectiveWeight(a)) - (calculateSlack(b) / getEffectiveWeight(b));
    });
    priorityList.innerHTML = sorted.slice(0, 5).map(function(t, i) {
      const slack = calculateSlack(t);
      return '<div class="alert-card ' + (slack <= 0 ? 'urgent' : '') + '" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
        '<div><strong>#' + (i + 1) + ' ' + t.title + ' (' + t.subject + ')</strong><p class="hint">' + getGradeLabel(t.gradeWeight) + ' • Slack: ' + slack + ' jam</p></div>' +
        '<button type="button" class="btn btn-sm btn-primary" onclick="focusOnTask(\'' + t.id + '\')">⏱️ Fokus</button>' +
      '</div>';
    }).join('') || '<p class="hint">Belum ada daftar prioritas tugas.</p>';
  }
}

function renderAssignments() {
  const active = tasks.filter(function(t) { return t.status === 'active'; });
  const totalLabel = document.getElementById('totalTasksLabel');
  const archLabel = document.getElementById('archiveCountLabel');
  if (totalLabel) totalLabel.textContent = active.length;
  if (archLabel) archLabel.textContent = archivedTasks.length;
  const container = document.getElementById('assignmentsList');
  if (!container) return;

  if (currentTaskFilter === 'archive') {
    container.innerHTML = archivedTasks.map(function(t) {
      return '<div class="task-item" style="opacity:0.85;">' +
        '<div style="display:flex; justify-content:space-between;"><span class="subject-pill">' + t.subject + '</span><span class="slack-pill slack-safe">✓ Selesai</span></div>' +
        '<h4>' + t.title + '</h4>' +
        '<small class="hint">Guru: ' + t.teacher + ' • Selesai: ' + (t.completedAt || '-') + '</small>' +
        '<div style="display:flex; gap:6px; margin-top:8px;">' +
          '<button type="button" class="btn btn-sm btn-secondary" style="flex:1;" onclick="restoreArchivedTask(\'' + t.id + '\')">↩️ Aktifkan Lagi</button>' +
          '<button type="button" class="btn btn-sm btn-danger" onclick="deleteArchivedTask(\'' + t.id + '\')">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join('') || '<p class="hint">Belum ada riwayat tugas selesai.</p>';
    return;
  }

  let filtered = active;
  if (currentTaskFilter === 'critical') {
    filtered = active.filter(function(t) { return calculateSlack(t) <= 0; });
  } else if (currentTaskFilter === 'today') {
    const todayStr = new Date().toISOString().slice(0, 10);
    filtered = active.filter(function(t) { return (t.deadline || '').indexOf(todayStr) === 0; });
  }

  container.innerHTML = filtered.map(function(t) {
    const slack = calculateSlack(t);
    const parent = t.dependsOn ? tasks.find(function(p) { return p.id === t.dependsOn; }) : null;
    const subs = Array.isArray(t.subTasks) ? t.subTasks : [];
    const doneCount = subs.filter(function(s) { return s.done; }).length;
    const pct = subs.length ? Math.round((doneCount / subs.length) * 100) : 0;

    const subHtml = subs.length ? (
      '<div class="progress-wrap"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="margin-bottom:4px;">' +
        subs.map(function(st, sIdx) {
          return '<label class="subtask-row ' + (st.done ? 'done' : '') + '">' +
            '<input type="checkbox" ' + (st.done ? 'checked' : '') + ' onchange="toggleSubTask(\'' + t.id + '\', ' + sIdx + ')" />' +
            '<span>' + st.text + '</span>' +
          '</label>';
        }).join('') +
      '</div>'
    ) : '';

    return '<div class="task-item">' +
      '<div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:4px;">' +
        '<span class="subject-pill">' + t.subject + '</span>' +
        '<span class="grade-pill">' + getGradeLabel(t.gradeWeight) + '</span>' +
        '<span class="slack-pill ' + (slack <= 0 ? 'slack-danger' : 'slack-safe') + '">Slack: ' + slack + 'j</span>' +
      '</div>' +
      '<h4>' + t.title + '</h4>' +
      '<small class="hint">Guru: ' + t.teacher + '</small>' +
      '<small class="hint">Deadline: ' + (t.deadline || '').replace('T', ' ') + '</small>' +
      (parent ? '<small class="hint">⛓️ Bergantung pada: ' + parent.title + '</small>' : '') +
      (t.groupMembers ? '<small class="hint">👥 Kelompok: ' + t.groupMembers + '</small>' : '') +
      subHtml +
      '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">' +
        '<button type="button" class="btn btn-sm btn-primary" style="flex:1;" onclick="completeTask(\'' + t.id + '\')">✓ Selesai</button>' +
        '<button type="button" class="btn btn-sm btn-warning" onclick="focusOnTask(\'' + t.id + '\')">⏱️</button>' +
        '<button type="button" class="btn btn-sm btn-secondary" onclick="editTask(\'' + t.id + '\')">✏️</button>' +
        '<button type="button" class="btn btn-sm btn-danger" onclick="deleteTask(\'' + t.id + '\')">🗑️</button>' +
      '</div>' +
    '</div>';
  }).join('') || '<p class="hint">Tidak ada tugas pada kategori ini.</p>';
}

window.toggleSubTask = function(taskId, subIdx) {
  const t = tasks.find(function(item) { return item.id === taskId; });
  if (t && Array.isArray(t.subTasks) && t.subTasks[subIdx]) {
    t.subTasks[subIdx].done = !t.subTasks[subIdx].done;
    saveTasks();
    renderAssignments();
  }
};

window.editTask = function(id) {
  const t = tasks.find(function(item) { return item.id === id; });
  if (!t) return;
  navigateTo('create-task');
  document.getElementById('editTaskId').value = t.id;
  document.getElementById('tTitle').value = t.title;
  document.getElementById('tSubject').value = t.subject;
  document.getElementById('tTeacher').value = t.teacher;
  document.getElementById('tGradeWeight').value = t.gradeWeight || '1';
  document.getElementById('tPersona').value = t.persona || 'killer';
  window.uiOnPersonaChange(t.persona || 'killer');
  document.getElementById('tCustomText').value = t.customText || '';
  document.getElementById('tWorkSchedule').value = t.workSchedule || '';
  document.getElementById('tDeadline').value = t.deadline || '';
  document.getElementById('tDuration').value = t.duration || 2;
  document.getElementById('tDependsOn').value = t.dependsOn || '';
  document.getElementById('tSubTasks').value = Array.isArray(t.subTasks) ? t.subTasks.map(function(s) { return s.text; }).join(', ') : '';
  document.getElementById('tGroupMembers').value = t.groupMembers || '';
  document.getElementById('formModeTitle').textContent = '✏️ Edit Tugas';
  document.getElementById('btnSubmitTask').textContent = '💾 Simpan Perubahan';
  document.getElementById('btnCancelEdit').classList.remove('hidden');
};

window.completeTask = function(id) {
  const t = tasks.find(function(item) { return item.id === id; });
  if (t) {
    if (Date.now() > new Date(t.deadline).getTime()) {
      stats.late++;
      stats.streak = 0;
    } else {
      stats.onTime++;
      stats.streak++;
    }
    saveStats();
    archivedTasks.unshift(Object.assign({}, t, { status: 'completed', completedAt: new Date().toLocaleString('id-ID') }));
    saveArchive();
  }
  tasks = tasks.filter(function(item) { return item.id !== id; });
  saveTasks();
  renderAll();
  showToast('🎉 Tugas selesai!');
};

window.restoreArchivedTask = function(id) {
  const t = archivedTasks.find(function(item) { return item.id === id; });
  if (t) {
    tasks.push(Object.assign({}, t, { status: 'active' }));
    archivedTasks = archivedTasks.filter(function(item) { return item.id !== id; });
    saveTasks();
    saveArchive();
    renderAll();
  }
};
window.deleteArchivedTask = function(id) {
  archivedTasks = archivedTasks.filter(function(item) { return item.id !== id; });
  saveArchive();
  renderAll();
};
window.deleteTask = function(id) {
  tasks = tasks.filter(function(item) { return item.id !== id; });
  saveTasks();
  renderAll();
  showToast('🗑️ Tugas dihapus');
};

window.renderSimulator = function() {
  const simSelect = document.getElementById('simTaskSelect');
  const simSlider = document.getElementById('simDelaySlider');
  const delayLabel = document.getElementById('simDelayLabel');
  const box = document.getElementById('simConclusionBox');
  if (!box) return;

  const id = simSelect ? simSelect.value : '';
  const delay = simSlider ? (parseInt(simSlider.value, 10) || 0) : 0;
  if (delayLabel) delayLabel.textContent = '+' + delay + ' Jam';

  const selectedTask = tasks.find(function(t) { return t.id === id; });
  if (!selectedTask) {
    box.innerHTML = '<p class="hint">Tambahkan tugas terlebih dahulu untuk menjalankan simulasi domino.</p>';
    return;
  }

  const downstream = getDownstreamTasks(id);
  const slack = calculateSlack(selectedTask);
  const over = Math.round((delay - slack) * 10) / 10;

  if (delay === 0) {
    box.innerHTML = '<div class="alert-card">✅ <strong>Normal (+0 Jam):</strong> "' + selectedTask.title + '" aman dengan sisa cadangan ' + slack + ' jam.</div>';
    return;
  }

  let html = over > 0
    ? '<div class="alert-card urgent">⚠️ <strong>Melewati Deadline:</strong> Menunda +' + delay + ' jam membuat "' + selectedTask.title + '" telat ' + over + ' jam!<p class="alert-msg">"' + generateTerrorMessage(selectedTask) + '"</p></div>'
    : '<div class="alert-card">⏳ <strong>Cadangan Menipis:</strong> Sisa waktu aman tinggal ' + (Math.round((slack - delay) * 10) / 10) + ' jam.</div>';

  if (downstream.length > 0) {
    html += '<div class="alert-card urgent" style="margin-top:10px;">🚨 <strong>EFEK DOMINO (' + downstream.length + ' Tugas Terdampak):</strong><ul style="padding-left:18px; margin-top:6px;">' +
      downstream.map(function(d) { return '<li>' + d.title + ' (' + d.subject + ')</li>'; }).join('') +
      '</ul></div>';
  }
  box.innerHTML = html;
};

function renderScheduleAndGear() {
  const schList = document.getElementById('scheduleList');
  if (schList) {
    const sortedSch = sortSchedulesByDay(schedules);
    schList.innerHTML = sortedSch.length === 0 ? '<p class="hint">Belum ada jadwal tersimpan.</p>' : DAYS_LIST.map(function(day) {
      const items = sortedSch.filter(function(s) { return s.day === day; });
      if (!items.length) return '';
      return '<div style="margin-bottom:10px;"><strong style="color:var(--primary); font-size:0.82rem;">📌 ' + day + '</strong>' +
        items.map(function(s) {
          return '<div class="alert-card" style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;"><div><strong>' + s.subject + '</strong><p class="hint">' + s.teacher + '</p></div><button type="button" class="btn btn-sm btn-danger" onclick="deleteSchedule(\'' + s.id + '\')">✕</button></div>';
        }).join('') +
      '</div>';
    }).join('');
  }

  const gearList = document.getElementById('gearList');
  if (gearList) {
    gearList.innerHTML = gears.map(function(g) {
      return '<div class="alert-card" style="display:flex; justify-content:space-between; align-items:center;">' +
        '<label class="subtask-row ' + (g.checked ? 'done' : '') + '" style="flex:1;"><input type="checkbox" ' + (g.checked ? 'checked' : '') + ' onchange="toggleGear(\'' + g.id + '\')" /><span>' + g.text + '</span></label>' +
        '<button type="button" class="btn btn-sm btn-danger" onclick="deleteGear(\'' + g.id + '\')">✕</button>' +
      '</div>';
    }).join('') || '<p class="hint">Belum ada daftar perlengkapan.</p>';
  }
}

window.deleteSchedule = function(id) { schedules = schedules.filter(function(s) { return s.id !== id; }); saveSchedules(); renderAll(); };
window.toggleGear = function(id) { const g = gears.find(function(item) { return item.id === id; }); if (g) { g.checked = !g.checked; saveGears(); renderAll(); } };
window.deleteGear = function(id) { gears = gears.filter(function(g) { return g.id !== id; }); saveGears(); renderAll(); };

function renderAlerts() {
  const active = tasks.filter(function(t) { return t.status === 'active'; });
  const badge = document.getElementById('alertCountBadge');
  if (badge) badge.textContent = active.length;
  updateNotifStatusBadge();
  const listEl = document.getElementById('fullAlertsList');
  if (listEl) {
    listEl.innerHTML = active.map(function(t) {
      return '<div class="alert-card">' +
        '<strong>🚨 ' + t.teacher + ' (' + t.subject + ') — ' + t.title + '</strong>' +
        '<p class="alert-msg">' + generateTerrorMessage(t) + '</p>' +
        '<button type="button" class="btn btn-sm btn-warning btn-block" onclick="triggerTestPopup(\'' + t.id + '\')" style="margin-top:8px;">🔔 Tes Pop-up Teror Guru</button>' +
      '</div>';
    }).join('') || '<p class="hint">Belum ada teror aktif.</p>';
  }
}

function renderStats() {
  const onTimeEl = document.getElementById('statOnTime');
  const lateEl = document.getElementById('statLate');
  const streakEl = document.getElementById('statStreak');
  if (onTimeEl) onTimeEl.textContent = stats.onTime || 0;
  if (lateEl) lateEl.textContent = stats.late || 0;
  if (streakEl) streakEl.textContent = (stats.streak || 0) + ' 🔥';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
