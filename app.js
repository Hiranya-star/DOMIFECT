// ==========================================
// 1. BANK KALIMAT TEROR DINAMIS (8 KARAKTER x 3 LEVEL)
// ==========================================
const TERROR_POOL = {
  killer: {
    name: "🔥 Guru Tegas / Killer",
    level1: [
      "Jadwal tugas {task} sudah dimulai. Jangan tunggu sampai nama kamu saya tandai merah.",
      "Waktu pengerjaan {task} berjalan. Saya tidak menerima alasan jaringan atau lupa.",
      "Kerjakan {task} sekarang. Disiplin waktu adalah syarat mutlak di kelas saya.",
      "Ingat, {task} punya tenggat waktu ketat. Mulai sekarang atau terima konsekuensinya."
    ],
    level2: [
      "Sudah lewat setengah waktu dan {task} belum selesai? Kamu menguji kesabaran saya.",
      "Teman-temanmu sudah mencicil {task}, kamu masih santai? Jangan harap ada keringanan.",
      "Nilai kosong di kolom {task} sudah siap saya ketik kalau kamu masih menunda.",
      "Saya catat progresmu masih nol untuk {task}. Jangan menyesal saat pembagian rapor."
    ],
    level3: [
      "DARURAT! Deadline {task} di depan mata! Telat satu menit, nilai otomatis NOL tanpa remidi!",
      "WAKTU HABIS! Kumpulkan {task} SEKARANG atau siap-siap mengulang semester depan!",
      "PERINGATAN TERAKHIR untuk {task}! Jangan berani menghadap saya tanpa tugas ini selesai!"
    ]
  },
  sarkas: {
    name: "😏 Guru Sarkas / Sindiran Halus",
    level1: [
      "Santai aja ngerjain {task}, kan masa depan juga masih lama, ya kan?",
      "Wah, sibuk banget kayaknya sampai jadwal {task} cuma dilihatin doang.",
      "Hebat ya, {task} belum disentuh tapi percaya dirinya udah setinggi langit.",
      "Silakan lanjut scroll medsosnya, biar {task} ngerjain dirinya sendiri."
    ],
    level2: [
      "Luar biasa, konsisten banget menunda {task}. Bakat terpendam nih kayaknya.",
      "Nanti pas nilai {task} keluar, jangan kaget ya. Anggap aja kejutan.",
      "Katanya mau sukses, tapi ngalahin rasa malas buat {task} aja kalah telak.",
      "Tenang, {task} nggak bakal lari kok. Cuma nilaimu aja yang lari menjauh."
    ],
    level3: [
      "Selamat! Kamu resmi jadi kandidat terkuat peraih nilai terendah di {task}. Tepuk tangan!",
      "Detik-detik terakhir {task}! Ayo tunjukkan jurus SKS (Sistem Kebut Sekarat)-mu!",
      "Deadline {task} mepet banget nih. Mau nyerah sekarang atau panik maksimal?"
    ]
  },
  disiplin: {
    name: "⏰ Guru Disiplin / Perfeksionis",
    level1: [
      "Tepat pukul ini, jadwal {task} dimulai. Keterlambatan 1 menit merusak struktur waktumu.",
      "Alokasi waktu {task} telah aktif. Pastikan format, margin, dan sistematika sesuai standar.",
      "Mulai {task} detik ini. Efisiensi adalah kunci ketepatan hasil akhir.",
      "Jadwal tidak pernah menunggu. Eksekusi {task} sesuai timeline yang kamu buat."
    ],
    level2: [
      "Kamu sudah kehilangan cadangan waktu (Slack Time) untuk {task}. Segera kejar ketertinggalan.",
      "Deviasi waktu terdeteksi pada {task}. Risiko pekerjaan terburu-buru dan tidak rapi meningkat.",
      "Sisa waktu {task} menipis. Kualitas hasil kerjamu mulai terancam jika tidak dikerjakan sekarang.",
      "Evaluasi progresmu: {task} tertinggal dari jadwal ideal."
    ],
    level3: [
      "KRITIS! Toleransi waktu untuk {task} 0 menit! Selesaikan segera sebelum sistem terkunci!",
      "ALERT! Keterlambatan {task} akan merusak seluruh rantai jadwal tugas berikutnya!",
      "BATAS AKHIR {task}! Kerjakan sekarang dengan fokus 100%!"
    ]
  },
  ramah: {
    name: "🤝 Ramah tapi Menagih (Ala Duolingo)",
    level1: [
      "Hai! Burung hantu DOMINO cuma mau ngingetin, yuk mulai cicil {task} pelan-pelan 😊",
      "Semangat ya! Jadwal {task} sudah tiba nih, pasti bisa selesai tepat waktu!",
      "Jangan lupa sama {task} ya, kasihan lho tugasnya nungguin kamu dari tadi 🥺",
      "Yuk buka bukunya sebentar, 15 menit pertama buat {task} pasti ringan kok!"
    ],
    level2: [
      "Kok {task} masih belum dikerjain sih? Aku sedih lho ngelihatnya... 😢",
      "Kamu lupa ya sama {task}? Padahal aku udah nungguin kamu belajar hari ini...",
      "Jangan bikin {task} merasa diabaikan dong. Yuk kerjain sekarang, demi nilai bagusmu!",
      "Huhu, {task} masih kosong aja nih. Aku kecewa dikit, tapi masih percaya kamu mau ngerjain sekarang."
    ],
    level3: [
      "TOLONG! {task} hampir deadline! Jangan bikin semua usaha belajarmu sia-sia hari ini! 😭",
      "Waktunya tinggal dikit banget buat {task}! Ayo dong, aku mohon kerjain sekarang ya!",
      "Gawat! {task} udah di ujung tanduk! Yuk ngebut sekarang sebelum terlambat!"
    ]
  },
  bengkel: {
    name: "🔧 Instruktur Bengkel / Lab (Khas SMK)",
    level1: [
      "Perhatian! Masuk jam praktik/laporan {task}. Cek alat, ikuti SOP, dan mulai kerjakan!",
      "Jangan cuma nongkrong di area kerja! Segera garap {task} sebelum jam praktik habis.",
      "Laporan praktikum / proyek {task} sudah terjadwal. Ingat, nilai kompetensi ada di sini.",
      "Siapkan jobsheet dan mulai eksekusi {task}. Utamakan K3 dan ketelitian!"
    ],
    level2: [
      "Progres {task} masih macet? Kalau di dunia industri, telat begini sudah kena SP!",
      "Jangan sampai laporan {task} numpuk bareng jadwal PKL dan uji kompetensi!",
      "Alat dan bahan sudah siap tapi {task} belum jalan? Mau dapat status Belum Kompeten (BK)?",
      "Ingat, portofolio kejuruanmu dinilai dari ketepatan waktu menyelesaikan {task}."
    ],
    level3: [
      "BAHAYA! Uji kompetensi & deadline {task} sudah di depan mata! Selesaikan sekarang atau REMIDI PRAKTIK!",
      "STOP MAIN-MAIN! {task} harus beres detik ini juga kalau mau lulus verifikasi bengkel!",
      "DEADLINE BENGKEL! Kumpulkan {task} segera sebelum pintu lab/bengkel ditutup!"
    ]
  },
  misterius: {
    name: "👻 Misterius / Silent Killer",
    level1: [
      "...",
      "Saya melihat jadwal {task} kamu sudah dimulai. Saya hanya mengamati.",
      "Tidak banyak bicara. {task} sudah masuk waktu pengerjaan.",
      "Semua tercatat. Termasuk kapan kamu mulai mengerjakan {task}."
    ],
    level2: [
      "Saya tidak akan marah kalau {task} telat. Saya hanya langsung membiarkan kolom nilaimu kosong.",
      "Masih belum ada pergerakan di {task}. Menarik.",
      "Silakan lanjutkan kesibukanmu. Daftar kelulusan tugas {task} mudah sekali diedit.",
      "Diamnya saya bukan berarti {task} dibatalkan."
    ],
    level3: [
      "Waktu {task} hampir habis. Nama yang tidak mengumpulkan akan otomatis terhapus dari daftar.",
      "Penilaian {task} segera ditutup. Tidak ada peringatan kedua.",
      "Terlambat = Tidak terdaftar di {task}."
    ]
  },
  motivator: {
    name: "📢 Ceramah Panjang / Motivator",
    level1: [
      "Masa depanmu ditentukan oleh apa yang kamu kerjakan hari ini, termasuk mulai mengerjakan {task} sekarang!",
      "Orang sukses tidak menunggu mood datang untuk menyelesaikan {task}. Ayo bangkit!",
      "Bayangkan orang tuamu bangga saat melihatmu disiplin menyelesaikan {task} tepat waktu.",
      "Kemenangan kecil hari ini dimulai dari menaklukkan rasa malas pada {task}."
    ],
    level2: [
      "Bagaimana kamu mau bersaing di dunia kerja atau SNBP kalau tugas {task} saja masih kamu tunda?",
      "Setiap menit yang kamu buang sekarang adalah penyesalan saat melihat hasil {task} nanti.",
      "Rasa malas itu nyaman sementara, tapi akibat menunda {task} akan terasa sangat berat!",
      "Jangan jadi penonton kesuksesan temanmu. Ambil kendali dan selesaikan {task} sekarang!"
    ],
    level3: [
      "INI SAAT PENENTUAN! Tunjukkan mental pemenangmu, selesaikan {task} sebelum waktu habis!",
      "JANGAN MENYERAH DI GARIS FINISH! Kejar deadline {task} sekarang juga!",
      "Nasib nilai {task} ada di tanganmu detik ini! Bergerak sekarang atau tertinggal selamanya!"
    ]
  }
};

