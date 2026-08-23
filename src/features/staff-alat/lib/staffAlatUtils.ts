// src/features/staff-alat/lib/staffAlatUtils.ts
// Port dari proyek sumber staff-alat (src/utils.ts) — diadaptasi ke tipe Alat SantriMedia.

import { Alat, Sewa, StatusAlat, StatusSewa } from './staffAlatTypes'

/**
 * Helper to parse quantity/imbuhan from a tool name or ID entry string.
 * - "Sony Alpha A7 III" -> 1
 * - "Sony Alpha A7 III (2 unit)" -> 2
 * - "Sony Alpha A7 III 3 pcs" -> 3
 * - "2 unit Sony Alpha A7 III" -> 2
 */
export function parseQtyFromEntry(entryStr: string): number {
    if (!entryStr) return 1

    const parenMatch = entryStr.match(/\(\s*(\d+)\s*(?:unit|pcs|buah|pax|set|x)?\s*\)/i)
    if (parenMatch && parenMatch[1]) {
        const val = parseInt(parenMatch[1], 10)
        if (!isNaN(val) && val > 0) return val
    }

    const suffixMatch = entryStr.match(/(\d+)\s*(?:unit|pcs|buah|pax|set|x)\b/i) || entryStr.match(/\b(?:x)\s*(\d+)\b/i)
    if (suffixMatch && suffixMatch[1]) {
        const val = parseInt(suffixMatch[1], 10)
        if (!isNaN(val) && val > 0) return val
    }

    const prefixMatch = entryStr.match(/^\s*(\d+)\s*(?:unit|pcs|buah|pax|set|x)?\s+/i)
    if (prefixMatch && prefixMatch[1]) {
        const val = parseInt(prefixMatch[1], 10)
        if (!isNaN(val) && val > 0) return val
    }

    return 1
}

/** Finds matching tool in allTools array based on ID or tool name. */
export function findMatchingTool(entryStr: string, allTools: Alat[]): Alat | undefined {
    if (!entryStr || !allTools || allTools.length === 0) return undefined

    const trimmed = entryStr.trim().toLowerCase()

    const byId = allTools.find((a) => a.id === entryStr)
    if (byId) return byId

    const byExactName = allTools.find((a) => a.nama.trim().toLowerCase() === trimmed)
    if (byExactName) return byExactName

    const sortedTools = [...allTools].sort((a, b) => b.nama.length - a.nama.length)
    for (const tool of sortedTools) {
        const toolNameLower = tool.nama.trim().toLowerCase()
        if (trimmed.includes(toolNameLower) || toolNameLower.includes(trimmed)) {
            return tool
        }
    }

    return undefined
}

function isSewaUnreturned(s: Sewa): boolean {
    return s.statusPengembalian ? s.statusPengembalian === 'Belum Mengembalikan' : s.status !== 'Lunas'
}

/** Calculates total rented quantity for a specific tool from active (unreturned) rentals. */
export function calculateRentedCountForTool(tool: Alat, sewaList: Sewa[]): number {
    if (!sewaList || sewaList.length === 0) return 0

    let totalRented = 0
    for (const s of sewaList) {
        if (!isSewaUnreturned(s)) continue
        for (const item of s.items || []) {
            if (item.alatId === tool.id) {
                totalRented += item.jumlah || 1
            }
        }
    }
    return totalRented
}

/**
 * Determines status of a tool based on current rented count and stock.
 * If any active rental has jenis === 'Peminjaman', returns 'Dipakai'.
 */
export function getToolStatus(
    tool: Alat,
    rentedCount: number,
    sewaList?: Sewa[]
): StatusAlat {
    const totalStock = tool.jumlah || 1

    if (rentedCount > 0) {
        if (sewaList && sewaList.length > 0) {
            const hasPeminjaman = sewaList.some((s) => {
                if (!isSewaUnreturned(s)) return false
                return s.jenis === 'Peminjaman' && (s.items || []).some((i) => i.alatId === tool.id)
            })
            if (hasPeminjaman) return 'Dipakai'
        }
        return 'Disewa'
    }

    if (totalStock <= 0) return 'Tidak Ada/Rusak'
    if (tool.kondisi === 'maintenance') return 'Diperbaiki'
    if (tool.kondisi === 'rusak_berat') return 'Tidak Ada/Rusak'
    return 'Tersedia'
}

/** Calculates overall total rented units across all tools for active unreturned rentals. */
export function calculateTotalRentedUnitsOnDashboard(sewaList: Sewa[]): number {
    if (!sewaList || sewaList.length === 0) return 0
    return sewaList
        .filter(isSewaUnreturned)
        .reduce((sum, s) => sum + (s.items || []).reduce((acc, i) => acc + (i.jumlah || 1), 0), 0)
}

/** Resolves keterangan/status bayar yang benar untuk pembayaran (auto Terlambat). */
export function resolvePaymentStatus(sewa: Sewa): StatusSewa {
    if (sewa.status === 'Terlambat') return 'Terlambat'
    const daysLeft = daysBetween(new Date().toISOString().slice(0, 10), sewa.tanggalPengembalian)
    if (daysLeft < 0 && sewa.statusPengembalian === 'Belum Mengembalikan') return 'Terlambat'
    return sewa.status
}

/** Days between two YYYY-MM-DD strings (target - from). */
export function daysBetween(fromStr: string, toStr: string): number {
    const from = new Date(`${fromStr}T00:00:00Z`)
    const to = new Date(`${toStr}T00:00:00Z`)
    return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

/** Format Rupiah. */
export function formatRupiah(value: number): string {
    return `Rp ${(Number(value) || 0).toLocaleString('id-ID')}`
}

/** Ekstrak pesan error dari nilai yang di-throw (unknown). */
export function getErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
        const msg = (err as { message: unknown }).message
        if (typeof msg === 'string' && msg.trim()) return msg
    }
    return fallback
}
