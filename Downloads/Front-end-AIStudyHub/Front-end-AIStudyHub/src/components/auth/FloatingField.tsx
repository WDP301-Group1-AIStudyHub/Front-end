import type { ChangeEventHandler } from 'react'

export default function FloatingField({
  autoComplete,
  disabled,
  id,
  label,
  name,
  onChange,
  required,
  type = 'text',
  value,
}: {
  autoComplete?: string
  disabled?: boolean
  id: string
  label: string
  name?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  required?: boolean
  type?: string
  value?: string
}) {
  return (
    <label className="relative grid" htmlFor={id}>
      <input
        autoComplete={autoComplete}
        className="fl-input disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder=" "
        required={required}
        type={type}
        value={value}
      />
      <span className="fl-label">{label}</span>
    </label>
  )
}
