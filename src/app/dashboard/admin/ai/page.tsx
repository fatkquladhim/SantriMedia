'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Bot, Zap, Brain, ShieldCheck, Activity, Settings2, PlayCircle } from 'lucide-react'

export default function AdminAIPanelPage() {
    const agents = [
        {
            id: 'task-dispatcher',
            name: 'AI Task Dispatcher',
            description: 'Menganalisis beban kerja dan merekomendasikan penugasan staf yang optimal.',
            status: 'active',
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-100'
        },
        {
            id: 'grading-assistant',
            name: 'Grading Assistant',
            description: 'Memberikan saran nilai (grade) berdasarkan performa tugas dan kedisiplinan.',
            status: 'active',
            icon: Brain,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            id: 'inventory-anomaly',
            name: 'Inventory Anomaly Radar',
            description: 'Mendeteksi pola peminjaman alat yang tidak wajar atau risiko kehilangan.',
            status: 'active',
            icon: ShieldCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        }
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI Agent Intelligence Panel</h1>
                    <p className="text-slate-500 mt-1">Pantau dan kelola assistan kecerdasan buatan sistem ERP.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="success" className="h-8 px-4 flex items-center gap-2">
                        <Activity size={14} className="animate-pulse" />
                        Semua Agent Online
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {agents.map((agent) => {
                    const Icon = agent.icon
                    return (
                        <Card key={agent.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform ${agent.color}`}>
                                <Icon size={80} />
                            </div>
                            <CardHeader>
                                <div className={`p-3 w-fit rounded-xl ${agent.bg} ${agent.color} mb-2`}>
                                    <Icon size={24} />
                                </div>
                                <CardTitle>{agent.name}</CardTitle>
                                <CardDescription className="min-h-[3rem]">{agent.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Status Operasi</span>
                                    <Badge variant="success">Running</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Uptime</span>
                                    <span className="font-medium">99.9%</span>
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <Button className="flex-1 flex items-center justify-center gap-2">
                                        <PlayCircle size={16} />
                                        Test Agent
                                    </Button>
                                    <Button variant="outline" className="p-2 h-10 w-10 flex items-center justify-center">
                                        <Settings2 size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card className="bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Bot className="text-blue-400" />
                        <CardTitle>Global AI Training & Logs</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 font-mono text-sm text-blue-100/70">
                        <p className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold">[SYSTEM]</span> Initializing neural link via OpenRouter...
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold">[MODEL]</span> glm-4.5-air connected and ready.
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold">[SYNC]</span> Metadata profiles cached for 42 users.
                        </p>
                        <div className="pt-4 border-t border-white/10 mt-4">
                            <p className="text-white/40 italic text-xs">// Semua prediksi agent diproses menggunakan context pesantren terpadu.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}