// ==========================================
// 2. STATE & STORAGE (LOCALSTORAGE BERSIH)
// ==========================================
let tasks = JSON.parse(localStorage.getItem('domino_tasks')) || [];
let profile = JSON.parse(localStorage.getItem('domino_profile')) || null;
let deferredPrompt = null;
let timerInterval = null;
let remainingSeconds = 25 * 60;

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

// Deteksi iOS untuk tombol panduan install
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const iosBtn = document.getElementById('iosInstallHintBtn');
if (isIOS && !window.navigator.standalone) {
  iosBtn.classList.remove('hidden');
  iosBtn.addEventListener('click', () => {
    alert('Cara install di iPhone/iPad:\n1. Ketuk ikon Bagikan (Share) di browser Safari.\n2. Pilih "Tambah ke Layar Utama" (Add to Home Screen).');
  });
}

// ==========================================
// 3. PWA INSTALL & NOTIFIKASI SISTEM
// ==========================================
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') installBtn.classList.add('hidden');
  deferredPrompt = null;
});

document.getElementById('notifPermBtn').addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('Browser ini tidak mendukung notifikasi sistem.');
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    showToast('🦉 Sistem Notifikasi Teror AKTIF! Siap meneror di luar aplikasi.');
  } else {
    alert('Izin notifikasi ditolak. Aktifkan di pengaturan browser agar teror muncul saat aplikasi ditutup.');
  }
});

