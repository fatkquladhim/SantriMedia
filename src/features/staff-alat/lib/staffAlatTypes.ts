// src/features/staff-alat/lib/staffAlatTypes.ts
// Types + snake_case ↔ camelCase mappers untuk modul staff-alat.
// Semua mapping dilakukan di layer ini, tidak di komponen.

export type KondisiAlat = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance' | 'hilang'

export type StatusSewa = 'Lunas' | 'Belum Lunas' | 'Terlambat'
export type KategoriSewa = 'Umum' | 'Paket Santri'
export type JenisSewa = 'Penyewaan' | 'Peminjaman'
export type ReturnStatus = 'Belum Mengembalikan' | 'Sudah Mengembalikan'

export type StatusAlat = 'Tersedia' | 'Disewa' | 'Dipakai' | 'Diperbaiki' | 'Tidak Ada/Rusak'

// ===== Domain types (camelCase) =====

export interface Alat {
    id: string
    nama: string
    gambar: string | null
    kategori: string
    kondisi: KondisiAlat
    jumlah: number
    keterangan: string | null
    is_available: boolean
    serial_number: string | null
    lokasi_penyimpanan: string | null
    created_at?: string
    updated_at?: string
}

export interface SewaItem {
    id: string
    sewaId: string
    alatId: string | null
    namaAlat: string | null
    jumlah: number
    hargaSatuan: number
    alat?: Alat | null
}

export interface Sewa {
    id: string
    namaPenyewa: string
    jenis: JenisSewa
    kategori: KategoriSewa
    tanggalPenyewaan: string
    tanggalPengembalian: string
    hargaSewa: number
    status: StatusSewa
    statusPengembalian: ReturnStatus
    catatan: string | null
    jaminan: string | null
    createdBy: string | null
    createdAt: string
    updatedAt: string
    items: SewaItem[]
}

export interface HargaSewaItem {
    id: string
    namaAlat: string
    kategori: KategoriSewa
    jumlah: number
    harga: number
    alatId: string | null
}

export interface StaffAlatProfil {
    id: string
    namaStaff: string
    sejak: string
    uangAlat: number
    logoUrl: string | null
}

// ===== Mapping kondisi =====

export const KONDISI_LABEL: Record<KondisiAlat, string> = {
    baik: 'Baik',
    rusak_ringan: 'Rusak Bisa Digunakan',
    rusak_berat: 'Rusak Tidak Bisa Digunakan',
    maintenance: 'Perbaikan',
    hilang: 'Hilang',
}

export const KONDISI_LABEL_TO_VALUE: Record<string, KondisiAlat> = {
    'Baik': 'baik',
    'Rusak Bisa Digunakan': 'rusak_ringan',
    'Rusak Tidak Bisa Digunakan': 'rusak_berat',
    'Perbaikan': 'maintenance',
    'Hilang': 'hilang',
}

export function mapKondisiToLabel(kondisi: string): string {
    return KONDISI_LABEL[kondisi as KondisiAlat] || kondisi
}

export function mapKondisiToValue(label: string): KondisiAlat {
    return KONDISI_LABEL_TO_VALUE[label] || 'baik'
}

// ===== Mappers Alat =====

interface AlatApiRow {
    id: string
    nama: string
    gambar?: string | null
    kategori: string
    kondisi: string
    jumlah?: number | null
    keterangan?: string | null
    is_available?: boolean
    serial_number?: string | null
    lokasi_penyimpanan?: string | null
    created_at?: string
    updated_at?: string
}

