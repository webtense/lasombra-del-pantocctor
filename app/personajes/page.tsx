import type { Metadata } from 'next'
import CharacterCard from '@/components/CharacterCard'

export const metadata: Metadata = {
  title: 'Personajes — La Sombra del Pantocrátor',
  description: 'Conoce a los protagonistas de La Sombra del Pantocrátor: Bruno Martí, Laia Puig, Ágata y el antagonista Ignaci Castells.',
}

const characters = [
  {
    name: 'Bruno Martí',
    age: '45 años',
    role: 'Protagonista · Ex-corresponsal',
    location: 'Barcelona / Vall de Boí',
    initial: 'B',
    photo: '/personajes/Bruno_Marti.jpg',
    description:
      'Ex-corresponsal de guerra reconvertido en periodista de investigación freelance. Cargado de un pasado que no termina de soltar, llega a la Vall de Boí siguiendo una pista que ningún editor querría publicar: una nota manuscrita con tres nombres y el de un hotel que, según todos los registros, no debería existir.',
    traits: ['Instinto periodístico', 'Pragmático', 'Solitario', 'Terco', 'Veterano de conflictos'],
    isAntagonist: false,
  },
  {
    name: 'Laia Puig',
    age: '35 años',
    role: 'Directora del hotel',
    location: 'Vall de Boí, Lleida',
    initial: 'L',
    photo: '/personajes/Laia_Puig.jpg',
    description:
      'Laia Puig, directora del hotel Els Ulls del Diable, un establecimiento perdido en el Parque Nacional de Aigüestortes que guarda más secretos de los que cualquier guía turística menciona. Heredó el cargo y, sin saberlo, también heredó la deuda de silencio que su madre contrajo con el Pantocrátor. Inteligente, controlada, y con una lealtad que se irá fracturando capítulo a capítulo.',
    traits: ['Liderazgo frío', 'Reservada', 'Organizadora', 'En deuda con el pasado'],
    isAntagonist: false,
  },
  {
    name: 'Anna Puig',
    age: 'Fallecida en 2010',
    role: 'Investigadora · Hermana de Laia',
    location: 'Barcelona (origen)',
    initial: 'A',
    photo: '/personajes/Anna_Puig.jpg',
    description:
      'Hermana de Laia, fallecida en 2010 en circunstancias que nunca se aclararon del todo. Investigadora en ciberseguridad con acceso a proyectos clasificados. Su sombra recorre toda la novela a través de notas, archivos cifrados y las personas que la conocieron. Fue la primera en ver el sistema. Y la primera en pagar por ello.',
    traits: ['Analítica', 'Valiente', 'Precavida', 'Figura espectral', 'Clave en el pasado'],
    isAntagonist: false,
  },
  {
    name: 'Ignaci Castells',
    age: '55 años',
    role: 'Creador del Pantocrátor',
    location: 'Barcelona / Europa',
    initial: 'I',
    photo: '/personajes/Ignaci_Castells.jpg',
    description:
      'Tecnócrata de alto rango, arquitecto del Pantocrátor. No es un villano de despacho: es alguien que cree genuinamente en lo que construyó. El control total como respuesta al caos. La vigilancia como forma de orden. Frío, metódico, nunca en primera línea. Castells no mancha sus manos; diseña los sistemas que lo hacen por él.',
    traits: ['Inteligencia sistémica', 'Ideología del control', 'Frialdad calculada', 'Nunca expuesto'],
    isAntagonist: true,
  },
  {
    name: 'Ágata Soler',
    age: '~30 años',
    role: 'Hacker · Aliada de Bruno',
    location: 'Desconocida (nómada digital)',
    initial: 'Á',
    photo: '/personajes/Agata_Soler.jpg',
    description:
      'Se presenta con un solo nombre. Melena rubia platino, siempre conectada, siempre un paso por delante. Entra en la historia como contacto anónimo de Bruno y se convierte en su mayor activo técnico. Conoce el Pantocrátor desde dentro: no por haberlo construido, sino por haberlo penetrado. Lo que le vio dentro es lo que la tiene en movimiento.',
    traits: ['Habilidad técnica extrema', 'Ironía protectora', 'Lealtades opacas', 'Nómada', 'Resiliente'],
    isAntagonist: false,
  },
]

export default function PersonajesPage() {
  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">El reparto</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">Personajes</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Cinco figuras que definen el tablero de <em className="text-[#C9A84C]">La Sombra del Pantocrátor</em>.
            Cada uno carga con una pieza del puzzle. Ninguno lo sabe todo.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <CharacterCard key={char.name} {...char} />
          ))}
        </div>

        {/* Relationships note */}
        <div className="mt-16 border border-[#C9A84C]/15 rounded-lg p-8 bg-[#0D1117]/50">
          <h2 className="font-serif text-xl text-[#C9A84C] mb-4">El tablero de relaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="text-white font-semibold mb-2">Bruno ↔ Laia</h3>
              <p className="text-gray-500 leading-relaxed">
                Desconfianza inicial que evoluciona hacia una alianza forzada. Laia sabe más de lo que admite. Bruno presiona donde más duele.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Anna (pasado) → Presente</h3>
              <p className="text-gray-500 leading-relaxed">
                La investigación de Anna es el hilo conductor de la novela. Muerta hace catorce años, sus archivos siguen vivos y siguen siendo peligrosos.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Ágata ↔ Pantocrátor</h3>
              <p className="text-gray-500 leading-relaxed">
                Ágata conoce el sistema por dentro. No por haberlo diseñado, sino por haberlo violado. Eso la convierte en el activo más valioso y en el objetivo más buscado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
