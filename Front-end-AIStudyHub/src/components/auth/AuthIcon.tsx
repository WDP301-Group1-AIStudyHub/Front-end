export default function AuthIcon({ name, className: extraCls }: { name: string; className?: string }) {
  const className = `auth-icon auth-icon-${name.replace('_', '-')}${extraCls ? ` ${extraCls}` : ''}`

  if (name === 'school') {
    return (
      <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
        <path d="m4 11.5 12-5 12 5-12 5-12-5Z" />
        <path d="M9 15v5.2c0 2 3.2 3.8 7 3.8s7-1.8 7-3.8V15" />
        <path d="M27 12v8" />
      </svg>
    )
  }

  if (name === 'flare') {
    return (
      <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="18" />
        <path d="M60 8v22M60 90v22M8 60h22M90 60h22M23 23l16 16M81 81l16 16M97 23 81 39M39 81 23 97" />
        <path d="M60 42v36M42 60h36" />
      </svg>
    )
  }

  if (name === 'auto_awesome') {
    return (
      <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
        <path d="m16 4 2.2 7.8L26 14l-7.8 2.2L16 24l-2.2-7.8L6 14l7.8-2.2L16 4Z" />
        <path d="m7 23 .8 2.7L10.5 26l-2.7.8L7 29.5l-.8-2.7L3.5 26l2.7-.3L7 23ZM25 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
      </svg>
    )
  }

  if (name === 'arrow_back') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    )
  }

  if (name === 'visibility' || name === 'visibility_off') {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.8" />
        {name === 'visibility_off' ? <path d="M4 4l16 16" /> : null}
      </svg>
    )
  }

  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="8" />
      <path d="M16 2v6M16 24v6M2 16h6M24 16h6" />
    </svg>
  )
}
