// ============================================
// SIMADES — App Logic (Final: Tanpa Approval)
// ============================================

const state = {
  tahunAktif: null, daftarTahun: [], rekapTahunan: null, daftarKegiatan: [],
  semuaTransaksi: [], userAktif: null, keywordCari: ''
};

const $ = (id) => document.getElementById(id);
const S = window.SIMADES;

// SVG Icons
const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconHapus = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

// Utilitas Format Rupiah
function formatRp(input) {
  let val = input.value.replace(/[^0-9]/g, '');
  input.value = val === '' ? '' : new Intl.NumberFormat('id-ID').format(val);
}
function bersihkanRp(val) {
  return parseFloat((val || '0').replace(/\./g, '')) || 0;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function highlight(teks, keyword) {
  const aman = escapeHtml(teks);
  if (!keyword) return aman;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return aman.replace(regex, '<mark>$1</mark>');
}

// ============================================
// AUTH — HEADER & MENU (3 ROLE)
// ============================================
async function initAuth() {
  try {
    const hasil = await S.cekUserAktif();
    if (hasil && hasil.profil) { state.userAktif = hasil.profil; tampilkanUserMenu(hasil.profil); }
    else { tampilkanTombolLogin(); }
  } catch (e) { tampilkanTombolLogin(); }

  S.onAuthChange(async (event) => {
    if (event === 'SIGNED_IN') {
      const hasil = await S.cekUserAktif();
      if (hasil && hasil.profil) { state.userAktif = hasil.profil; tampilkanUserMenu(hasil.profil); }
    } else if (event === 'SIGNED_OUT') { state.userAktif = null; tampilkanTombolLogin(); }
  });
}

function tampilkanTombolLogin() {
  $('tombolLogin').classList.remove('hidden');
  $('userMenu').classList.add('hidden');
  $('tombolTambahTahun').classList.add('hidden');
  $('tombolTambahKegiatan').classList.add('hidden');
  $('tombolHapusTahun').classList.add('hidden');
}

function tampilkanUserMenu(profil) {
  $('tombolLogin').classList.add('hidden');
  $('userMenu').classList.remove('hidden');
  
  $('namaUser').textContent = profil.nama_lengkap || 'User';
  $('roleUser').textContent = profil.role || 'User';
  
  const role = profil.role;

  // Reset semua tombol
  $('tombolTambahTahun').classList.add('hidden');
  $('tombolTambahKegiatan').classList.add('hidden');
  $('tombolHapusTahun').classList.add('hidden');
  $('menuUbahNamaSekdes').classList.add('hidden');
  $('menuUbahNamaBendahara').classList.add('hidden');

  if (role === 'Kades') {
    $('roleUser').className = 'text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded';
    $('menuUbahNamaSekdes').classList.remove('hidden');
    $('menuUbahNamaBendahara').classList.remove('hidden');
  } 
  else if (role === 'Sekdes') {
    $('roleUser').className = 'text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded';
    $('tombolTambahTahun').classList.remove('hidden');
    $('tombolTambahKegiatan').classList.remove('hidden');
    $('tombolHapusTahun').classList.remove('hidden');
  } 
  else if (role === 'Bendahara') {
    $('roleUser').className = 'text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded';
  }
}

// ============================================
// MODAL LOGIN & PASSWORD
// ============================================
function bukaModalLogin() { $('modalLogin').classList.add('aktif'); $('pesanLogin').classList.add('hidden'); $('inputRole').value = ''; $('inputPassword').value = ''; setTimeout(() => $('inputRole').focus(), 100); }
function tutupModalLogin() { $('modalLogin').classList.remove('aktif'); }
function tampilkanPesanLogin(teks, tipe) {
  const el = $('pesanLogin'); el.textContent = teks;
  el.className = 'text-sm px-3 py-2 rounded-lg ' + (tipe === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200');
}

async function prosesLogin(e) {
  e.preventDefault();
  const role = $('inputRole').value;
  const password = $('inputPassword').value;
  const tombol = $('submitLogin');

  tombol.disabled = true;
  tombol.textContent = 'Memproses...';

  try {
    const email = await S.ambilEmailByRole(role);
    if (!email) throw new Error("Role belum memiliki email terdaftar.");
    await S.login(email, password);
    
    tampilkanPesanLogin('Login berhasil. Memuat ulang...', 'sukses');
    setTimeout(() => { tutupModalLogin(); tombol.disabled = false; tombol.textContent = 'Masuk'; }, 800);
  } catch (err) {
    tampilkanPesanLogin(err.message || 'Login gagal. Cek password.', 'error'); 
    tombol.disabled = false; tombol.textContent = 'Masuk';
  }
}

async function prosesLogout() {
  try { await S.logout(); $('dropdownUser').classList.add('hidden'); } catch (err) { alert('Gagal logout: ' + err.message); }
}

function bukaModalUbahPassword() {
  $('modalUbahPassword').classList.add('aktif'); $('pesanUbahPass').classList.add('hidden');
  $('inputPassBaru').value = ''; $('inputPassKonfirm').value = '';
}

async function prosesUbahPassword(e) {
  e.preventDefault();
  const passBaru = $('inputPassBaru').value; const passKonfirm = $('inputPassKonfirm').value;
  const btn = $('submitUbahPass'); const pesan = $('pesanUbahPass');

  if (passBaru !== passKonfirm) {
    pesan.textContent = 'Password konfirmasi tidak cocok.';
    pesan.className = 'text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); return;
  }

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { error } = await S.sb.auth.updateUser({ password: passBaru });
    if (error) throw error;
    pesan.textContent = 'Password berhasil diubah!';
    pesan.className = 'text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');
    setTimeout(() => { $('modalUbahPassword').classList.remove('aktif'); btn.disabled = false; btn.textContent = 'Simpan'; }, 1500);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal mengubah password.';
    pesan.className = 'text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'Simpan';
  }
}

