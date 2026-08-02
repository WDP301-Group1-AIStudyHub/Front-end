import { useState } from 'react'
import type { ChangeEventHandler } from 'react'
import AuthIcon from './AuthIcon'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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
    <Field className="relative">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          autoComplete={autoComplete}
          disabled={disabled}
          id={id}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value}
          className="pr-10"
        />
        <Button aria-label={visible ? 'Hide password' : 'Show password'} disabled={disabled} onClick={() => setVisible((current) => !current)} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="icon-sm" variant="ghost">
          <AuthIcon name={visible ? 'visibility_off' : 'visibility'} className="size-4" />
        </Button>
      </div>
    </Field>
  )
}
