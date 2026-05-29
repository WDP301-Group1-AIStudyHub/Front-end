const REMOTE_BLACK_HOLE_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4'

export default function AppVideoBackground() {
  return (
    <div className="app-video-background" aria-hidden="true">
      <video
        className="app-video-background__media"
        autoPlay
        loop
        muted
        playsInline
        poster="/landing-assets/black-hole-poster.png"
        preload="metadata"
      >
        <source src="/landing-assets/black-hole-bg.mp4" type="video/mp4" />
        <source src={REMOTE_BLACK_HOLE_VIDEO} type="video/mp4" />
      </video>
      <div className="app-video-background__veil" />
      <div className="app-video-background__grain" />
    </div>
  )
}
