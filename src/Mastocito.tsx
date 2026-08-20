import mastoRaw from '@/imports/MASTOCITO_PAGINA.svg?raw'
import pensandoRaw from '@/imports/MASTOCITO_PENSANDO.svg?raw'
import corriendoRaw from '@/imports/MASTOCITO_CORRIENDO.svg?raw'
import saludandoRaw from '@/imports/MASTOCITO_SALUDANDO.svg?raw'
import sorprendidoRaw from '@/imports/MASTOCITO_SORPRENDIDO.svg?raw'

// Animation styles injected into the SVG
const ANIM_STYLE = ``

// Patch width/height and inject anim styles once at module load
const ANIMATED_SVG = mastoRaw
  .replace('width="100%" height="100%"', 'width="100%" height="100%"')
  .replace('</svg>', `${ANIM_STYLE}</svg>`)

interface MastocitoProps {
  /** Rendered pixel size (square). Default 240. */
  size?: number
  /** Enable float animation. Default true. */
  animate?: boolean
  style?: React.CSSProperties
}

/** Cara del mastocito (retrato cuadrado). Usado como ícono/avatar. */
export function Mastocito({ size = 240, animate = true, style }: MastocitoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        animation: animate ? 'mastoFloat 3s ease-in-out infinite alternate' : 'none',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: ANIMATED_SVG }}
    />
  )
}

// ─── Variantes de cuerpo completo (verticales, proporción 2:3) ───────────────
// Estos SVG vienen en formato retrato (viewBox 7200×10800). Se dimensionan
// por altura (`height`) y el ancho se calcula solo para no deformarse.

interface MastocitoBodyProps {
  /** Alto renderizado en px. El ancho se calcula automáticamente. Default 200. */
  height?: number
  animate?: boolean
  style?: React.CSSProperties
  className?: string
}

const BODY_ASPECT = 7200 / 10800 // ancho / alto

function makeBodyVariant(raw: string) {
  return function MastocitoBodyVariant({ height = 200, animate = true, style, className }: MastocitoBodyProps) {
    return (
      <div
        className={className}
        style={{
          width: height * BODY_ASPECT,
          height,
          flexShrink: 0,
          animation: animate ? 'mastoFloat 3s ease-in-out infinite alternate' : 'none',
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    )
  }
}

/** Mastocito pensando (mano en el mentón). */
export const MastocitoPensando = makeBodyVariant(pensandoRaw)
/** Mastocito corriendo. */
export const MastocitoCorriendo = makeBodyVariant(corriendoRaw)
/** Mastocito saludando con la mano. */
export const MastocitoSaludando = makeBodyVariant(saludandoRaw)
/** Mastocito sorprendido. */
export const MastocitoSorprendido = makeBodyVariant(sorprendidoRaw)
