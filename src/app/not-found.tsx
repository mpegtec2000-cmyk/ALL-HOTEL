import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 text-center">
      <p className="text-[#39FF14] font-black text-6xl mb-3">404</p>
      <h1 className="text-2xl font-extrabold mb-2">Página no encontrada</h1>
      <p className="text-white/70 text-sm mb-6 max-w-md">
        Regresa al inicio de All Rent Hoteles Quintero para revisar habitaciones o gestionar tu reserva.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-[#39FF14] text-[#000000] font-extrabold text-xs uppercase tracking-wider"
      >
        Volver al Hotel
      </Link>
    </div>
  )
}