// ============================================
// UBAH NAMA (SEKDES / BENDAHARA)
// ============================================
function bukaModalUbahNama(targetRole) {
  $('modalUbahNamaOperator').classList.add('aktif'); 
  $('pesanUbahNama').classList.add('hidden');
  
  $('judulUbahNama').textContent = `Ubah Nama ${targetRole}`;
  $('inputNamaOperatorBaru').setAttribute('data-target-role', targetRole);
  
  S.sb.from('data_user').select('nama_lengkap').eq('role', targetRole).single().then(({data}) => {
    if(data) $('inputNamaOperatorBaru').value = data.nama_lengkap;
  });
}

async function prosesUbahNama(e) {
  e.preventDefault();
  const namaBaru = $('inputNamaOperatorBaru').value.trim();
  const targetRole = $('inputNamaOperatorBaru').getAttribute('data-target-role');
  const btn = $('submitUbahNama'); 
  const pesan = $('pesanUbahNama');

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { error } = await S.sb.from('data_user').update({ nama_lengkap: namaBaru }).eq('role', targetRole);
    if (error) throw error;
    
    pesan.textContent = `Nama ${targetRole} berhasil diubah!`;
    pesan.className = 'text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');
    
    setTimeout(() => { 
      $('modalUbahNamaOperator').classList.remove('aktif'); 
      btn.disabled = false; 
      btn.textContent = 'Simpan'; 
    }, 1500);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal mengubah nama.';
    pesan.className = 'text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); 
    btn.disabled = false; 
    btn.textContent = 'Simpan';
  }
}

// ============================================
// FORM TAHUN BARU & KEGIATAN (INDUK-ANAK)
// ============================================
function bukaModalTambahTahun() {
  $('modalTambahTahun').classList.add('aktif'); $('formTambahTahun').reset();
  $('pesanTambahTahun').classList.add('hidden');
  $('inputTahunBaru').value = new Date().getFullYear() + 1;
  $('wadahBarisKegiatan').innerHTML = ''; tambahBarisKegiatan();
}

function tambahBarisKegiatan() {
  const wadah = $('wadahBarisKegiatan');
  const id = 'baris-' + Date.now() + Math.floor(Math.random() * 1000);
  
  const html = `
    <div id="${id}" class="flex gap-1.5 items-start bg-gray-50 p-2 border border-gray-200 rounded-md">
      <div class="flex-1 space-y-1.5">
        <select class="input-kategori w-full border border-gray-300 rounded px-1.5 py-1 text-[11px] bg-white" required>
          <option value="" disabled selected>-- Pilih Kategori Akun --</option>
          <option value="Pendapatan">Pendapatan</option>
          <option value="Belanja">Belanja</option>
          <option value="Pembiayaan">Pembiayaan</option>
        </select>
        <input type="text" class="input-nama w-full border border-gray-300 rounded px-1.5 py-1 text-[11px]" placeholder="Nama Kegiatan" required>
        <input type="text" inputmode="numeric" class="input-pagu w-full border border-gray-300 rounded px-1.5 py-1 text-[11px]" placeholder="Pagu Anggaran Awal (Rp)" required>
      </div>
      <button type="button" class="text-red-500 hover:text-red-700 px-1 text-lg mt-0.5" onclick="document.getElementById('${id}').remove()">×</button>
    </div>
  `;
  wadah.insertAdjacentHTML('beforeend', html);
  document.querySelector(`#${id} .input-pagu`).addEventListener('input', (e) => formatRp(e.target));
}

async function prosesTambahTahun(e) {
  e.preventDefault();
  const btn = $('submitTambahTahun'); const pesan = $('pesanTambahTahun');
  const tahun = parseInt($('inputTahunBaru').value);
  
  const barisList = document.querySelectorAll('#wadahBarisKegiatan > div');
  if (barisList.length === 0) return alert("Minimal 1 kegiatan.");

  const daftarKegiatan = [];
  let valid = true;
  barisList.forEach(b => {
    const kategori = b.querySelector('.input-kategori').value;
    const nama = b.querySelector('.input-nama').value.trim();
    const pagu = bersihkanRp(b.querySelector('.input-pagu').value);
    if (!kategori || !nama) valid = false;
    daftarKegiatan.push({ kategori, nama, pagu });
  });

  if (!valid) {
    pesan.textContent = 'Pastikan Kategori & Nama Kegiatan terisi.';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); return;
  }

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { data: tData, error: eT } = await S.sb
      .from('tahun_anggaran').insert([{ tahun, data_user_uuid: state.userAktif.uuid }])
      .select('uuid').single();
    if (eT) throw eT;

    const dataK = daftarKegiatan.map(k => ({
      tahun_anggaran_uuid: tData.uuid, kategori_akun: k.kategori,
      nama_kegiatan: k.nama, anggaran_awal: k.pagu, anggaran_perubahan: k.pagu,
      data_user_uuid: state.userAktif.uuid,
      dicatat_oleh: state.userAktif.nama_lengkap
    }));

    const { error: eK } = await S.sb.from('rencana_kegiatan').insert(dataK);
    if (eK) throw eK;

    pesan.textContent = `Tahun ${tahun} & ${daftarKegiatan.length} kegiatan berhasil disimpan!`;
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');

    setTimeout(async () => { 
      $('modalTambahTahun').classList.remove('aktif'); btn.disabled = false; btn.textContent = 'Simpan Semua';
      await loadDaftarTahun(); await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);
    }, 1500);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal.';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'Simpan Semua';
  }
}

