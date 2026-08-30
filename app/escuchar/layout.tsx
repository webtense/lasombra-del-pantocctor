export default function EscucharLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#050810] overflow-hidden">
      {children}
    </div>
  )
}
