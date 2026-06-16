import type { Subject } from '../../types/subject'

export function SubjectSelect({
  disabled,
  onChange,
  subjects,
  value,
}: {
  disabled?: boolean
  onChange: (subjectId: string) => void
  subjects: Subject[]
  value: string
}) {
  return (
    <select
      className="h-9 w-full min-w-0 rounded-md border border-input bg-background/40 px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">Select Subject</option>
      {subjects.map((subject) => (
        <option key={subject._id} value={subject._id}>
          {[subject.code, subject.name].filter(Boolean).join(' ')}
        </option>
      ))}
    </select>
  )
}