// ============================================
// FORM TAMBAH KEGIATAN (TAHUN BERJALAN)
// ============================================
function bukaModalTambahKegiatan() {
  if (!state.tahunAktif) return alert("Pilih tahun anggaran terlebih dahulu.");
  $('modalTambahKegiatan').classList.add('aktif'); $('formTambahKegiatan').reset();
  $('pesanTambahKegiatan').classList.add('hidden');
  $('labelTahunKegiatan').textContent = `Untuk Tahun Anggaran: ${state.tahunAktif}`;
}

async function prosesTambahKegiatan(e) {
  e.preventDefault();
  const btn = $('submitTambahKegiatan'); const pesan = $('pesanTambahKegiatan');
  const nama = $('inputNamaKegiatanBaru').value.trim();
  const kategori = $('inputKategoriKegiatan').value;
  const pagu = bersihkanRp($('inputPaguKegiatanBaru').value);

  const tahunData = state.daftarTahun.find(t => t.tahun === state.tahunAktif);
  if (!tahunData) return alert("Tahun aktif tidak ditemukan.");

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { error } = await S.sb.from('rencana_kegiatan').insert([{
      tahun_anggaran_uuid: tahunData.uuid, kategori_akun: kategori,
      nama_kegiatan: nama, anggaran_awal: pagu, anggaran_perubahan: pagu,
      data_user_uuid: state.userAktif.uuid,
      dicatat_oleh: state.userAktif.nama_lengkap
    }]);
    if (error) throw error;

    pesan.textContent = 'Kegiatan berhasil ditambahkan!';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');

    setTimeout(async () => { 
      $('modalTambahKegiatan').classList.remove('aktif'); btn.disabled = false; btn.textContent = 'Simpan Kegiatan';
      await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);
    }, 1500);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal.';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200';
    pesan.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'Simpan Kegiatan';
  }
}

// ============================================
// FUNGSI EDIT & HAPUS KEGIATAN
// ============================================
function bukaModalEditKegiatan(k) {
  $('modalEditKegiatan').classList.add('aktif');
  $('pesanEditKegiatan').classList.add('hidden');
  $('editKegiatanUuid').value = k.rencana_uuid;
  $('editKategoriKegiatan').value = k.kategori_akun;
  $('editNamaKegiatan').value = k.nama_kegiatan;
  $('editPaguAwal').value = new Intl.NumberFormat('id-ID').format(k.anggaran_awal);
  $('editPaguPerubahan').value = new Intl.NumberFormat('id-ID').format(k.anggaran_perubahan);
}

async function prosesEditKegiatan(e) {
  e.preventDefault();
  const btn = $('submitEditKegiatan'); const pesan = $('pesanEditKegiatan');
  const uuid = $('editKegiatanUuid').value;
  const nama = $('editNamaKegiatan').value.trim();
  const kategori = $('editKategoriKegiatan').value;
  const paguAwal = bersihkanRp($('editPaguAwal').value);
  const paguPerubahan = bersihkanRp($('editPaguPerubahan').value);

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    const { error } = await S.sb.from('rencana_kegiatan').update({
      kategori_akun: kategori, nama_kegiatan: nama,
      anggaran_awal: paguAwal, anggaran_perubahan: paguPerubahan,
      dicatat_oleh: state.userAktif.nama_lengkap
    }).eq('uuid', uuid);
    if (error) throw error;

    pesan.textContent = 'Kegiatan berhasil diubah!';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');

    setTimeout(async () => { 
      $('modalEditKegiatan').classList.remove('aktif'); btn.disabled = false; btn.textContent = 'Simpan Perubahan';
      await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);
    }, 1500);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal.'; pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200'; pesan.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Simpan Perubahan';
  }
}

async function hapusKegiatan(uuid) {
  if (!confirm("Yakin ingin menghapus kegiatan ini? Semua transaksi di dalamnya juga akan terhapus!")) return;
  try {
    const { error } = await S.sb.from('rencana_kegiatan').delete().eq('uuid', uuid);
    if (error) throw error;
    await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);
  } catch (err) { alert("Gagal menghapus: " + err.message); }
}

async function hapusTahun() {
  if (!state.tahunAktif) return;
  if (!confirm(`Yakin ingin menghapus TAHUN ${state.tahunAktif} beserta SELURUH kegiatannya?`)) return;
  
  const tahunData = state.daftarTahun.find(t => t.tahun === state.tahunAktif);
  try {
    const { error } = await S.sb.from('tahun_anggaran').delete().eq('uuid', tahunData.uuid);
    if (error) throw error;
    
    alert("Tahun anggaran berhasil dihapus.");
    await loadDaftarTahun();
    if (state.tahunAktif) { await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif); }
    else { $('rekapContainer').innerHTML = ''; $('daftarKegiatan').innerHTML = '<div class="kosong">Belum ada data.</div>'; }
  } catch (err) { alert("Gagal menghapus tahun: " + err.message); }
}