function triggerTerrorNotification(task, level = 1) {
  let pool = [];
  if (task.persona === 'custom' && task.customQuote) {
    pool = [
      `[Level ${level}] ${task.customQuote} (Tugas: ${task.title})`,
      `Jangan lupa ${task.title}! Ingat kata gurumu: "${task.customQuote}"`,
      `DEADLINE ALERT (${task.title}): ${task.customQuote}`
    ];
  } else {
    const charObj = TERROR_POOL[task.persona] || TERROR_POOL.ramah;
    const key = `level${level}`;
    pool = charObj[key].map(txt => txt.replace('{task}', `"${task.title}"`));
  }

  const randomMsg = pool[Math.floor(Math.random() * pool.length)];
  const isSilent = document.getElementById('silentModeToggle').checked;

  showToast(randomMsg);
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(`🦉 DOMINO - Level ${level} Warning!`, {
        body: randomMsg,
        icon: './icon.png',
        badge: './icon.png',
        vibrate: [300, 100, 300],
        silent: isSilent,
        tag: `domino-${task.id}-lvl${level}`,
        renotify: true
      });
    });
  }
}

function showToast(msg) {
  const toast = document.getElementById('inAppToast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 6000);
}

// ==========================================
// 4. PROFIL SISWA (SMA / SMK)
// ==========================================
function renderProfile() {
  const display = document.getElementById('profileDisplay');
  if (!profile) return;
  display.innerHTML = `
    <p><strong>${profile.name}</strong> — ${profile.major}</p>
    <p class="subtext">🏫 ${profile.school} | 🎯 Target Belajar: <strong>${profile.target} Jam/Hari</strong></p>
  `;
}

document.getElementById('editProfileBtn').addEventListener('click', () => {
  document.getElementById('profileForm').classList.toggle('hidden');
});

document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  profile = {
    name: document.getElementById('pName').value,
    school: document.getElementById('pSchool').value,
    major: document.getElementById('pMajor').value,
    target: parseFloat(document.getElementById('pTarget').value)
  };
  localStorage.setItem('domino_profile', JSON.stringify(profile));
  document.getElementById('profileForm').classList.add('hidden');
  renderProfile();
  updateMetrics();
});

