// src/features/staff-alat/lib/excelService.ts
// Port excelService.ts proyek sumber (tanpa Google Drive). Ekspor alat/sewa/tarif/profil.

import * as XLSX from 'xlsx'
import { Alat, HargaSewaItem, Sewa, StaffAlatProfil } from './staffAlatTypes'
import { mapKondisiToLabel } from './staffAlatTypes'

// ============================================================
// Ekspor Alat
// ============================================================

export function downloadAlatExcel(alatList: Alat[], fileName = 'Data_Alat_Mediatech.xlsx') {
    const rows = (alatList || []).map((item, idx) => ({
        'No': idx + 1,
        'Nama Alat': item.nama,
        'Kategori': item.kategori,
        'Kondisi': mapKondisiToLabel(item.kondisi),
        'Jumlah Total': item.jumlah || 1,
        'Keterangan': item.keterangan || '',
        'Serial Number': item.serial_number || '',
        'Lokasi': item.lokasi_penyimpanan || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
        { wch: 6 }, { wch: 40 }, { wch: 15 }, { wch: 25 },
        { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 15 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Alat')
    XLSX.writeFile(wb, fileName)
}

// ============================================================
// Ekspor Sewa
// ============================================================

export function downloadSewaExcel(sewaList: Sewa[], fileName = 'Data_Penyewaan_Mediatech.xlsx') {
    const rows = (sewaList || []).map((item, idx) => {
        const toolNames = (item.items || [])
            .map((i) => {
                const qty = i.jumlah || 1
                return `${i.namaAlat || i.alat?.nama || '(alat terhapus)'} (${qty}x)`
            })
            .join(', ')
        return {
            'No': idx + 1,
            'Nama Penyewa': item.namaPenyewa,
            'Jenis': item.jenis,
            'Barang Disewa': toolNames,
            'Kategori': item.kategori,
            'Tanggal Penyewaan': item.tanggalPenyewaan,
            'Tanggal Pengembalian': item.tanggalPengembalian,
            'Harga Sewa': item.hargaSewa,
            'Status Pembayaran': item.status,
            'Status Pengembalian': item.statusPengembalian,
            'Jaminan': item.jaminan || '',
            'Catatan': item.catatan || '',
        }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 50 }, { wch: 14 },
        { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 30 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Sewa')
    XLSX.writeFile(wb, fileName)
}

// ============================================================
// Ekspor Tarif
// ============================================================

export function downloadTarifExcel(hargaSewaList: HargaSewaItem[], fileName = 'Mediatech_Tarif_Harga_Sewa.xlsx') {
    const rows = (hargaSewaList || []).map((item) => ({
        'ID Tarif': item.id,
        'Nama Alat': item.namaAlat,
        'Kategori': item.kategori,
        'Jumlah Unit': item.jumlah || 1,
        'Harga Sewa (Rp)': item.harga || 0,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 36 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tarif Harga')
    XLSX.writeFile(wb, fileName)
}

// ============================================================
// Ekspor Backup 4-Sheet (profil & kas)
// ============================================================

export interface BackupPayload {
    alat: Alat[]
    sewa: Sewa[]
    hargaSewaList: HargaSewaItem[]
    profil: StaffAlatProfil
}

export function downloadExcelBackup(payload: BackupPayload, fileName = 'Mediatech_An_Nur_II_Data.xlsx') {
    const wb = XLSX.utils.book_new()

    const alatRows = (payload.alat || []).map((item, idx) => ({
        'No': idx + 1,
        'Nama Alat': item.nama,
        'Kategori': item.kategori,
        'Kondisi': mapKondisiToLabel(item.kondisi),
        'Jumlah': item.jumlah || 1,
        'Keterangan': item.keterangan || '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(alatRows), 'Data Alat')

    const sewaRows = (payload.sewa || []).map((item) => ({
        'Nama Penyewa': item.namaPenyewa,
        'Jenis': item.jenis,
        'Barang Disewa': (item.items || []).map((i) => `${i.namaAlat || i.alat?.nama || ''} (${i.jumlah}x)`).join(', '),
        'Kategori': item.kategori,
        'Tanggal Penyewaan': item.tanggalPenyewaan,
        'Tanggal Pengembalian': item.tanggalPengembalian,
        'Total Harga (Rp)': item.hargaSewa,
        'Status Pembayaran': item.status,
        'Status Pengembalian': item.statusPengembalian,
        'Jaminan': item.jaminan || '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sewaRows), 'Transaksi Sewa')

    const tarifRows = (payload.hargaSewaList || []).map((item) => ({
        'Nama Alat': item.namaAlat,
        'Kategori': item.kategori,
        'Jumlah Unit': item.jumlah || 1,
        'Harga Sewa (Rp)': item.harga,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tarifRows), 'Tarif Harga')

    const profilRows = [
        {
            'Nama Staff': payload.profil?.namaStaff || 'Pengurus Mediatech',
            'Menjabat Sejak': payload.profil?.sejak || '2026',
            'Saldo / Kas Uang Alat (Rp)': payload.profil?.uangAlat || 0,
        },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profilRows), 'Profil & Kas')

    XLSX.writeFile(wb, fileName)
}

// ============================================================
// Parser Excel (alat & tarif)
// ============================================================

export interface ParsedAlatItem {
    nama: string
    kategori: string
    kondisi: string // label kondisi (Baik, dst)
    jumlah: number
    keterangan: string
}

export interface ParsedTarifItem {
    namaAlat: string
    kategori: 'Umum' | 'Paket Santri'
    jumlah: number
    harga: number
}

function cleanItemName(str: string): string {
    if (!str) return ''
    return str.replace(/^[0-9]+[\.\)\-\s]+/, '').trim()
}

function isHeaderOrFooterText(str: string): boolean {
    const lower = str.toLowerCase().trim()
    if (!lower) return true
    const invalidTerms = [
        'no', 'no.', 'nomor', 'nama', 'nama alat', 'nama barang', 'item', 'peralatan',
        'kategori', 'kondisi', 'jumlah', 'qty', 'stok', 'keterangan', 'status',
        'total', 'subtotal', 'daftar alat', 'inventaris', 'mengetahui', 'diperiksa oleh',
        'catatan', 'table', 'no/nama', 'no / nama',
    ]
    return invalidTerms.includes(lower)
}

export function parseKondisi(str: string): string {
    const s = str.toLowerCase()
    if (s.includes('rusak bisa') || s.includes('rusak ringan')) return 'Rusak Bisa Digunakan'
    if (s.includes('rusak tidak') || s.includes('rusak berat')) return 'Rusak Tidak Bisa Digunakan'
    if (s.includes('perbaikan') || s.includes('servis')) return 'Perbaikan'
    if (s.includes('hilang')) return 'Hilang'
    if (s.includes('baik') || s.includes('normal') || s.includes('bagus')) return 'Baik'
    return 'Baik'
}

/** Parse file Excel (.xlsx/.xls/.csv) atau Word (.docx) menjadi daftar alat. */
export async function parseAlatFile(file: File, defaultCategory = 'Fotografi'): Promise<ParsedAlatItem[]> {
    const arrayBuffer = await file.arrayBuffer()
    const filename = file.name.toLowerCase()
    const extracted: ParsedAlatItem[] = []

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv')) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            if (!worksheet) return
            const raw2DRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: '' })
            if (!raw2DRows || raw2DRows.length === 0) return

            let sheetDefaultCategory = defaultCategory
            const trimmedSheetName = sheetName.trim()
            if (trimmedSheetName && !trimmedSheetName.toLowerCase().startsWith('sheet') && !trimmedSheetName.toLowerCase().startsWith('data')) {
                sheetDefaultCategory = trimmedSheetName
            }

            let headerRowIndex = -1
            let namaColIdx = -1
            let kategoriColIdx = -1
            let kondisiColIdx = -1
            let jumlahColIdx = -1
            let ketColIdx = -1

            for (let r = 0; r < Math.min(raw2DRows.length, 15); r++) {
                const rowCells = (raw2DRows[r] || []).map((c) => String(c || '').trim().toLowerCase())
                const hasNama = rowCells.some((c) => c.includes('nama') || c.includes('barang') || c.includes('item') || c.includes('peralatan') || c.includes('uraian') || c === 'alat')
                const hasKategori = rowCells.some((c) => c.includes('kategori') || c.includes('category') || c.includes('jenis'))
                const hasKondisi = rowCells.some((c) => c.includes('kondisi') || c.includes('status') || c.includes('keadaan'))
                const hasJumlah = rowCells.some((c) => c.includes('jumlah') || c.includes('qty') || c.includes('stok') || c.includes('banyak') || c.includes('unit') || c.includes('pcs'))

                if (hasNama || (hasKategori && hasJumlah) || (hasKondisi && hasJumlah)) {
                    headerRowIndex = r
                    rowCells.forEach((cellText, colIdx) => {
                        if (!cellText) return
                        if (namaColIdx === -1 &&
                            (cellText.includes('nama') || cellText.includes('barang') || cellText.includes('item') || cellText.includes('peralatan') || cellText.includes('uraian') || cellText === 'alat') &&
                            !cellText.includes('kategori') && !cellText.includes('kondisi') && !cellText.includes('jumlah') && !cellText.includes('status')) {
                            namaColIdx = colIdx
                        } else if (kategoriColIdx === -1 && (cellText.includes('kategori') || cellText.includes('category') || cellText.includes('jenis'))) {
                            kategoriColIdx = colIdx
                        } else if (kondisiColIdx === -1 && (cellText.includes('kondisi') || cellText.includes('status') || cellText.includes('keadaan'))) {
                            kondisiColIdx = colIdx
                        } else if (jumlahColIdx === -1 && (cellText.includes('jumlah') || cellText.includes('qty') || cellText.includes('stok') || cellText.includes('banyak') || cellText.includes('unit') || cellText.includes('pcs'))) {
                            jumlahColIdx = colIdx
                        } else if (ketColIdx === -1 && (cellText.includes('keterangan') || cellText.includes('catatan') || cellText.includes('deskripsi') || cellText === 'ket')) {
                            ketColIdx = colIdx
                        }
                    })
                    break
                }
            }

            const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0
            for (let r = startRow; r < raw2DRows.length; r++) {
                const rowArr = raw2DRows[r]
                if (!rowArr || rowArr.length === 0) continue

                let nama = ''
                let kategori = sheetDefaultCategory
                let kondisiStr = 'Baik'
                let jumlah = 1
                let keterangan = ''

                if (headerRowIndex !== -1 && namaColIdx !== -1 && rowArr[namaColIdx] !== undefined) {
                    nama = String(rowArr[namaColIdx] || '').trim()
                }
                if (!nama || isHeaderOrFooterText(nama) || !isNaN(Number(nama))) {
                    for (let c = 0; c < rowArr.length; c++) {
                        const val = String(rowArr[c] || '').trim()
                        if (val && !isHeaderOrFooterText(val) && isNaN(Number(val)) && val.length > 1) {
                            nama = val
                            break
                        }
                    }
                }
                nama = cleanItemName(nama)
                if (!nama || isHeaderOrFooterText(nama)) continue

                if (kategoriColIdx !== -1 && rowArr[kategoriColIdx]) {
                    const catVal = String(rowArr[kategoriColIdx]).trim()
                    if (catVal && !isHeaderOrFooterText(catVal)) kategori = catVal
                }
                if (kondisiColIdx !== -1 && rowArr[kondisiColIdx]) {
                    const konVal = String(rowArr[kondisiColIdx]).trim()
                    if (konVal && !isHeaderOrFooterText(konVal)) kondisiStr = konVal
                } else {
                    rowArr.forEach((cellVal) => {
                        const s = String(cellVal || '').toLowerCase()
                        if (s.includes('baik') || s.includes('rusak') || s.includes('perbaikan') || s.includes('hilang')) {
                            kondisiStr = String(cellVal)
                        }
                    })
                }
                if (jumlahColIdx !== -1 && rowArr[jumlahColIdx] !== undefined) {
                    const parsedNum = parseInt(String(rowArr[jumlahColIdx]))
                    if (!isNaN(parsedNum) && parsedNum > 0) jumlah = parsedNum
                } else {
                    rowArr.forEach((cellVal, cIdx) => {
                        if (cIdx !== namaColIdx && cIdx !== kategoriColIdx) {
                            const num = parseInt(String(cellVal))
                            if (!isNaN(num) && num > 0 && num < 1000) jumlah = num
                        }
                    })
                }
                if (ketColIdx !== -1 && rowArr[ketColIdx]) {
                    keterangan = String(rowArr[ketColIdx]).trim()
                }

                extracted.push({
                    nama,
                    kategori: kategori || sheetDefaultCategory,
                    kondisi: parseKondisi(kondisiStr),
                    jumlah: jumlah || 1,
                    keterangan,
                })
            }
        })
    } else if (filename.endsWith('.docx') || filename.endsWith('.doc')) {
        const { default: mammoth } = await import('mammoth')
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
        const textResult = await mammoth.extractRawText({ arrayBuffer })

        const doc = new DOMParser().parseFromString(htmlResult.value, 'text/html')
        const tables = doc.querySelectorAll('table')

        if (tables.length > 0) {
            tables.forEach((table) => {
                const trs = Array.from(table.querySelectorAll('tr'))
                let headerRowIndex = -1
                let namaColIdx = -1
                let kategoriColIdx = -1
                let kondisiColIdx = -1
                let jumlahColIdx = -1
                let ketColIdx = -1

                trs.forEach((tr, rIdx) => {
                    const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() || '')
                    const cellTextLower = cells.map((c) => c.toLowerCase())

                    if (headerRowIndex === -1 && cells.some((c) => c.toLowerCase().includes('nama') || c.toLowerCase().includes('alat') || c.toLowerCase().includes('barang'))) {
                        headerRowIndex = rIdx
                        cellTextLower.forEach((h, cIdx) => {
                            if (namaColIdx === -1 &&
                                (h.includes('nama') || h.includes('barang') || h.includes('item') || h.includes('peralatan') || h === 'alat') &&
                                !h.includes('kategori') && !h.includes('kondisi') && !h.includes('jumlah')) {
                                namaColIdx = cIdx
                            } else if (kategoriColIdx === -1 && h.includes('kategori')) {
                                kategoriColIdx = cIdx
                            } else if (kondisiColIdx === -1 && (h.includes('kondisi') || h.includes('status'))) {
                                kondisiColIdx = cIdx
                            } else if (jumlahColIdx === -1 && (h.includes('jumlah') || h.includes('qty') || h.includes('stok'))) {
                                jumlahColIdx = cIdx
                            } else if (ketColIdx === -1 && (h.includes('keterangan') || h.includes('catatan') || h === 'ket')) {
                                ketColIdx = cIdx
                            }
                        })
                        return
                    }

                    if (headerRowIndex !== -1 && rIdx <= headerRowIndex) return

                    let nama = ''
                    let kategori = defaultCategory
                    let kondisiStr = 'Baik'
                    let jumlah = 1
                    let keterangan = ''

                    if (namaColIdx !== -1 && cells[namaColIdx]) nama = cells[namaColIdx]
                    if (!nama || isHeaderOrFooterText(nama)) {
                        for (let c = 0; c < cells.length; c++) {
                            const val = cells[c]
                            if (val && !isHeaderOrFooterText(val) && isNaN(Number(val))) {
                                nama = val
                                break
                            }
                        }
                    }
                    nama = cleanItemName(nama)
                    if (!nama || isHeaderOrFooterText(nama)) return

                    if (kategoriColIdx !== -1 && cells[kategoriColIdx]) kategori = cells[kategoriColIdx]
                    else if (cells.length >= 2 && cells[1] && isNaN(Number(cells[1]))) kategori = cells[1]
                    if (kondisiColIdx !== -1 && cells[kondisiColIdx]) kondisiStr = cells[kondisiColIdx]
                    if (jumlahColIdx !== -1 && cells[jumlahColIdx]) {
                        const parsedNum = parseInt(cells[jumlahColIdx])
                        if (!isNaN(parsedNum)) jumlah = parsedNum
                    }
                    if (ketColIdx !== -1 && cells[ketColIdx]) keterangan = cells[ketColIdx]

                    extracted.push({
                        nama,
                        kategori: kategori || defaultCategory,
                        kondisi: parseKondisi(kondisiStr),
                        jumlah: jumlah || 1,
                        keterangan,
                    })
                })
            })
        }

        if (extracted.length === 0) {
            const lines = textResult.value.split('\n').map((l) => l.trim()).filter(Boolean)
            lines.forEach((line) => {
                const parts = line.split(/[\t,|;]+/).map((p) => p.trim())
                if (parts.length >= 1 && parts[0]) {
                    const nama = cleanItemName(parts[0])
                    if (nama && !isHeaderOrFooterText(nama)) {
                        extracted.push({
                            nama,
                            kategori: parts[1] || defaultCategory,
                            kondisi: parseKondisi(parts[2] || 'Baik'),
                            jumlah: parseInt(parts[3]) || 1,
                            keterangan: parts[4] || '',
                        })
                    }
                }
            })
        }
    }

    return extracted
}

/** Parse file Excel tarif (.xlsx/.xls/.csv) menjadi daftar tarif. */
export async function parseTarifFile(file: File): Promise<ParsedTarifItem[]> {
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array' })

    let sheetName = 'Tarif Harga'
    if (!wb.SheetNames.includes(sheetName) && wb.SheetNames.length > 0) {
        sheetName = wb.SheetNames[0]
    }
    const ws = wb.Sheets[sheetName]
    if (!ws) return []

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws)
    return rows
        .map((r) => {
            const namaAlat = String(r['Nama Alat'] || r['nama_alat'] || r['Nama'] || r['Barang'] || '').trim()
            if (!namaAlat) return null
            const kategori = r['Kategori'] || r['kategori']
            return {
                namaAlat,
                kategori: String(kategori).toLowerCase().includes('paket') ? ('Paket Santri' as const) : ('Umum' as const),
                jumlah: Math.max(1, Number(r['Jumlah Unit'] || r['Jumlah'] || r['jumlah']) || 1),
                harga: Math.max(0, Number(r['Harga Sewa (Rp)'] || r['Harga Sewa'] || r['Harga'] || r['harga']) || 0),
            }
        })
        .filter((x): x is ParsedTarifItem => x !== null)
}