// ============================================
// FUNGSI CRUD REALISASI
// ============================================
function bukaModalRealisasi(kegiatan, transaksi = null) {
  $('modalFormRealisasi').classList.add('aktif');
  $('pesanRealisasi').classList.add('hidden');
  $('formRealisasi').reset();
  
  $('realisasiRencanaUuid').value = kegiatan.rencana_uuid;
  $('labelKegiatanRealisasi').textContent = `Kegiatan: ${kegiatan.nama_kegiatan}`;

  if (transaksi) {
    $('judulFormRealisasi').textContent = 'Edit Realisasi';
    $('realisasiUuid').value = transaksi.realisasi_uuid;
    $('inputUraianRealisasi').value = transaksi.uraian_transaksi;
    $('inputVolumeRealisasi').value = transaksi.volume;
    $('inputSatuanRealisasi').value = transaksi.satuan;
    $('inputHargaRealisasi').value = new Intl.NumberFormat('id-ID').format(transaksi.harga_satuan);
    $('inputDurasiRealisasi').value = transaksi.durasi;
    $('inputSatuanDurasiRealisasi').value = transaksi.satuan_durasi === '-' ? '' : transaksi.satuan_durasi;
    $('inputTanggalRealisasi').value = transaksi.tanggal_transaksi;
  } else {
    $('judulFormRealisasi').textContent = 'Input Realisasi';
    $('realisasiUuid').value = '';
    $('inputTanggalRealisasi').value = new Date().toISOString().split('T')[0];
    $('inputDurasiRealisasi').value = 0;
  }
  hitungPreviewTotalRealisasi();
}

function hitungPreviewTotalRealisasi() {
  const vol = parseFloat($('inputVolumeRealisasi').value) || 0;
  const harga = bersihkanRp($('inputHargaRealisasi').value);
  const durasi = parseFloat($('inputDurasiRealisasi').value) || 0;
  const total = vol * harga * (durasi > 0 ? durasi : 1);
  $('previewTotalRealisasi').textContent = S.formatRupiah(total);
}

async function prosesSimpanRealisasi(e) {
  e.preventDefault();
  const btn = $('submitRealisasi'); const pesan = $('pesanRealisasi');
  const uuid = $('realisasiUuid').value;
  const rencanaUuid = $('realisasiRencanaUuid').value;
  
  const data = {
    rencana_kegiatan_uuid: rencanaUuid,
    uraian_transaksi: $('inputUraianRealisasi').value.trim(),
    volume: parseFloat($('inputVolumeRealisasi').value) || 0,
    satuan: $('inputSatuanRealisasi').value.trim(),
    harga_satuan: bersihkanRp($('inputHargaRealisasi').value),
    durasi: parseFloat($('inputDurasiRealisasi').value) || 0,
    satuan_durasi: $('inputSatuanDurasiRealisasi').value.trim() || '-',
    tanggal_transaksi: $('inputTanggalRealisasi').value,
    data_user_uuid: state.userAktif.uuid,
    dicatat_oleh: state.userAktif.nama_lengkap
  };

  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    let error;
    if (uuid) {
      const res = await S.sb.from('realisasi_kegiatan').update(data).eq('uuid', uuid);
      error = res.error;
    } else {
      const res = await S.sb.from('realisasi_kegiatan').insert([data]);
      error = res.error;
    }
    if (error) throw error;

    pesan.textContent = 'Data realisasi berhasil disimpan!';
    pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200';
    pesan.classList.remove('hidden');

    setTimeout(async () => { 
      $('modalFormRealisasi').classList.remove('aktif'); btn.disabled = false; btn.textContent = 'Simpan';
      await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);
      
      if (typeof rkpAktifDiModal !== 'undefined' && rkpAktifDiModal) {
        const updated = state.daftarKegiatan.find(x => x.rencana_uuid === rkpAktifDiModal.rencana_uuid);
        if (updated) bukaModalDetailRkp(updated);
      }
    }, 1000);
  } catch (err) {
    pesan.textContent = err.message || 'Gagal.'; pesan.className = 'text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200'; pesan.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Simpan';
  }
}

async function hapusRealisasi(uuid) {
  if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
  try {
    const { error } = await S.sb.from('realisasi_kegiatan').delete().eq('uuid', uuid);
    if (error) throw error;
    await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif);

    if (typeof rkpAktifDiModal !== 'undefined' && rkpAktifDiModal) {
      const updated = state.daftarKegiatan.find(x => x.rencana_uuid === rkpAktifDiModal.rencana_uuid);
      if (updated) bukaModalDetailRkp(updated);
    }
  } catch (err) { alert("Gagal menghapus: " + err.message); }
}

// ============================================
// LOAD TAHUN ANGGARAN
// ============================================
async function loadDaftarTahun() {
  try {
    const daftar = await S.ambilDaftarTahun(); state.daftarTahun = daftar; const select = $('pilihTahun'); select.innerHTML = '';
    if (daftar.length === 0) { select.innerHTML = '<option value="">Belum ada tahun</option>'; return; }
    daftar.forEach(t => {
      const opt = document.createElement('option'); opt.value = t.tahun; opt.textContent = t.tahun; select.appendChild(opt);
    });
    state.tahunAktif = daftar[0].tahun; select.value = state.tahunAktif;
  } catch (e) { $('pilihTahun').innerHTML = '<option value="">Gagal memuat</option>'; }
}

