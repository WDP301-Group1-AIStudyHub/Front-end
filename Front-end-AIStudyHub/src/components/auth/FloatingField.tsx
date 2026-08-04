import type { ChangeEventHandler } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function FloatingField({
  autoComplete,
  disabled,
  id,
  label,
  name,
  onChange,
  readOnly,
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
  readOnly?: boolean
  required?: boolean
  type?: string
  value?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        autoComplete={autoComplete}
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        type={type}
        value={value}
      />
    </Field>
  )
}
