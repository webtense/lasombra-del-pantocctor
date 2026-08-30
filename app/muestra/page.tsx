import type { Metadata } from 'next'
import Link from 'next/link'
import AudioPlayer from '@/components/AudioPlayer'
import MuestraLeadForm from '@/components/MuestraLeadForm'
import PageEvent from '@/components/PageEvent'

export const metadata: Metadata = {
  title: 'Muestra gratis — La Sombra del Pantocrátor',
  description: 'Lee gratis los 3 primeros capítulos + escucha la primera escena de audio. Conoce a Bruno Martí. Descubre el misterio del Pantocrátor. Sin compromiso.',
}

// Texto real extraído de DEFINITIVO/EDICION_FINAL/la-sombra-del-pantocrator-edicion-final.md
// Capítulo 1 completo (501 palabras) · Capítulos 2 y 3 recortados a ~500 palabras cada uno.
const sampleChapters = [
  {
    number: 1,
    title: 'Llegada al valle',
    truncated: false,
    paragraphs: [
      'El Mini Cooper rojo Ferrari de Bruno Martí devoraba la carretera, el motor 1.6L turbo rugiendo suave contra la inmensidad nevada del Pirineo. Las tres de la madrugada del 24 de enero. Las montañas se alzaban en siluetas dentadas bajo un cielo plomizo, un gigante dormido que lo observaba. Los neumáticos AWD mordían el asfalto helado. Bruno, cuarenta y cinco años, barba cuidada y ojos acostumbrados a la penumbra de las zonas de conflicto, sentía un escalofrío que no venía del frío. Era esa intuición vieja, de Siria y Ucrania, un presentimiento que le asentaba en los huesos sin pedir permiso.',
      'La música jazz de los altavoces intentaba suavizar algo. No lo lograba. El cuero negro del interior no podía tapar el olor metálico a nieve que se colaba por las rendijas, ni lo que había debajo de ese olor, algo que no sabía nombrar. Menos de veinticuatro horas atrás, en su casa de Castelldefels frente al mar, un sobre anónimo había roto la rutina. Dentro, nombres garabateados: Laia, Anna, Ignaci Castells. Y una frase en tipografía antigua, casi arcaica: Els Ulls del Diable. Desde entonces el iPhone rojo de Bruno no había parado de vibrar.',
      'Bruno era un periodista freelance que necesitaba recuperar terreno perdido. Notó el pulso de una exclusiva. Pero no como las otras. Su instinto gritaba que esto rozaba el peligro de verdad, no el peligro escenificado de las redacciones. Las descripciones del remitente sobre el hotel en el Vall de Boí, un coloso tecnológico entre abetos y roca antigua, resultaban demasiado precisas. Y el Land Rover Defender militarizado, verde oscuro casi invisible, que había estado parado frente a su buzón mientras él abría el sobre, no se le iba de la cabeza. Una mole blindada con motor V6 3.0L, quieta como si lo estudiara.',
      'La carretera se estrechó. Los árboles se cerraron a los lados como centinelas. La domótica del Mini ajustó las luces LED sola, proyectando un haz limpio sobre el manto blanco de los márgenes. Los nombres, la precisión, las coordenadas exactas del sobre: todo apuntaba a un secreto enterrado bajo la nieve, más hondo que los túneles de contrabando que, según los rumores, perforaban estas montañas. Una historia de portada. Y algo más que una historia.',
      'Un último giro y la silueta del hotel Els Ulls del Diable se recortó contra el cielo oscuro. Un gigante modernista de vidrio y madera de abeto, las torres de acero negro alzándose contra las cumbres. Una ráfaga gélida golpeó el Mini y la nieve levantada se arremolinó contra el parabrisas. Bruno redujo la velocidad, escudriñando la fachada. Se detuvo a unos metros de la entrada y apagó el motor. El Mini resopló una vez, suave, y el silencio del valle cayó encima. Bruno respiró. El aire era puro y helado y llevaba consigo algo más que frío. Al mirar por el retrovisor, bajo la tenue luz de la luna, creyó ver una sombra moverse entre los árboles. Un parpadeo. La nuca le ardió.',
      'No estaba solo.',
    ],
  },
  {
    number: 2,
    title: 'El hotel del diablo',
    truncated: true,
    paragraphs: [
      'El Mini Cooper quedó inmóvil en el sendero de grava con el motor apagado. La niebla matutina se disipaba despacio y los picos nevados asomaban sobre el valle, teñidos de malva y gris en el primer filo del amanecer. Bruno bajó del coche. Sus botas pisaron la grava con un crujido seco que el silencio amplificó. Escaneó el entorno: cada sombra, cada rama cubierta de rocío, la distancia al edificio. Años en zonas de guerra le habían grabado ese reflejo en los huesos.',
      'Las luces LED del hotel lo detectaron antes de que llegara a la entrada. Los tonos pasaron del azul glacial al blanco lunar con un parpadeo casi imperceptible. El arco de vidrio de diez metros se abrió con un siseo y un cambio de presión que notó en los tímpanos. Adentro, el sistema de climatización empujaba un olor a abeto, pino y lavanda, diseñado para relajar. Bruno lo ignoró. Bajo esa capa había otra cosa: un rastro metálico y terroso, frío, que subía de algún punto por debajo del suelo. Un eco de los túneles que mencionaba la nota.',
      'El vestíbulo tenía quince metros de altura. Vigas de acero negro pulido cruzaban el espacio y se encontraban con paneles de madera de pino que cubrían las paredes hasta media altura, suavizando el ventanal que formaba la fachada: un ojo enorme mirando al valle. Las lámparas LED esféricas flotaban sin cables visibles y ajustaban su intensidad según el movimiento. El suelo de madera oscura con incrustaciones de resina brillaba como un espejo negro. El calor subía desde el suelo, constante, exacto.',
      'Bruno se acercó al mostrador curvo de madera y cristal. Las pantallas táctiles encajadas en la superficie emitían una luz suave. Un sensor de reconocimiento facial se activó al detectarlo, lo escaneó en un segundo y se apagó. Su llegada quedaba registrada en algún servidor del edificio.',
      'Una mujer salió de las sombras detrás del mostrador. Se movía sin prisa, con una precisión que no era ensayada. Laia Puig. Treinta y cinco años, uniforme impecable, cabello oscuro en ondas sueltas sobre los hombros. Tenía los ojos de un marrón claro que lo atravesó en cuanto lo miró, como si estuviera identificando algo concreto, no simplemente recibiéndolo. Bruno reconoció el gesto: era la mirada de alguien que ha aprendido a leer por debajo de lo que la gente muestra.',
      '«Bienvenido al Els Ulls del Diable.»',
      'Su voz era grave y baja. Cada sílaba, quieta.',
      'Le tendió la tarjeta magnética. Sus dedos rozaron los de Bruno un instante. Los suyos eran finos y cálidos; los de él, ásperos por años de montaña y trabajo de campo. Eso fue todo. Pero Bruno registró el detalle con la misma frialdad con que registraba una posición de francotirador: Laia era una pieza central en esto, no decorativa. Su instinto lo decía con la misma claridad con que reconocía un perímetro inseguro.',
    ],
  },
  {
    number: 3,
    title: 'El sobre marrón',
    truncated: true,
    paragraphs: [
      'La puerta de abeto oscuro y acero pulido se cerró con un chasquido seco. El zumbido de los servidores del hotel seguía ahí, debajo de todo, como un pulso que no pertenecía al edificio sino a algo más antiguo instalado en sus tripas.',
      'Treinta metros cuadrados. El suelo de pino claro irradiaba calor desde abajo. Los paneles de abeto oscuro subían hasta media altura y cortaban la luz. Por encima, el ventanal mostraba los picos nevados y el valle todavía a oscuras, con los primeros tintes rosados rozando el horizonte. Bruno no los vio. Su mirada ya estaba en el escritorio.',
      'Un sobre de papel kraft. Sin remitente. El peso era irregular, no el de un folleto de bienvenida. Lo dejó donde estaba un momento y examinó la habitación con los ojos, esquina a esquina, antes de tocarlo.',
      'Lo abrió con los dedos planos, sin apresurar. Dentro había dos cosas: un cuaderno viejo con las tapas reblandecidas y los bordes doblados, el papel amarillento y con olor a humedad; y una fotografía. En la foto, un grupo de jóvenes sonreía frente a las montañas. Los colores habían virado al sepia. Los rostros eran apenas reconocibles.',
      'Dejó la foto a un lado.',
      'El cuaderno tenía páginas cubiertas con una caligrafía apretada, ansiosa, que llenaba los márgenes y los espacios entre líneas como si el autor hubiera necesitado vaciar algo a contrarreloj. Nombres. Laia. Anna. Ágata. Joel. Aníbal. Ignaci Castells. Bruno repasó la lista dos veces. Un nombre estaba tachado, una línea gruesa y oscura que lo hacía ilegible. Alguien lo había borrado con rabia o con miedo, o con ambas cosas.',
      'En los márgenes, repetida en mayúsculas hasta en los espacios más estrechos, una sola palabra: PANTOCRÁTOR.',
      'Bruno la reconoció. Había leído sobre el románico del valle antes de llegar: el Pantocrátor de Sant Climent de Taüll, el Cristo en Majestad pintado en el ábside, el ojo que lo abarca todo. Lo recordó ahora con otro peso. Conectó: la iglesia. Anna. La explosión de 2010, declarada accidente. Los túneles del hotel. La salpiquita que Ágata había llamado piedra de convergencia. Ignaci Castells.',
      'Las piezas no encajaban del todo. Encajaban lo suficiente para que el mapa fuera incómodo.',
      'Un escalofrío le tensó los hombros. Reconoció el mecanismo: era el mismo que en Kandahar, antes de que saltara la segunda carga. El cuerpo detectando lo que la mente todavía no había terminado de procesar. ¿Quién había metido este sobre en la habitación? ¿Por qué a él, y no a la Guardia Civil, o al juez de instrucción de Lleida? ¿Era alguien que no podía ir a las autoridades? ¿O era un anzuelo?',
      'La segunda opción no lo descartó. La tuvo presente.',
    ],
  },
]

