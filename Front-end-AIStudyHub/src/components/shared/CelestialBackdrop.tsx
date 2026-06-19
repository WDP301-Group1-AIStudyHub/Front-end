type CelestialBackdropProps = {
  intensity?: 'dramatic' | 'standard' | 'subtle'
}

export default function CelestialBackdrop({ intensity = 'standard' }: CelestialBackdropProps) {
  const opacity = intensity === 'dramatic' ? 'opacity-100' : intensity === 'subtle' ? 'opacity-60' : 'opacity-80'

  return (
    <div className={`nature-backdrop ${opacity}`} aria-hidden="true">
      <svg className="nature-topo-wave" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,150 Q 250,100 500,220 T 1000,180" />
        <path d="M 0,300 Q 300,380 600,260 T 1000,350" />
        <path d="M 0,450 Q 200,420 400,550 T 1000,490" />
        <path d="M 0,600 Q 350,650 700,550 T 1000,650" />
        <path d="M 0,750 Q 150,700 450,800 T 1000,750" />
        <path d="M 0,900 Q 250,920 600,850 T 1000,900" />
      </svg>

      <svg className="nature-leaf-drift nature-leaf-drift-1" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 4.5 21 3 19.5 3C18 3 14 6 13 12C12 18 8 22 2 22Z" />
        <path d="M12 17L19.5 9.5" />
      </svg>
      <svg className="nature-leaf-drift nature-leaf-drift-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 4.5 21 3 19.5 3C18 3 14 6 13 12C12 18 8 22 2 22Z" />
        <path d="M12 17L19.5 9.5" />
      </svg>
    </div>
  )
}
