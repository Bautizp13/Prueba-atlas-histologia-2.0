import { useState, useEffect } from 'react'
import ImageMarkerTool from './components/ImageMarkerTool';
import { MastocitoPensando, MastocitoCorriendo, MastocitoSaludando, MastocitoSorprendido } from './Mastocito'

// ─── Imágenes ────────────────────────────────────────────────────────────────
// Las fotos viven en /public/images/. Para agregar o reemplazar una foto,
// simplemente coloca el archivo en esa carpeta con el nombre indicado acá.
// Ver README.md para la tabla completa (qué foto va en cada archivo).
function img(filename: string) {
  return `${import.meta.env.BASE_URL}images/${filename}`
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Marker { x: number; y: number; label: string; question?: string }
interface Annotation { label: string; text: string }

interface Slide {
  id: number
  name: string
  tissue: string       // used to group blocks
  structure: string
  stain: string
  img: string
  markers: Marker[]
  annotations: Annotation[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

// Los preparados se cargan automáticamente desde content/preparados/*.json
// (esos archivos los edita el panel de administración en /admin, sin tocar código).
const preparadoFiles = import.meta.glob('/content/preparados/*.json', { eager: true }) as Record<string, { default: any }>

const SLIDES: Slide[] = Object.values(preparadoFiles)
  .map((mod) => {
    const raw = mod.default
    // El campo "img" puede venir como "/images/foto.jpg" (desde el CMS) o como nombre de archivo suelto.
    const filename = String(raw.img).replace(/^\/?images\//, '')
    return {
      id: raw.id,
      name: raw.name,
      tissue: raw.tissue,
      structure: raw.structure,
      stain: raw.stain,
      img: img(filename),
      markers: raw.markers ?? [],
      annotations: raw.annotations ?? [],
    } as Slide
  })
  .sort((a, b) => a.id - b.id)


// Color per tissue block
const TISSUE_COLORS: Record<string, { accent: string; bg: string; border: string; badge: string }> = {
  'Tejido Epitelial':  { accent: '#b5365a', bg: '#fff0f3', border: 'rgba(181,54,90,0.18)',  badge: 'rgba(181,54,90,0.1)' },
  'Tejido Conectivo':  { accent: '#8b4f6b', bg: '#f9f0f5', border: 'rgba(139,79,107,0.18)', badge: 'rgba(139,79,107,0.1)' },
  'Tejido Muscular':   { accent: '#c0405a', bg: '#fff5f7', border: 'rgba(192,64,90,0.18)',   badge: 'rgba(192,64,90,0.1)' },
  'Tejido Nervioso':   { accent: '#7a3d72', bg: '#faf0fa', border: 'rgba(122,61,114,0.18)',  badge: 'rgba(122,61,114,0.1)' },
  'Tejido Epitelial de Revestimiento':   { accent: '#b5365a', bg: '#faf0fa', border: 'rgba(122,61,114,0.18)',  badge: 'rgba(122,61,114,0.1)' },

}

function tissueColor(tissue: string) {
  return TISSUE_COLORS[tissue] ?? { accent: '#b5365a', bg: '#fff0f3', border: 'rgba(181,54,90,0.18)', badge: 'rgba(181,54,90,0.1)' }
}

// ─── Red Arrow ───────────────────────────────────────────────────────────────

function RedArrow({ x, y, label, color = '#FFEB00' }: { x: number; y: number; label: string; color?: string }) {
  return (
    <div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}
      className="pointer-events-none select-none"
    >
      <svg width="44" height="50" viewBox="0 0 44 50" fill="none">
        <line x1="22" y1="6" x2="22" y2="38" stroke="#1a1a1a" strokeWidth="4.5" strokeLinecap="round"/>
        <line x1="22" y1="6" x2="22" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points="22,47 13,31 31,31" fill={color} stroke="#1a1a1a" strokeWidth="1"/>
        <circle cx="22" cy="8" r="7.5" fill={color} stroke="#1a1a1a" strokeWidth="1"/>
        <text x="22" y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1a1a1a" fontFamily="Inter, sans-serif">{label}</text>
      </svg>
    </div>
  )
}

// ─── Slide Card ───────────────────────────────────────────────────────────────

function SlideCard({ slide }: { slide: Slide }) {
  const [showMarked, setShowMarked] = useState(false)
  const tc = tissueColor(slide.tissue)

  return (
    <article style={{
      background: 'var(--surface)',
      border: `1px solid ${tc.border}`,
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(180,80,110,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${tc.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: tc.accent, background: tc.badge, padding: '3px 9px', borderRadius: '20px',
          }}>
            {slide.stain}
          </span>
        </div>
        <h3 className="font-display" style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3 }}>
          {slide.name}
        </h3>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>{slide.structure}</p>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', padding: '12px 22px', gap: '8px', background: tc.bg, borderBottom: `1px solid ${tc.border}` }}>
        {['Sin marcar', 'Marcado'].map((label, i) => {
          const active = showMarked === (i === 1)
          return (
            <button
              key={label}
              onClick={() => setShowMarked(i === 1)}
              style={{
                padding: '6px 18px', borderRadius: '20px',
                border: active ? `1.5px solid ${tc.accent}` : '1.5px solid transparent',
                background: active ? tc.accent : 'rgba(255,255,255,0.7)',
                color: active ? '#fff' : tc.accent,
                fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.18s ease', fontFamily: 'Inter, sans-serif',
                boxShadow: active ? `0 2px 8px ${tc.badge}` : 'none',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', background: '#f3e8ec' }}>
        <img
          src={slide.img}
          alt={slide.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {showMarked && slide.markers.map(m => (
          <RedArrow key={m.label} x={m.x} y={m.y} label={m.label} />
        ))}
        {!showMarked && (
          <div style={{
            position: 'absolute', bottom: '10px', right: '12px',
            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)',
            padding: '4px 10px', borderRadius: '20px',
            fontSize: '11px', color: tc.accent, fontWeight: 500,
          }}>
            Vista sin marcar
          </div>
        )}
      </div>

      {/* Annotations */}
      {showMarked && (
        <div style={{ padding: '18px 22px', borderTop: `1px solid ${tc.border}`, background: tc.bg, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: tc.accent, fontWeight: 600 }}>
            Estructuras marcadas
          </p>
          {slide.annotations.map(a => (
            <div key={a.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
                background: tc.accent, color: '#fff', fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px',
              }}>
                {a.label}
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.65 }}>{a.text}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

// ─── Tissue Block ─────────────────────────────────────────────────────────────

function TissueBlock({ tissue, slides, defaultOpen = false }: { tissue: string; slides: Slide[]; defaultOpen?: boolean }) {
  const tc = tissueColor(tissue)
  const [open, setOpen] = useState(defaultOpen)

  // Si una búsqueda activa hace que este bloque tenga resultados, se abre solo
  useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  return (
    <section style={{ marginBottom: '20px' }}>
      {/* Block header (clickeable) */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '14px',
          marginBottom: open ? '24px' : '0',
          padding: '0 0 16px',
          background: 'none',
          border: 'none',
          borderBottom: `2px solid ${tc.border}`,
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
        }}
      >
        <MastocitoCorriendo height={44} animate={false} />
        <div style={{ flex: 1 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 400, color: tc.accent, lineHeight: 1 }}>
            {tissue}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
            {slides.length} preparado{slides.length !== 1 ? 's' : ''}
          </p>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 20 20" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke={tc.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Cards grid */}
      {open && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(440px, 100%), 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {slides.map(s => <SlideCard key={s.id} slide={s} />)}
        </div>
      )}
    </section>
  )
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

function Flashcard({ slide, onNext, onPrev, index, total, revealed, onReveal }: {
  slide: Slide; onNext: () => void; onPrev: () => void; index: number; total: number
  revealed: boolean; onReveal: () => void
}) {
  const tc = tissueColor(slide.tissue)
  const marker = slide.markers[0]
  const annotation = slide.annotations[0]

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Preparado <strong style={{ color: 'var(--text)' }}>{index + 1}</strong> de {total}
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: i === index ? tc.accent : 'var(--border)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)',
        border: `1.5px solid ${tc.border}`,
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(180,80,110,0.09)',
      }}>
        {/* Question banner */}
        <div style={{
          padding: '12px 20px',
          background: tc.badge,
          borderBottom: `1px solid ${tc.border}`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7.5" stroke={tc.accent} strokeWidth="1.4"/>
            <text x="8" y="12.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={tc.accent} fontFamily="Inter, sans-serif">?</text>
          </svg>
          <p style={{ margin: 0, fontSize: '13px', color: tc.accent, fontWeight: 500 }}>
            {marker.question?.trim() || '¿Qué estructura señala la flecha roja?'}
          </p>
        </div>

        {/* Image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f3e8ec' }}>
          <img
            src={slide.img}
            alt={slide.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <RedArrow x={marker.x} y={marker.y} label="?" />
        </div>

        {/* Answer */}
        <div style={{ padding: '20px 22px' }}>
          {!revealed ? (
            <button
              onClick={onReveal}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '10px', border: 'none',
                background: tc.accent, color: '#fff',
                fontSize: '14.5px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
                transition: 'opacity 0.15s', boxShadow: `0 4px 14px ${tc.badge}`,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Revelar respuesta →
            </button>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Main answer */}
              <div style={{
                border: `1.5px solid ${tc.border}`,
                borderRadius: '10px', overflow: 'hidden', marginBottom: '10px',
              }}>
                <div style={{ background: tc.bg, padding: '12px 16px', borderBottom: `1px solid ${tc.border}` }}>
                  <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: tc.accent, fontWeight: 600 }}>
                    La flecha roja señala:
                  </p>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p className="font-display" style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--text)' }}>
                    {slide.structure}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.65 }}>
                    {annotation.text}
                  </p>
                </div>
              </div>

              {/* All annotations */}
              {slide.annotations.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {slide.annotations.map(a => (
                    <div key={a.label} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '10px 14px',
                      background: tc.bg, borderRadius: '8px',
                      border: `1px solid ${tc.border}`,
                    }}>
                      <span style={{
                        flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                        background: tc.accent, color: '#fff', fontSize: '9.5px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px',
                      }}>
                        {a.label}
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.6 }}>{a.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }}>
        <button
          onClick={onPrev}
          disabled={index === 0}
          style={{
            padding: '10px 26px', borderRadius: '8px',
            border: '1.5px solid var(--border)', background: 'transparent',
            color: 'var(--muted)', fontSize: '13.5px', fontWeight: 500,
            cursor: index === 0 ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif',
            opacity: index === 0 ? 0.35 : 1,
          }}
        >
          ← Anterior
        </button>
        <button
          onClick={onNext}
          disabled={index === total - 1}
          style={{
            padding: '10px 26px', borderRadius: '8px',
            border: `1.5px solid ${tc.border}`, background: tc.bg,
            color: tc.accent, fontSize: '13.5px', fontWeight: 600,
            cursor: index === total - 1 ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif',
            opacity: index === total - 1 ? 0.35 : 1,
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Tab = 'atlas' | 'repaso'

function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 100)
    const t2 = setTimeout(() => setPhase('out'), 3200)
    const t3 = setTimeout(onDone, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#fdf4f7',
      opacity: phase === 'out' ? 0 : phase === 'in' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.7s ease' : phase === 'in' ? 'none' : 'opacity 0.4s ease',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <circle cx="8%" cy="15%" r="60" fill="#f4d0db" opacity="0.5" />
        <circle cx="90%" cy="80%" r="90" fill="#e8d0f0" opacity="0.4" />
        <rect x="80%" y="8%" width="70" height="70" rx="14" fill="#fbe0e8" opacity="0.5" transform="rotate(20,80,8)" />
        <rect x="5%" y="70%" width="50" height="50" rx="10" fill="#dce0f8" opacity="0.45" transform="rotate(-15,5,70)" />
        <circle cx="50%" cy="92%" r="40" fill="#fce8ed" opacity="0.55" />
        <polygon points="88,20 108,60 68,60" fill="#f4a5b5" opacity="0.3" style={{ transform: 'translate(40px,320px)' }} />
        <polyline points="0,200 30,180 60,200 90,180 120,200" stroke="#e8a0b4" strokeWidth="3" fill="none" opacity="0.3" />
        <polyline points="1100,100 1130,80 1160,100 1190,80 1220,100" stroke="#c49bd4" strokeWidth="3" fill="none" opacity="0.3" />
      </svg>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
        transform: phase === 'visible' ? 'translateY(0)' : 'translateY(20px)',
        opacity: phase === 'visible' ? 1 : 0,
        transition: 'transform 0.5s ease, opacity 0.5s ease',
      }}>
        <MastocitoSaludando height={260} />

        <div style={{
          background: 'white',
          border: '2.5px solid #e8a0b4',
          borderRadius: '20px',
          padding: '16px 32px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(181,54,90,0.1)',
          maxWidth: '320px', textAlign: 'center',
        }}>
          <div style={{
            position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '16px solid #e8a0b4',
          }} />
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '13px solid white',
          }} />
          <p style={{
            margin: 0, fontFamily: "'Fraunces', serif",
            fontSize: '24px', color: '#b5365a', fontWeight: 700, lineHeight: 1.2,
          }}>
            ¡Hola, soy Mastocito!
          </p>
          <p style={{
            margin: '8px 0 0', fontFamily: "'Inter', sans-serif",
            fontSize: '13.5px', color: '#9b7080', lineHeight: 1.5,
          }}>
            Tu guía en el atlas de histología
          </p>
        </div>

        <button
          onClick={() => { setPhase('out'); setTimeout(onDone, 700) }}
          style={{
            padding: '10px 28px', borderRadius: '24px',
            border: '2px solid rgba(181,54,90,0.3)',
            background: 'transparent', color: '#b5365a',
            fontSize: '13px', fontFamily: "'Inter', sans-serif",
            fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(181,54,90,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Entrar al atlas →
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('atlas')
  const [cardIndex, setCardIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [query, setQuery] = useState('')
  const [welcomed, setWelcomed] = useState(false)

  const filtered = query.trim()
    ? SLIDES.filter(s =>
        [s.name, s.tissue, s.structure, s.stain].some(f =>
          f.toLowerCase().includes(query.toLowerCase())
        )
      )
    : SLIDES

  // Group slides by tissue
  const groups = filtered.reduce<Record<string, Slide[]>>((acc, slide) => {
    ;(acc[slide.tissue] ??= []).push(slide)
    return acc
  }, {})

  return (
    <>
      {!welcomed && <WelcomeScreen onDone={() => setWelcomed(true)} />}

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(253,246,248,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(200,140,165,0.2)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '10px clamp(14px, 4vw, 28px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minHeight: '62px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <MastocitoSaludando height={46} animate={false} />
            <span style={{
              fontFamily: 'Belanosima, sans-serif',
              fontWeight: 800,
              fontSize: '17px',
              color: 'var(--rose-dark)',
              letterSpacing: '0.2px',
              lineHeight: '21px',
              border: 'none',
              textAlign: 'left',
              whiteSpace: 'normal',
            }}>
              Área de Histología y Embriología
            </span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: '4px', background: 'rgba(200,140,165,0.1)', padding: '4px', borderRadius: '10px' }}>
            {([['atlas', 'Atlas'], ['repaso', 'Modo Repaso']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '7px 20px', borderRadius: '7px',
                  border: 'none',
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? '#b5365a' : 'var(--muted)',
                  fontSize: '13.5px', fontWeight: tab === key ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.18s ease',
                  boxShadow: tab === key ? '0 1px 6px rgba(180,80,110,0.12)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(24px, 6vw, 44px) clamp(16px, 5vw, 28px) 60px' }}>

        {/* ── ATLAS ── */}
        {tab === 'atlas' && (
          <>
            <div style={{ marginBottom: '44px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b5365a', fontWeight: 600 }}>
                Colección de preparados
              </p>
              <h1 className="font-display" style={{ margin: '0 0 10px', lineHeight: 1.05 }}>
                <span style={{ display: 'block', fontSize: 'clamp(32px, 7.5vw, 46px)', fontWeight: 400, color: 'var(--rose-dark)' }}>
                  Atlas Virtual
                </span>
                <span style={{ display: 'block', fontSize: 'clamp(30px, 7vw, 44px)', fontStyle: 'italic', fontWeight: 400, color: '#c0405a' }}>
                  de Histología
                </span>
              </h1>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--muted)', maxWidth: '500px', lineHeight: 1.7 }}> </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '32px', position: 'relative', maxWidth: '480px' }}>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#b5365a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.6 }}
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre, tejido, estructura…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px 11px 40px',
                  border: '1.5px solid rgba(200,140,165,0.3)',
                  borderRadius: '20px', background: '#fff',
                  fontSize: '14px', color: 'var(--text)',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none', transition: 'border-color 0.18s',
                  boxShadow: '0 1px 6px rgba(180,80,110,0.06)',
                  paddingRight: '20px',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#b5365a')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(200,140,165,0.3)')}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', fontSize: '18px', lineHeight: 1, padding: '2px',
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Tissue blocks */}
            {Object.keys(groups).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <p className="font-display" style={{ fontSize: '22px', margin: '0 0 8px', color: '#b5365a' }}>Sin resultados</p>
                <p style={{ margin: 0, fontSize: '14px' }}>No se encontraron preparados para <em>"{query}"</em></p>
              </div>
            ) : (
              Object.entries(groups).map(([tissue, slides]) => (
                <TissueBlock key={tissue} tissue={tissue} slides={slides} defaultOpen={query.trim().length > 0} />
              ))
            )}
          </>
        )}

        {/* ── REPASO ── */}
        {tab === 'repaso' && (
          <>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b5365a', fontWeight: 600 }}>
                Modo Repaso
              </p>
              <h1 className="font-display" style={{ margin: '0 0 10px', fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 400, color: 'var(--rose-dark)', lineHeight: 1.2 }}>
                Flashcards Histológicas
              </h1>
              <p style={{ margin: '0 auto', fontSize: '15px', color: 'var(--muted)', maxWidth: '440px', lineHeight: 1.7 }}>
                Observa la flecha roja e intenta identificar la estructura antes de revelar la respuesta.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const RepasoMascot = revealed ? MastocitoSorprendido : MastocitoPensando
                return (
                  <>
                    <RepasoMascot
                      height={240}
                      animate={false}
                      className="mascot-pensando-side"
                      style={{
                        position: 'relative',
                        zIndex: 0,
                        marginRight: '-53px',
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <RepasoMascot
                          height={140}
                          animate={false}
                          className="mascot-pensando-top"
                          style={{
                            position: 'relative',
                            zIndex: 0,
                            marginBottom: '-47px',
                          }}
                        />
                      </div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <Flashcard
                          slide={SLIDES[cardIndex]}
                          index={cardIndex}
                          total={SLIDES.length}
                          revealed={revealed}
                          onReveal={() => setRevealed(true)}
                          onNext={() => { setCardIndex(i => Math.min(i + 1, SLIDES.length - 1)); setRevealed(false) }}
                          onPrev={() => { setCardIndex(i => Math.max(i - 1, 0)); setRevealed(false) }}
                        />
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(200,140,165,0.2)',
        background: '#fff5f7',
        padding: '48px 28px 40px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>

          {/* Mastocito */}
          <MastocitoCorriendo height={110} style={{ opacity: 0.85 }} />

          {/* Dedication */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
              Dedicado al
            </p>
            <p className="font-display" style={{ margin: 0, fontSize: '22px', color: 'var(--rose-dark)', lineHeight: 1.3 }}>
              Área de Histología y Embriología
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
              Facultad de Ciencias Médicas · UNCUYO
            </p>
          </div>

          {/* Instagram */}
          <a
            href="https://instagram.com/histoyembrio.uncuyo"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 20px', borderRadius: '20px',
              border: '1.5px solid rgba(181,54,90,0.3)',
              background: 'rgba(181,54,90,0.06)',
              color: '#b5365a', fontSize: '13.5px', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(181,54,90,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(181,54,90,0.06)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b5365a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="#b5365a" stroke="none"/>
            </svg>
            @histoyembrio.uncuyo
          </a>

          {/* Divider */}
          <div style={{ width: '48px', height: '1px', background: 'rgba(200,140,165,0.3)' }} />

          {/* Authors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Realizado por
            </p>
            <p className="font-display" style={{ margin: 0, fontSize: '18px', color: '#8b4f6b' }}>
              Bautista Zarate &amp; Priscila Millanes
              </p>
  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--muted)' }}>
    ¿Problemas con la pagina? Hablanos: <a href="mailto:zarate.juan@uncuyo.edu.ar" style={{ color: '#8b4f6b', textDecoration: 'underline' }}>zarate.juan@uncuyo.edu.ar</a>
            </p>
          </div>

        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mascot-pensando-side { display: flex; }
        .mascot-pensando-top { display: none; }
        @media (max-width: 780px) {
          .mascot-pensando-side { display: none; }
          .mascot-pensando-top { display: flex; }
        }
      `}</style>
      </div>
    </>
  )
}