// ==========================================
// 5. MANAJEMEN TUGAS & SLACK TIME
// ==========================================
document.getElementById('tPersona').addEventListener('change', (e) => {
  const customInput = document.getElementById('tCustomQuote');
  customInput.classList.toggle('hidden', e.target.value !== 'custom');
});

document.getElementById('taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const newTask = {
    id: Date.now().toString(),
    title: document.getElementById('tTitle').value,
    subject: document.getElementById('tSubject').value,
    persona: document.getElementById('tPersona').value,
    customQuote: document.getElementById('tCustomQuote').value,
    start: document.getElementById('tStart').value,
    deadline: document.getElementById('tDeadline').value,
    duration: parseFloat(document.getElementById('tDuration').value),
    dependencyId: document.getElementById('tDependency').value,
    completed: false
  };

  tasks.push(newTask);
  saveAndRenderTasks();
  e.target.reset();
  document.getElementById('tCustomQuote').classList.add('hidden');
});

function calculateSlackHours(task) {
  const now = new Date();
  const start = new Date(task.start);
  const effectiveStart = now > start ? now : start;
  const deadline = new Date(task.deadline);
  const availableHours = (deadline - effectiveStart) / (1000 * 60 * 60);
  return +(availableHours - task.duration).toFixed(1);
}

