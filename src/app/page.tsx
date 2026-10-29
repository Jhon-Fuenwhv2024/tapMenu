import Link from "next/link";
import { TapMenuLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="relative min-h-[100svh] overflow-hidden hero-mesh text-white">
        <div className="noise-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col px-5 pb-16 pt-8">
          <nav className="flex items-center justify-between animate-fade-up">
            <TapMenuLogo size="md" className="text-white [&_span]:text-[#ffb347]" />
            <div className="flex gap-2">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
          </nav>

          <div className="mt-auto max-w-2xl pb-8 pt-20 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              TapMenu
            </h1>
            <p className="mt-4 max-w-lg text-lg text-white/85 sm:text-xl">
              Un toque NFC, el menú en la mesa. Pedidos en grupo, cocina en vivo
              y Carta 4D para restaurantes de Colombia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/r/resto-demo/m/t1">Probar demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Link href="/login">Panel del local</Link>
              </Button>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--paper)] to-transparent"
          aria-hidden
        />
      </header>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--brand)]">
          Hecho para mesas reales
        </h2>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Cada mesa tiene sticker NFC y QR. El cliente abre la carta ya ligada a
          su mesa, pide en grupo y cocina recibe el pedido al instante.
        </p>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            {
              t: "Carta 4D",
              d: "Modelos 3D y AR en el plato. Gira, amplía y míralo en tu mesa.",
            },
            {
              t: "Pedidos en grupo",
              d: "Varios celulares, una sola cuenta por mesa. Cada ítem con su persona.",
            },
            {
              t: "Cocina en vivo",
              d: "KDS con alertas sonoras, llamado a mesero y cuenta dividida.",
            },
          ].map((f, i) => (
            <li
              key={f.t}
              className="animate-fade-up"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <h3 className="text-lg font-semibold text-[var(--ink)]">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {f.d}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-black/5 px-5 py-8 text-center text-sm text-[var(--muted)]">
        TapMenu · Jhon Fuentes · El Banco, Magdalena · Colombia
      </footer>
    </div>
  );
}
