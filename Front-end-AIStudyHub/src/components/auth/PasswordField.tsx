import { useState } from 'react'
import type { ChangeEventHandler } from 'react'
import AuthIcon from './AuthIcon'

export default function PasswordField({
  autoComplete,
  disabled,
  id,
  label,
  name,
  onChange,
  placeholder,
  required,
  value,
}: {
  autoComplete?: string
  disabled?: boolean
  id: string
  label: string
  name?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  required?: boolean
  value?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="relative grid gap-2" htmlFor={id}>
      <span className="text-[rgba(196,199,200,0.82)] text-xs font-semibold tracking-[0.15em] uppercase">{label}</span>
      <input
        autoComplete={autoComplete}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder ?? ' '}
        required={required}
        type={visible ? 'text' : 'password'}
        value={value}
        className="w-full min-h-[54px] pl-4 pr-12 border border-white/[0.08] rounded-[6px] text-white bg-white/[0.03] outline-none focus:border-white/[0.28] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
        className="absolute right-[14px] bottom-3 flex items-center justify-center w-[30px] h-[30px] bg-transparent text-[rgba(196,199,200,0.5)] disabled:cursor-not-allowed"
      >
        <AuthIcon name={visible ? 'visibility_off' : 'visibility'} className="w-5 h-5" />
      </button>
    </label>
  )
}