function saveAndRenderTasks() {
  localStorage.setItem('domino_tasks', JSON.stringify(tasks));
  const list = document.getElementById('taskList');
  const depSelect = document.getElementById('tDependency');

  depSelect.innerHTML = '<option value="">-- Tidak Ada (Tugas Independen) --</option>';
  tasks.filter(t => !t.completed).forEach(t => {
    depSelect.innerHTML += `<option value="${t.id}">${t.title} (${t.subject})</option>`;
  });

  if (tasks.length === 0) {
    list.innerHTML = '<p class="empty-state">Belum ada tugas. Semua data tersimpan lokal di perangkatmu.</p>';
    updateMetrics();
    runDominoSimulation();
    return;
  }

  list.innerHTML = '';
  tasks.forEach(task => {
    const slack = calculateSlackHours(task);
    const parentTask = tasks.find(t => t.id === task.dependencyId);
    const isCritical = slack < 2 && !task.completed;

    const div = document.createElement('div');
    div.className = `task-item ${isCritical ? 'critical' : ''}`;
    div.innerHTML = `
      <div>
        <strong>${task.completed ? '✅ ' : ''}${task.title}</strong> <span class="badge">${task.subject}</span>
        <div class="task-meta">
          ⏳ Durasi: ${task.duration} jam | 🛡️ Slack Time: <strong>${slack} jam</strong> | 
          ${parentTask ? `🔗 Setelah: <em>${parentTask.title}</em>` : '🔗 Independen'}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm" onclick="testTerror('${task.id}', 1)">Lv.1</button>
        <button class="btn btn-sm" onclick="testTerror('${task.id}', 2)">Lv.2</button>
        <button class="btn btn-sm btn-danger" onclick="testTerror('${task.id}', 3)">Lv.3</button>
        <button class="btn btn-sm btn-primary" onclick="toggleComplete('${task.id}')">${task.completed ? 'Batal' : 'Selesai'}</button>
        <button class="btn btn-sm btn-secondary" onclick="deleteTask('${task.id}')">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  });

  updateMetrics();
  runDominoSimulation();
}

window.testTerror = (id, lvl) => {
  const t = tasks.find(x => x.id === id);
  if (t) triggerTerrorNotification(t, lvl);
};

window.toggleComplete = (id) => {
  const t = tasks.find(x => x.id === id);
  if (t) t.completed = !t.completed;
  saveAndRenderTasks();
};

window.deleteTask = (id) => {
  tasks = tasks.filter(x => x.id !== id);
  saveAndRenderTasks();
};

// ==========================================
// 6. SIMULATOR EFEK DOMINO BERJENJANG
// ==========================================
const delaySlider = document.getElementById('delaySlider');
delaySlider.addEventListener('input', runDominoSimulation);

function runDominoSimulation() {
  const delayHours = parseInt(delaySlider.value, 10);
  document.getElementById('delayValue').textContent = `+${delayHours} Jam`;
  const container = document.getElementById('dominoImpactList');
  const activeTasks = tasks.filter(t => !t.completed);

  if (activeTasks.length === 0) {
    container.innerHTML = '<p class="empty-state">Tambahkan minimal 1 tugas untuk menjalankan simulasi.</p>';
    return;
  }

  container.innerHTML = activeTasks.map(task => {
    let accumulatedDelay = delayHours;
    if (task.dependencyId) accumulatedDelay *= 1.3; // Efek rantai berlipat

    const simulatedSlack = +(calculateSlackHours(task) - accumulatedDelay).toFixed(1);
    let status = '🟢 Aman';
    if (simulatedSlack < 0) status = '🔴 JEBOL DEADLINE (Efek Domino Kritis!)';
    else if (simulatedSlack < 3) status = '🟡 Rawan Mepet';

    return `
      <div class="task-item ${simulatedSlack < 0 ? 'critical' : ''}">
        <span><strong>${task.title}</strong></span>
        <span>Sisa Cadangan: <strong>${simulatedSlack} jam</strong> — ${status}</span>
      </div>
    `;
  }).join('');
}

// ==========================================
// 7. SKOR BEBAN MENTAL & PANIC BUTTON
// ==========================================
function updateMetrics() {
  const activeTasks = tasks.filter(t => !t.completed);
  const totalHours = activeTasks.reduce((sum, t) => sum + t.duration, 0);
  const dailyTarget = profile ? profile.target : 4;
  
  const loadPercent = Math.min(100, Math.round((totalHours / (dailyTarget * 3)) * 100));
  const fill = document.getElementById('mentalLoadFill');
  fill.style.width = `${loadPercent}%`;
  fill.style.background = loadPercent > 75 ? 'var(--danger)' : loadPercent > 45 ? 'var(--warning)' : 'var(--success)';

  document.getElementById('mentalLoadPercent').textContent = `${loadPercent}% (${totalHours} Jam Tugas Aktif)`;
  document.getElementById('mentalLoadStatus').textContent =
    loadPercent > 75 ? '🔥 Risiko Burnout Tinggi!' : loadPercent > 45 ? '⚠️ Beban Menengah' : '✅ Mental Stabil';

  const criticalCount = activeTasks.filter(t => calculateSlackHours(t) < 2).length;
  const stability = activeTasks.length === 0 ? 100 : Math.max(0, Math.round(((activeTasks.length - criticalCount) / activeTasks.length) * 100));
  document.getElementById('stabilityIndex').textContent = `Indeks Stabilitas: ${stability}%`;
}

document.getElementById('panicBtn').addEventListener('click', () => {
  const box = document.getElementById('panicScheduleBox');
  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (activeTasks.length === 0) {
    box.innerHTML = '<strong>🎉 Tidak ada krisis!</strong> Semua tugasmu sudah beres.';
    box.classList.remove('hidden');
    return;
  }

  let cursor = new Date();
  let html = '<strong>🚨 JADWAL DARURAT MENIT-PER-MENIT (PRIORITAS DEADLINE):</strong><br><br>';
  activeTasks.forEach((t, idx) => {
    const startStr = cursor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    cursor = new Date(cursor.getTime() + t.duration * 60 * 60 * 1000);
    const endStr = cursor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    html += `${idx + 1}. <strong>[${startStr} - ${endStr}]</strong> Kerjakan <u>${t.title}</u> (${t.duration} jam)<br>`;
    cursor = new Date(cursor.getTime() + 10 * 60 * 1000);
  });

  box.innerHTML = html;
  box.classList.remove('hidden');
});

// ==========================================
// 8. MODE FOKUS & PENGAWASAN OTOMATIS
// ==========================================
function updateTimerDisplay() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

document.getElementById('startTimerBtn').addEventListener('click', () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      showToast('⏱️ Sesi Fokus Selesai! Cek progres tugasmu sekarang.');
    }
  }, 1000);
});

document.getElementById('resetTimerBtn').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  const mins = parseInt(document.getElementById('customMinutes').value, 10) || 25;
  remainingSeconds = mins * 60;
  updateTimerDisplay();
});

setInterval(() => {
  const now = new Date();
  tasks.filter(t => !t.completed).forEach(task => {
    const start = new Date(task.start);
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);

    if (hoursLeft <= 1 && hoursLeft > 0) {
      triggerTerrorNotification(task, 3);
    } else if (now > start && hoursLeft <= task.duration * 1.5) {
      triggerTerrorNotification(task, 2);
    } else if (Math.abs(now - start) < 60000) {
      triggerTerrorNotification(task, 1);
    }
  });
}, 60000);

document.getElementById('themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

renderProfile();
saveAndRenderTasks();
