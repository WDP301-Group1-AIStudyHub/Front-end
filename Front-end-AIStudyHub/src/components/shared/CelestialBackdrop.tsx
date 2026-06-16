type CelestialBackdropProps = {
  intensity?: 'dramatic' | 'standard' | 'subtle'
}

export default function CelestialBackdrop({ intensity = 'dramatic' }: CelestialBackdropProps) {
  void intensity
  return null
}
