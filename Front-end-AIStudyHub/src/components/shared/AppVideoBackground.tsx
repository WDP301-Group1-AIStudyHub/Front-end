export default function AppVideoBackground() {
  return (
    <div className="app-video-background" aria-hidden="true">
      <img
        className="app-video-background__media moonlit-video-poster"
        src="/landing-assets/moonlit-botanical-poster.webp"
        alt=""
      />
      <video
        className="app-video-background__media moonlit-video"
        autoPlay
        loop
        muted
        playsInline
        poster="/landing-assets/moonlit-botanical-poster.webp"
        preload="metadata"
      >
        <source src="/landing-assets/moonlit-botanical-loop.mp4" type="video/mp4" />
      </video>
      <div className="app-video-background__veil" />
      <div className="app-video-background__grain" />
    </div>
  )
}
