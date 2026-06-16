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
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
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
        className="min-h-[54px] w-full rounded-md border border-input bg-background/45 pl-4 pr-12 text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
        className="absolute bottom-3 right-[14px] flex h-[30px] w-[30px] items-center justify-center bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
      >
        <AuthIcon name={visible ? 'visibility_off' : 'visibility'} className="w-5 h-5" />
      </button>
    </label>
  )
}
