'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, X, Send, Sparkles, CalendarCheck, Phone } from 'lucide-react'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function ConciergeWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Bienvenido a All Rent Hoteles Quintero 🌊. Soy tu Concierge Virtual. Pregúntame por nuestras 5 habitaciones ($39.500 a $79.500), estacionamiento gratis, playa al frente o reserva online.',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendQuery(customText?: string) {
    const text = (customText ?? input).trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    if (!customText) setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode: 'concierge', history: next }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.reply ||
            'Nuestras tarifas van de $39.500 a $79.500 con Check-in 12:00 a 12:00 en Av. Bulnes 119, Quintero.',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Puedes reservar online en /reservar o escribirnos directo al WhatsApp +56 9 9865 1440.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5">
      {open && (
        <div className="w-[330px] sm:w-[375px] rounded-3xl bg-[#000000] border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.92)] overflow-hidden">
          <div className="bg-[#000000] border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#39FF14] text-[#000000] flex items-center justify-center font-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">Concierge All Rent</p>
                <p className="text-[11px] text-[#39FF14] font-semibold">En línea · Av. Bulnes 119</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/56998651440?text=Hola%20All%20Rent%20Hoteles,%20quiero%20consultar%20disponibilidad"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp Central de Reservas"
                className="p-2 rounded-lg bg-white/5 text-[#39FF14] hover:bg-white/10"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-3 text-xs sm:text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#39FF14] text-[#000000] font-semibold ml-8'
                    : 'bg-[#000000] text-white/90 border border-white/10 mr-4'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-2xl bg-[#000000] text-white/60 text-xs mr-8">
                Escribiendo respuesta...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Chips */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {['Ver Tarifas', 'Horarios 12:00', 'Ubicación Playa'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuery(q)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80 hover:border-[#39FF14] hover:text-[#39FF14] cursor-pointer"
              >
                {q}
              </button>
            ))}
            <Link
              href="/reservar"
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#39FF14]/20 border border-[#39FF14]/40 text-[11px] font-bold text-[#39FF14]"
            >
              <CalendarCheck className="w-3 h-3" /> Reservar
            </Link>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendQuery()
            }}
            className="p-3 border-t border-white/10 flex gap-2 bg-[#000000]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Consulta tarifas o servicios..."
              className="flex-1 bg-[#000000] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39FF14]"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-[#39FF14] text-[#000000] font-bold hover:bg-[#52ff33] cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Compact Non-Obstructive Floating Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Abrir Concierge Virtual"
        className="group h-13 px-4 rounded-full bg-[#000000] backdrop-blur-xl border border-[#39FF14]/60 text-white shadow-[0_8px_30px_rgba(0,0,0,0.85)] hover:bg-[#39FF14] hover:text-[#000000] flex items-center gap-2.5 transition-all cursor-pointer"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] group-hover:bg-[#000000] animate-pulse" />
        <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
          Concierge & WhatsApp
        </span>
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 text-[#39FF14] group-hover:text-[#000000]" />}
      </button>
    </div>
  )
}
