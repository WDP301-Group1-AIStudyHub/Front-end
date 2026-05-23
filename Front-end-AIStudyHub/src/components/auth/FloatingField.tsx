export default function FloatingField({
  id,
  label,
  type = 'text',
}: {
  id: string
  label: string
  type?: string
}) {
  return (
    <label className="relative grid" htmlFor={id}>
      <input id={id} placeholder=" " type={type} className="fl-input" />
      <span className="fl-label">{label}</span>
    </label>
  )
}