export function mapAlatFromApi(row: AlatApiRow): Alat {
    return {
        id: row.id,
        nama: row.nama,
        gambar: row.gambar || null,
        kategori: row.kategori,
        kondisi: row.kondisi as KondisiAlat,
        jumlah: row.jumlah ?? 1,
        keterangan: row.keterangan || null,
        is_available: row.is_available ?? true,
        serial_number: row.serial_number || null,
        lokasi_penyimpanan: row.lokasi_penyimpanan || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

export function mapAlatToApi(data: Partial<Alat>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    if (data.nama !== undefined) out.nama = data.nama
    if (data.kategori !== undefined) out.kategori = data.kategori
    if (data.kondisi !== undefined) out.kondisi = data.kondisi
    if (data.jumlah !== undefined) out.jumlah = data.jumlah
    if (data.keterangan !== undefined) out.keterangan = data.keterangan || null
    if (data.gambar !== undefined) out.gambar = data.gambar || null
    if (data.is_available !== undefined) out.is_available = data.is_available
    if (data.serial_number !== undefined) out.serial_number = data.serial_number || null
    if (data.lokasi_penyimpanan !== undefined) out.lokasi_penyimpanan = data.lokasi_penyimpanan || null
    return out
}

// ===== Mappers Sewa =====

interface SewaItemApiRow {
    id: string
    sewa_id: string
    alat_id?: string | null
    nama_alat?: string | null
    jumlah?: number | null
    harga_satuan?: number | null
    alat?: AlatApiRow | null
}

function mapSewaItemFromApi(row: SewaItemApiRow): SewaItem {
    return {
        id: row.id,
        sewaId: row.sewa_id,
        alatId: row.alat_id || null,
        namaAlat: row.nama_alat || null,
        jumlah: row.jumlah ?? 1,
        hargaSatuan: Number(row.harga_satuan) || 0,
        alat: row.alat ? mapAlatFromApi(row.alat) : null,
    }
}

interface SewaApiRow extends Omit<SewaItemApiRow, 'id' | 'sewa_id' | 'alat_id' | 'nama_alat' | 'jumlah' | 'harga_satuan' | 'alat'> {
    id: string
    nama_penyewa: string
    jenis: string
    kategori: string
    tanggal_penyewaan?: string | null
    tanggal_pengembalian?: string | null
    harga_sewa?: number | null
    status: string
    status_pengembalian: string
    catatan?: string | null
    jaminan?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
    items?: SewaItemApiRow[] | null
}

export function mapSewaFromApi(row: SewaApiRow): Sewa {
    return {
        id: row.id,
        namaPenyewa: row.nama_penyewa,
        jenis: row.jenis as JenisSewa,
        kategori: row.kategori as KategoriSewa,
        tanggalPenyewaan: (row.tanggal_penyewaan || '').slice(0, 10),
        tanggalPengembalian: (row.tanggal_pengembalian || '').slice(0, 10),
        hargaSewa: Number(row.harga_sewa) || 0,
        status: row.status as StatusSewa,
        statusPengembalian: row.status_pengembalian as ReturnStatus,
        catatan: row.catatan || null,
        jaminan: row.jaminan || null,
        createdBy: row.created_by || null,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        items: (row.items || []).map(mapSewaItemFromApi),
    }
}

export interface SewaPayload {
    nama_penyewa: string
    jenis: JenisSewa
    kategori: KategoriSewa
    tanggal_penyewaan: string
    tanggal_pengembalian: string
    harga_sewa: number
    status: StatusSewa
    status_pengembalian: ReturnStatus
    catatan: string | null
    jaminan: string | null
    items: { alat_id: string; jumlah: number; harga_satuan?: number }[]
}

export function mapSewaToApi(data: { namaPenyewa?: string; jenis?: JenisSewa; kategori?: KategoriSewa; tanggalPenyewaan?: string; tanggalPengembalian?: string; hargaSewa?: number; status?: StatusSewa; statusPengembalian?: ReturnStatus; catatan?: string | null; jaminan?: string | null; items: { alatId: string; jumlah: number; hargaSatuan?: number }[] }): SewaPayload {
    return {
        nama_penyewa: data.namaPenyewa || '',
        jenis: data.jenis || 'Penyewaan',
        kategori: data.kategori || 'Umum',
        tanggal_penyewaan: data.tanggalPenyewaan || '',
        tanggal_pengembalian: data.tanggalPengembalian || '',
        harga_sewa: data.hargaSewa ?? 0,
        status: data.status || 'Belum Lunas',
        status_pengembalian: data.statusPengembalian || 'Belum Mengembalikan',
        catatan: data.catatan || null,
        jaminan: data.jaminan || null,
        items: data.items.map((i) => ({
            alat_id: i.alatId,
            jumlah: i.jumlah,
            harga_satuan: i.hargaSatuan,
        })),
    }
}

// ===== Mappers Tarif =====

interface HargaApiRow {
    id: string
    nama_alat: string
    kategori: string
    jumlah?: number | null
    harga?: number | null
    alat_id?: string | null
}

export function mapHargaFromApi(row: HargaApiRow): HargaSewaItem {
    return {
        id: row.id,
        namaAlat: row.nama_alat,
        kategori: row.kategori as KategoriSewa,
        jumlah: row.jumlah ?? 1,
        harga: Number(row.harga) || 0,
        alatId: row.alat_id || null,
    }
}

export function mapHargaToApi(data: Partial<HargaSewaItem>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    if (data.namaAlat !== undefined) out.nama_alat = data.namaAlat
    if (data.kategori !== undefined) out.kategori = data.kategori
    if (data.jumlah !== undefined) out.jumlah = data.jumlah
    if (data.harga !== undefined) out.harga = data.harga
    if (data.alatId !== undefined) out.alat_id = data.alatId || null
    return out
}

// ===== Mappers Profil =====

interface ProfilApiRow {
    id: string
    nama_staff: string
    sejak: string
    uang_alat?: number | null
    logo_url?: string | null
}

export function mapProfilFromApi(row: ProfilApiRow): StaffAlatProfil {
    return {
        id: row.id,
        namaStaff: row.nama_staff,
        sejak: row.sejak,
        uangAlat: Number(row.uang_alat) || 0,
        logoUrl: row.logo_url || null,
    }
}

export function mapProfilToApi(data: Partial<StaffAlatProfil>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    if (data.namaStaff !== undefined) out.nama_staff = data.namaStaff
    if (data.sejak !== undefined) out.sejak = data.sejak
    if (data.uangAlat !== undefined) out.uang_alat = data.uangAlat
    if (data.logoUrl !== undefined) out.logo_url = data.logoUrl || null
    return out
}