// ============================================
// REKAP TAHUNAN
// ============================================
async function loadRekapTahunan(tahun) {
  try {
    const kegiatan = await S.ambilKegiatan(tahun);
    
    let rencanaPendapatan = 0, realisasiPendapatan = 0;
    let rencanaBelanja = 0, realisasiBelanja = 0;
    let rencanaPembiayaan = 0, realisasiPembiayaan = 0;

    kegiatan.forEach(k => {
      const pagu = Number(k.anggaran_perubahan) || 0;
      const realisasi = Number(k.total_realisasi) || 0;
      
      if (k.kategori_akun === 'Pendapatan') { rencanaPendapatan += pagu; realisasiPendapatan += realisasi; } 
      else if (k.kategori_akun === 'Belanja') { rencanaBelanja += pagu; realisasiBelanja += realisasi; } 
      else if (k.kategori_akun === 'Pembiayaan') { rencanaPembiayaan += pagu; realisasiPembiayaan += realisasi; }
    });

    $('rekapContainer').innerHTML = `
      <div class="border border-gray-200 rounded-lg p-2 bg-green-50/30">
        <div class="text-[10px] font-bold text-gray-700 mb-1">Pendapatan</div>
        <div class="text-[9px] text-gray-500">Rencana:</div>
        <div class="text-xs font-semibold tabular text-green-700 truncate">${S.formatRupiahSingkat(rencanaPendapatan)}</div>
        <div class="text-[9px] text-gray-500 mt-1">Realisasi:</div>
        <div class="text-[11px] font-medium tabular text-green-600 truncate">${S.formatRupiahSingkat(realisasiPendapatan)}</div>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-2 bg-red-50/30">
        <div class="text-[10px] font-bold text-gray-700 mb-1">Belanja</div>
        <div class="text-[9px] text-gray-500">Rencana:</div>
        <div class="text-xs font-semibold tabular text-red-700 truncate">${S.formatRupiahSingkat(rencanaBelanja)}</div>
        <div class="text-[9px] text-gray-500 mt-1">Realisasi:</div>
        <div class="text-[11px] font-medium tabular text-red-600 truncate">${S.formatRupiahSingkat(realisasiBelanja)}</div>
      </div>
      
      <div class="border border-gray-200 rounded-lg p-2 bg-blue-50/30">
        <div class="text-[10px] font-bold text-gray-700 mb-1">Pembiayaan</div>
        <div class="text-[9px] text-gray-500">Rencana:</div>
        <div class="text-xs font-semibold tabular text-blue-700 truncate">${S.formatRupiahSingkat(rencanaPembiayaan)}</div>
        <div class="text-[9px] text-gray-500 mt-1">Realisasi:</div>
        <div class="text-[11px] font-medium tabular text-blue-600 truncate">${S.formatRupiahSingkat(realisasiPembiayaan)}</div>
      </div>
    `;
  } catch (e) { 
    console.error('[Rekap Error]', e);
    $('rekapContainer').innerHTML = '<div class="col-span-full kosong">Gagal memuat rekap</div>'; 
  }
}

// ============================================
// LOAD KEGIATAN & RENDER
// ============================================
async function loadKegiatan(tahun) {
  try {
    const [kegiatan, transaksi] = await Promise.all([S.ambilKegiatan(tahun), S.ambilTransaksi(tahun)]);
    state.daftarKegiatan = kegiatan; state.semuaTransaksi = transaksi;
    renderDaftarKegiatan();
  } catch (e) { $('daftarKegiatan').innerHTML = '<div class="kosong">Gagal memuat kegiatan</div>'; }
}

