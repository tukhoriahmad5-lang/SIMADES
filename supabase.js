// ============================================
// SIMADES — Supabase Client & Helper
// ============================================

// --- Konfigurasi Supabase ---
const SUPABASE_URL = 'https://jfnjqmitsjixwwiflxvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmpxbWl0c2ppeHd3aWZseHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzgzNDYsImV4cCI6MjEwODY1NDM0Nn0.6gHAXZpWIeNeRZps9nnQNf-vd4fmeOdSnzXvI40-qzo';

// Init client
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FORMATTER
// ============================================

/** Format angka ke Rupiah: 1500000 → "Rp 1.500.000" */
function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}

/** Format Rupiah singkat: 1500000 → "Rp 1,5jt" */
function formatRupiahSingkat(angka) {
  const n = Number(angka) || 0;
  if (n >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1_000_000)     return 'Rp ' + (n / 1_000_000).toFixed(1).replace('.', ',') + 'jt';
  if (n >= 1_000)         return 'Rp ' + (n / 1_000).toFixed(0) + 'rb';
  return 'Rp ' + n;
}

/** Format tanggal: "2025-03-15" → "15 Mar 2025" */
function formatTanggal(str) {
  if (!str) return '-';
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const d = new Date(str);
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format datetime: "2026-10-27T12:56:00Z" → "27 Okt 2026, 12:56" */
function formatTanggalWaktu(str) {
  if (!str) return '-';
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const d = new Date(str);
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${jam}:${menit}`;
}

/** Tentukan warna status: PENUH/SEBAGIAN/OVER/BELUM */
function warnaStatus(status) {
  switch (status) {
    case 'PENUH':    return 'text-green-700 bg-green-50 border-green-200';
    case 'SEBAGIAN': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'OVER':     return 'text-red-700 bg-red-50 border-red-200';
    default:         return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/** Warna progress bar */
function warnaBar(status) {
  switch (status) {
    case 'PENUH':    return 'bg-green-600';
    case 'SEBAGIAN': return 'bg-amber-500';
    case 'OVER':     return 'bg-red-600';
    default:         return 'bg-gray-300';
  }
}

// ============================================
// QUERY: DATA
// ============================================

/** Ambil semua tahun anggaran (terbaru dulu) */
async function ambilDaftarTahun() {
  const { data, error } = await sb
    .from('tahun_anggaran')
    .select('uuid, tahun')
    .order('tahun', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Ambil rekap tahunan untuk 1 tahun */
async function ambilRekapTahunan(tahun) {
  const { data, error } = await sb
    .from('v_rekap_tahunan')
    .select('*')
    .eq('tahun', tahun)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Ambil semua kegiatan (rekap) untuk 1 tahun */
async function ambilKegiatan(tahun) {
  const { data, error } = await sb
    .from('v_rekap_anggaran')
    .select('*')
    .eq('tahun', tahun)
    .order('nama_kegiatan', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Ambil semua transaksi realisasi untuk 1 tahun */
async function ambilTransaksi(tahun) {
  const { data, error } = await sb
    .from('v_detail_realisasi')
    .select('*')
    .eq('tahun', tahun)
    .order('tanggal_transaksi', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Ambil email user berdasarkan role (untuk login via dropdown) */
async function ambilEmailByRole(role) {
  const { data, error } = await sb
    .from('data_user')
    .select('email')
    .eq('role', role)
    .single();
    
  if (error) throw error;
  return data.email;
}

// ============================================
// AUTH
// ============================================

/** Cek session aktif, return user + profil data_user */
async function cekUserAktif() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data: profil, error } = await sb
    .from('data_user')
    .select('uuid, nama_lengkap, role')
    .eq('id_auth_supabase', session.user.id)
    .maybeSingle();

  if (error) {
    console.warn('[Auth] Gagal ambil profil:', error);
    return null;
  }

  return { session, profil };
}

/** Login email + password */
async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Logout */
async function logout() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/** Cek perubahan session (login/logout realtime) */
function onAuthChange(callback) {
  sb.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================
// EXPORT KE GLOBAL (biar dipakai di app.js)
// ============================================
window.SIMADES = {
  sb,
  formatRupiah,
  formatRupiahSingkat,
  formatTanggal,
  formatTanggalWaktu,
  warnaStatus,
  warnaBar,
  ambilDaftarTahun,
  ambilRekapTahunan,
  ambilKegiatan,
  ambilTransaksi,
  ambilEmailByRole, // <-- Fungsi baru untuk login via dropdown role
  cekUserAktif,
  login,
  logout,
  onAuthChange
};