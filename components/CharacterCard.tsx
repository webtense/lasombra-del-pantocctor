interface CharacterCardProps {
  name: string
  age?: string
  role: string
  location?: string
  description: string
  traits?: string[]
  isAntagonist?: boolean
  initial: string
  photo?: string  // ruta a /personajes/Nombre_Apellido.jpg
}

export default function CharacterCard({
  name,
  age,
  role,
  location,
  description,
  traits = [],
  isAntagonist = false,
  initial,
  photo,
}: CharacterCardProps) {
  return (
    <div
      className={`bg-[#0D1117] border rounded-lg overflow-hidden group hover:shadow-gold transition-all duration-300 ${
        isAntagonist ? 'border-red-900/40 hover:border-red-700/60' : 'border-[#C9A84C]/20 hover:border-[#C9A84C]/50'
      }`}
    >
      {/* Avatar area */}
      <div
        className={`h-64 flex items-center justify-center relative overflow-hidden ${
          isAntagonist
            ? 'bg-gradient-to-br from-[#1A0505] to-[#0D1117]'
            : 'bg-gradient-to-br from-[#0D1117] to-[#1A2035]'
        }`}
      >
        {/* Background pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 150">
          <defs>
            <pattern id={`grid-${initial}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isAntagonist ? '#ef4444' : '#C9A84C'} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="200" height="150" fill={`url(#grid-${initial})`} />
        </svg>

        {/* Foto o avatar inicial */}
        {photo ? (
          <img
            src={photo}
            alt={initial}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-85 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 z-10 ${
              isAntagonist
                ? 'border-red-700/50 bg-red-950/30'
                : 'border-[#C9A84C]/50 bg-[#050810]/50'
            }`}
          >
            <span
              className={`font-serif text-3xl font-bold ${isAntagonist ? 'text-red-400' : 'text-[#C9A84C]'}`}
            >
              {initial}
            </span>
          </div>
        )}

        {/* Antagonist badge */}
        {isAntagonist && (
          <div className="absolute top-3 right-3 bg-red-900/70 border border-red-700/50 rounded px-2 py-0.5">
            <span className="text-red-300 text-xs tracking-wider uppercase">Antagonista</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3
            className={`font-serif text-xl font-bold mb-0.5 ${
              isAntagonist ? 'text-red-300' : 'text-white'
            }`}
          >
            {name}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-xs px-2 py-0.5 rounded font-sans ${
                isAntagonist
                  ? 'bg-red-950/50 text-red-400 border border-red-900/40'
                  : 'bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20'
              }`}
            >
              {role}
            </span>
            {age && (
              <span className="text-gray-600 text-xs">{age}</span>
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1 mt-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-gray-600 text-xs">{location}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`h-px mb-3 ${isAntagonist ? 'bg-red-900/30' : 'bg-[#C9A84C]/15'}`} />

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          {description}
        </p>

        {/* Traits */}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {traits.map((trait) => (
              <span
                key={trait}
                className="text-xs text-gray-500 bg-[#1A2035] border border-gray-700/30 px-2 py-0.5 rounded"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