function renderDaftarKegiatan() {
  const container = $('daftarKegiatan');
  const keyword = state.keywordCari.trim().toLowerCase();

  const kegiatanFiltered = state.daftarKegiatan.filter(k => {
    if (!keyword) return true;
    const cocokNama = (k.nama_kegiatan || '').toLowerCase().includes(keyword);
    const cocokTransaksi = state.semuaTransaksi.some(t => t.rencana_uuid === k.rencana_uuid && (t.uraian_transaksi || '').toLowerCase().includes(keyword));
    return cocokNama || cocokTransaksi;
  });

  const urutanKategori = { 'Pendapatan': 1, 'Belanja': 2, 'Pembiayaan': 3 };
  kegiatanFiltered.sort((a, b) => {
    const urutanA = urutanKategori[a.kategori_akun] || 99;
    const urutanB = urutanKategori[b.kategori_akun] || 99;
    if (urutanA !== urutanB) return urutanA - urutanB;
    return (a.nama_kegiatan || '').localeCompare(b.nama_kegiatan || '');
  });

  $('jumlahKegiatan').textContent = `(${kegiatanFiltered.length})`;
  if (kegiatanFiltered.length === 0) {
    container.innerHTML = keyword ? `<div class="kosong">Tidak ada kegiatan yang cocok</div>` : '<div class="kosong">Belum ada kegiatan</div>'; return;
  }

  const getBadgeKategori = (kategori) => {
    if (kategori === 'Pendapatan') return 'bg-green-100 text-green-700 border-green-200';
    if (kategori === 'Pembiayaan') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  container.innerHTML = kegiatanFiltered.map(k => {
    const pagu = Number(k.anggaran_perubahan) || 0, realisasi = Number(k.total_realisasi) || 0;
    const kategori = k.kategori_akun || 'Belanja';

    return `
      <div class="kartu-kegiatan cursor-pointer" onclick="window.bukaDetailRkpDariKartu('${k.rencana_uuid}')">
        <div class="p-3">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div class="flex-1">
              <span class="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getBadgeKategori(kategori)} mb-1">${kategori}</span>
              <div class="flex justify-between items-start gap-2">
                <div class="text-xs font-medium text-gray-900 leading-snug flex-1">${keyword ? highlight(k.nama_kegiatan, keyword) : escapeHtml(k.nama_kegiatan)}</div>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
            ${Number(k.anggaran_awal) !== Number(k.anggaran_perubahan) 
              ? `
                <div class="text-gray-500">Anggaran Awal:</div>
                <div class="text-right font-medium text-gray-700 tabular">${S.formatRupiah(k.anggaran_awal)}</div>
                
                <div class="text-gray-500">Anggaran Perubahan:</div>
                <div class="text-right font-semibold text-blue-600 tabular">${S.formatRupiah(k.anggaran_perubahan)}</div>
              ` 
              : `
                <div class="text-gray-500">Pagu Anggaran:</div>
                <div class="text-right font-semibold text-gray-800 tabular col-span-1">${S.formatRupiah(k.anggaran_awal)}</div>
              `
            }
            <div class="text-gray-500">Realisasi:</div>
            <div class="text-right font-semibold text-green-600 tabular">${S.formatRupiah(realisasi)}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ============================================
// MODAL DETAIL RKP & HISTORY TRANSAKSI (TANPA APPROVAL)
// ============================================
let rkpAktifDiModal = null;

function bukaModalDetailRkp(kegiatan) {
  rkpAktifDiModal = kegiatan;
  const role = state.userAktif ? state.userAktif.role : null;

  $('detailNamaKegiatan').textContent = kegiatan.nama_kegiatan;
  
  const badge = $('detailKategori');
  badge.textContent = kegiatan.kategori_akun;
  if (kegiatan.kategori_akun === 'Pendapatan') badge.className = 'inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-green-100 text-green-700 border-green-200 mb-1';
  else if (kegiatan.kategori_akun === 'Pembiayaan') badge.className = 'inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-blue-100 text-blue-700 border-blue-200 mb-1';
  else badge.className = 'inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-gray-100 text-gray-700 border-gray-200 mb-1';

  $('detailPagu').textContent = S.formatRupiah(kegiatan.anggaran_perubahan);
  $('detailRealisasi').textContent = S.formatRupiah(kegiatan.total_realisasi);

  // Tombol Aksi (Sekdes / Bendahara)
  if (role === 'Sekdes') {
    $('tombolEditKegiatanModal').classList.remove('hidden');
    $('tombolHapusKegiatanModal').classList.remove('hidden');
    $('tombolTambahRealisasiModal').classList.add('hidden');

    const newBtnEdit = $('tombolEditKegiatanModal').cloneNode(true);
    $('tombolEditKegiatanModal').replaceWith(newBtnEdit);
    newBtnEdit.addEventListener('click', () => {
      tutupModalDetailRkp();
      bukaModalEditKegiatan(kegiatan);
    });

    const newBtnHapus = $('tombolHapusKegiatanModal').cloneNode(true);
    $('tombolHapusKegiatanModal').replaceWith(newBtnHapus);
    newBtnHapus.addEventListener('click', async () => {
      await hapusKegiatan(kegiatan.rencana_uuid);
      if (rkpAktifDiModal) tutupModalDetailRkp();
    });

  } else if (role === 'Bendahara') {
    $('tombolTambahRealisasiModal').classList.remove('hidden');
    $('tombolEditKegiatanModal').classList.add('hidden');
    $('tombolHapusKegiatanModal').classList.add('hidden');

    const newBtnTambah = $('tombolTambahRealisasiModal').cloneNode(true);
    $('tombolTambahRealisasiModal').replaceWith(newBtnTambah);
    newBtnTambah.addEventListener('click', () => {
      tutupModalDetailRkp();
      bukaModalRealisasi(kegiatan);
    });

  } else {
    $('tombolTambahRealisasiModal').classList.add('hidden');
    $('tombolEditKegiatanModal').classList.add('hidden');
    $('tombolHapusKegiatanModal').classList.add('hidden');
  }

  renderHistoryTransaksiDiModal(kegiatan.rencana_uuid, role);
  $('modalDetailRkp').classList.add('aktif');
}

function tutupModalDetailRkp() {
  $('modalDetailRkp').classList.remove('aktif');
  rkpAktifDiModal = null;
}

function renderHistoryTransaksiDiModal(rencanaUuid, role) {
  const transaksi = state.semuaTransaksi.filter(t => t.rencana_uuid === rencanaUuid);
  const container = $('isiHistoryTransaksi');

  if (transaksi.length === 0) {
    container.innerHTML = '<div class="p-4 text-center text-sm text-gray-500 italic">Belum ada transaksi realisasi.</div>';
    return;
  }

  // Tabel Transparan: Tanggal | Uraian | Vol | Harga | Durasi | Total | Dicatat Oleh | Aksi
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-gray-700 border-collapse">
        <thead class="bg-gray-100 text-gray-600">
          <tr>
            <th class="p-2 border-b">Tanggal</th>
            <th class="p-2 border-b">Uraian</th>
            <th class="p-2 border-b text-right">Vol</th>
            <th class="p-2 border-b text-right">Harga</th>
            <th class="p-2 border-b text-center">Durasi</th>
            <th class="p-2 border-b text-right">Total</th>
            <th class="p-2 border-b">Dicatat Oleh</th>
            <th class="p-2 border-b text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${transaksi.map(t => {
            const durasiTeks = Number(t.durasi) > 0 ? `${t.durasi} ${escapeHtml(t.satuan_durasi)}` : '-';
            const totalHitung = (Number(t.volume) || 0) * (Number(t.harga_satuan) || 0) * (Number(t.durasi) > 0 ? Number(t.durasi) : 1);

            let tombolAksi = '';
            if (role === 'Bendahara') {
              tombolAksi = `
                <button class="text-[10px] text-blue-600 p-1" onclick="event.stopPropagation(); window.bukaEditRealisasiDariModal('${t.realisasi_uuid}')">${iconEdit}</button>
                <button class="text-[10px] text-red-600 p-1" onclick="event.stopPropagation(); window.hapusRealisasiDariModal('${t.realisasi_uuid}')">${iconHapus}</button>
              `;
            }

            return `
              <tr class="border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                <td class="p-2 whitespace-nowrap align-top">${S.formatTanggal(t.tanggal_transaksi)}</td>
                <td class="p-2 align-top">${escapeHtml(t.uraian_transaksi)}</td>
                <td class="p-2 text-right align-top whitespace-nowrap">${Number(t.volume).toLocaleString('id-ID')} ${escapeHtml(t.satuan)}</td>
                <td class="p-2 text-right align-top whitespace-nowrap">${S.formatRupiah(t.harga_satuan)}</td>
                <td class="p-2 text-center align-top whitespace-nowrap">${durasiTeks}</td>
                <td class="p-2 text-right font-semibold align-top whitespace-nowrap">${S.formatRupiah(totalHitung)}</td>
                <td class="p-2 align-top whitespace-nowrap">${escapeHtml(t.dicatat_oleh || '-')}</td>
                <td class="p-2 text-center align-top whitespace-nowrap">${tombolAksi}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================
// SEARCH & SUGGEST
// ============================================
function renderSuggest(keyword) {
  const box = $('suggestBox');
  if (!keyword || keyword.length < 2) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  const kw = keyword.toLowerCase(), suggestions = [];

  state.daftarKegiatan.forEach(k => { if ((k.nama_kegiatan || '').toLowerCase().includes(kw)) suggestions.push({ label: k.nama_kegiatan, jenis: k.kategori_akun || 'Kegiatan', kegiatan: null }); });
  state.semuaTransaksi.forEach(t => {
    if ((t.uraian_transaksi || '').toLowerCase().includes(kw)) {
      const sudahAda = suggestions.some(s => s.label.toLowerCase() === t.uraian_transaksi.toLowerCase());
      if (!sudahAda) suggestions.push({ label: t.uraian_transaksi, jenis: 'Transaksi', kegiatan: t.nama_kegiatan });
    }
  });

  const terbatas = suggestions.slice(0, 8);
  if (terbatas.length === 0) { box.classList.add('hidden'); box.innerHTML = ''; return; }

  box.innerHTML = terbatas.map(s => `<div class="suggest-item" data-pilih="${escapeHtml(s.label)}"><span class="suggest-label">${highlight(s.label, keyword)}</span><span class="suggest-kegiatan">${s.jenis}${s.kegiatan ? ' · ' + escapeHtml(s.kegiatan) : ''}</span></div>`).join('');
  box.classList.remove('hidden');

  box.querySelectorAll('[data-pilih]').forEach(el => {
    el.addEventListener('click', () => {
      const pilih = el.getAttribute('data-pilih');
      $('inputCari').value = pilih; state.keywordCari = pilih;
      $('tombolHapusCari').classList.remove('hidden');
      renderDaftarKegiatan(); box.classList.add('hidden');
    });
  });
}

// ============================================
// JEMBATAN GLOBAL UNTUK TOMBOL
// ============================================
window.bukaDetailRkpDariKartu = function(uuid) {
  const k = state.daftarKegiatan.find(x => x.rencana_uuid === uuid);
  if (k) bukaModalDetailRkp(k);
};

window.bukaEditRealisasiDariModal = function(realisasiUuid) {
  const t = state.semuaTransaksi.find(x => x.realisasi_uuid === realisasiUuid);
  if (t) {
    tutupModalDetailRkp();
    const k = state.daftarKegiatan.find(x => x.rencana_uuid === t.rencana_uuid);
    bukaModalRealisasi(k, t);
  }
};

window.hapusRealisasiDariModal = async function(uuid) {
  await hapusRealisasi(uuid);
};

// ============================================
// EVENT BINDINGS
// ============================================
function bindEvents() {
  $('tombolLogin').addEventListener('click', bukaModalLogin);
  $('batalLogin').addEventListener('click', tutupModalLogin);
  $('formLogin').addEventListener('submit', prosesLogin);
  $('modalLogin').addEventListener('click', (e) => { if (e.target === $('modalLogin')) tutupModalLogin(); });
  $('tombolUser').addEventListener('click', (e) => { e.stopPropagation(); $('dropdownUser').classList.toggle('hidden'); });
  document.addEventListener('click', () => { $('dropdownUser').classList.add('hidden'); });
  $('tombolLogout').addEventListener('click', prosesLogout);

  // Menu Ubah Password
  $('menuUbahPassword').addEventListener('click', () => { $('dropdownUser').classList.add('hidden'); bukaModalUbahPassword(); });

  // Menu Ubah Nama (Kades)
  $('menuUbahNamaSekdes').addEventListener('click', () => {
    $('dropdownUser').classList.add('hidden');
    bukaModalUbahNama('Sekdes');
  });
  $('menuUbahNamaBendahara').addEventListener('click', () => {
    $('dropdownUser').classList.add('hidden');
    bukaModalUbahNama('Bendahara');
  });

  $('batalUbahPass').addEventListener('click', () => $('modalUbahPassword').classList.remove('aktif'));
  $('modalUbahPassword').addEventListener('click', (e) => { if (e.target === $('modalUbahPassword')) $('modalUbahPassword').classList.remove('aktif'); });
  $('formUbahPassword').addEventListener('submit', prosesUbahPassword);

  $('batalUbahNama').addEventListener('click', () => $('modalUbahNamaOperator').classList.remove('aktif'));
  $('modalUbahNamaOperator').addEventListener('click', (e) => { if (e.target === $('modalUbahNamaOperator')) $('modalUbahNamaOperator').classList.remove('aktif'); });
  $('formUbahNamaOperator').addEventListener('submit', prosesUbahNama);

  $('tombolTambahTahun').addEventListener('click', bukaModalTambahTahun);
  $('batalTambahTahun').addEventListener('click', () => $('modalTambahTahun').classList.remove('aktif'));
  $('modalTambahTahun').addEventListener('click', (e) => { if (e.target === $('modalTambahTahun')) $('modalTambahTahun').classList.remove('aktif'); });
  $('formTambahTahun').addEventListener('submit', prosesTambahTahun);
  $('btnTambahBarisKegiatan').addEventListener('click', tambahBarisKegiatan);

  $('tombolTambahKegiatan').addEventListener('click', bukaModalTambahKegiatan);
  $('batalTambahKegiatan').addEventListener('click', () => $('modalTambahKegiatan').classList.remove('aktif'));
  $('modalTambahKegiatan').addEventListener('click', (e) => { if (e.target === $('modalTambahKegiatan')) $('modalTambahKegiatan').classList.remove('aktif'); });
  $('formTambahKegiatan').addEventListener('submit', prosesTambahKegiatan);
  $('inputPaguKegiatanBaru').addEventListener('input', (e) => formatRp(e.target));

  $('tombolHapusTahun').addEventListener('click', hapusTahun);

  $('batalEditKegiatan').addEventListener('click', () => $('modalEditKegiatan').classList.remove('aktif'));
  $('modalEditKegiatan').addEventListener('click', (e) => { if (e.target === $('modalEditKegiatan')) $('modalEditKegiatan').classList.remove('aktif'); });
  $('formEditKegiatan').addEventListener('submit', prosesEditKegiatan);
  $('editPaguAwal').addEventListener('input', (e) => formatRp(e.target));
  $('editPaguPerubahan').addEventListener('input', (e) => formatRp(e.target));

  $('batalRealisasi').addEventListener('click', () => $('modalFormRealisasi').classList.remove('aktif'));
  $('modalFormRealisasi').addEventListener('click', (e) => { if (e.target === $('modalFormRealisasi')) $('modalFormRealisasi').classList.remove('aktif'); });
  $('formRealisasi').addEventListener('submit', prosesSimpanRealisasi);
  
  $('inputVolumeRealisasi').addEventListener('input', hitungPreviewTotalRealisasi);
  $('inputHargaRealisasi').addEventListener('input', (e) => { formatRp(e.target); hitungPreviewTotalRealisasi(); });
  $('inputDurasiRealisasi').addEventListener('input', hitungPreviewTotalRealisasi);

  $('pilihTahun').addEventListener('change', async (e) => {
    state.tahunAktif = parseInt(e.target.value) || null; state.keywordCari = ''; $('inputCari').value = '';
    $('tombolHapusCari').classList.add('hidden');
    if (state.tahunAktif) { await loadRekapTahunan(state.tahunAktif); await loadKegiatan(state.tahunAktif); }
  });

  let timerCari = null;
  $('inputCari').addEventListener('input', (e) => {
    const val = e.target.value;
    state.keywordCari = val;
    if (val.length > 0) $('tombolHapusCari').classList.remove('hidden'); else $('tombolHapusCari').classList.add('hidden');
    renderSuggest(val);
    clearTimeout(timerCari); timerCari = setTimeout(() => renderDaftarKegiatan(), 250);
  });

  $('inputCari').addEventListener('blur', () => { setTimeout(() => $('suggestBox').classList.add('hidden'), 200); });
  $('inputCari').addEventListener('focus', (e) => { if (e.target.value.length >= 2) renderSuggest(e.target.value); });

  $('tombolHapusCari').addEventListener('click', () => {
    $('inputCari').value = ''; state.keywordCari = ''; $('tombolHapusCari').classList.add('hidden'); $('suggestBox').classList.add('hidden');
    renderDaftarKegiatan();
  });

  $('tutupDetailRkp').addEventListener('click', tutupModalDetailRkp);
  $('modalDetailRkp').addEventListener('click', (e) => { if (e.target === $('modalDetailRkp')) tutupModalDetailRkp(); });
}

async function initApp() {
  bindEvents(); await initAuth(); await loadDaftarTahun();
  if (state.tahunAktif) { await Promise.all([loadRekapTahunan(state.tahunAktif), loadKegiatan(state.tahunAktif)]); }
}

document.addEventListener('DOMContentLoaded', initApp);
if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js')); }