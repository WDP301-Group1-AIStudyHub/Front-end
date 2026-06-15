import type { CSSProperties } from 'react'

type CelestialBackdropProps = {
  intensity?: 'dramatic' | 'standard' | 'subtle'
}

const starPoints = [
  [6, 12, 0.55, 0],
  [14, 72, 0.38, 1.4],
  [23, 34, 0.72, 0.8],
  [31, 86, 0.42, 2.2],
  [43, 18, 0.8, 1.1],
  [51, 57, 0.5, 3.1],
  [62, 28, 0.68, 1.8],
  [70, 78, 0.44, 2.7],
  [81, 10, 0.75, 0.4],
  [88, 48, 0.52, 1.6],
  [95, 82, 0.36, 3.5],
  [37, 8, 0.46, 2.4],
  [12, 46, 0.5, 0.7],
  [56, 91, 0.62, 2.9],
  [75, 36, 0.54, 1.2],
  [92, 22, 0.45, 2.1],
]

const meteors = [
  [10, 18, 8.5, 0.2],
  [32, 8, 10, 2.6],
  [58, 14, 9.2, 5.1],
  [80, 2, 11.5, 7.4],
  [88, 34, 8.8, 3.5],
  [45, 42, 12.2, 9.2],
]

const comets = [
  [22, 84, 18, 0.6],
  [72, 62, 22, 5.2],
]

export default function CelestialBackdrop({
  intensity = 'dramatic',
}: CelestialBackdropProps) {
  const meteorCount = intensity === 'subtle' ? 3 : intensity === 'standard' ? 4 : meteors.length
  const starCount = intensity === 'subtle' ? 10 : starPoints.length

  return (
    <div className={`celestial-backdrop celestial-backdrop-${intensity}`} aria-hidden="true">
      <div className="celestial-aurora celestial-aurora-one" />
      <div className="celestial-aurora celestial-aurora-two" />
      <div className="celestial-aurora celestial-aurora-three" />
      <div className="celestial-orbit celestial-orbit-one" />
      <div className="celestial-orbit celestial-orbit-two" />
      <div className="celestial-starfield" />
      {starPoints.slice(0, starCount).map(([left, top, opacity, delay]) => (
        <span
          className="celestial-star"
          key={`star-${left}-${top}`}
          style={
            {
              '--star-delay': `${delay}s`,
              '--star-opacity': opacity,
              left: `${left}%`,
              top: `${top}%`,
            } as CSSProperties
          }
        />
      ))}
      {meteors.slice(0, meteorCount).map(([left, top, duration, delay], index) => (
        <span
          className={`celestial-meteor celestial-meteor-${index % 3}`}
          key={`meteor-${left}-${top}`}
          style={
            {
              '--meteor-delay': `${delay}s`,
              '--meteor-duration': `${duration}s`,
              left: `${left}%`,
              top: `${top}%`,
            } as CSSProperties
          }
        />
      ))}
      {comets.map(([left, top, duration, delay], index) => (
        <span
          className={`celestial-comet celestial-comet-${index}`}
          key={`comet-${left}-${top}`}
          style={
            {
              '--comet-delay': `${delay}s`,
              '--comet-duration': `${duration}s`,
              left: `${left}%`,
              top: `${top}%`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