export default function MuestraPage() {
  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-24">
      <PageEvent event="view_sample" />
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">Muestra gratuita</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-white mb-4 leading-tight">
            Lee gratis los 3 primeros capítulos + escucha la primera escena de audio
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
            Conoce a Bruno Martí. Descubre el misterio del Pantocrátor. Sin compromiso.
          </p>
        </div>

        {/* Chapters */}
        <div className="space-y-14">
          {sampleChapters.map((ch) => (
            <div key={ch.number} className="border border-[#C9A84C]/15 rounded-xl p-6 md:p-8 bg-[#0D1117]/50">
              <p className="text-[#C9A84C]/60 text-xs tracking-widest uppercase mb-2">
                Capítulo {ch.number}
              </p>
              <h2 className="font-serif text-2xl text-white mb-5">{ch.title}</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                {ch.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {ch.truncated && (
                  <p className="text-gray-600 italic text-sm pt-2">
                    … sigue en el libro.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Audio sample */}
        <div className="mt-14 mb-14">
          <p className="text-center text-gray-500 text-xs tracking-widest uppercase mb-4">
            Escena 1 del audiolibro (duración: ~3min)
          </p>
          <div className="flex flex-col items-center gap-2">
            {/* TODO: generar audio muestra-escena1.mp3 — el archivo aún no existe en /public/audio */}
            <AudioPlayer
              src="/audio/muestra-escena1.mp3"
              title="Escena 1 — Llegada al valle"
              description="Bruno Martí conduce hacia el Pirineo a las 3 de la mañana."
            />
            <p className="text-gray-700 text-xs text-center max-w-md">
              (TODO: generar audio muestra-escena1.mp3 — pendiente de subir a /public/audio)
            </p>
          </div>
        </div>

        {/* Formulario de captación */}
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-xl p-8 text-center">
          <h3 className="font-serif text-xl text-white mb-2">¿Quieres saber cuándo publique algo nuevo?</h3>
          <p className="text-gray-500 text-sm mb-6">
            Déjanos tu nombre y tu email. Sin spam, un mensaje de vez en cuando con novedades sobre la novela.
          </p>
          <MuestraLeadForm />
        </div>

        {/* CTA secundario */}
        <div className="mt-10 text-center bg-gradient-to-b from-[#0D1117] to-[#050810] border border-[#C9A84C]/20 rounded-xl p-8">
          <p className="text-gray-400 mb-2">¿Ya quieres saber cómo continúa?</p>
          <h3 className="font-serif text-2xl text-white mb-6">Ebook + Audiolibro completo — 12,99 €</h3>
          <Link
            href="/descargar"
            className="inline-flex items-center justify-center gap-2 font-bold rounded-lg bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] py-4 px-8 text-lg transition-colors"
          >
            Comprar audiolibro completo
          </Link>
          <p className="text-gray-600 text-xs mt-3">131 capítulos · 8h 11min de audio · Un pago único.</p>
        </div>

      </div>
    </div>
  )
}
