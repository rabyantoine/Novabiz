'use client'
import { formatIban, validateIban } from '../lib/validateIban'

type Props = {
  value: string
  onChange: (val: string) => void
  label?: string
}

export default function IbanInput({ value, onChange, label = 'IBAN' }: Props) {
  const showFeedback = value.replace(/\s+/g, '').length > 8
  const result = showFeedback ? validateIban(value) : null

  const borderColor = showFeedback
    ? result?.valid ? '#16a34a' : '#dc2626'
    : '#d1d5db'

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatIban(e.target.value))
  }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="FR76 3000 6000 0112 3456 7890 189"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          fontSize: 14,
          fontFamily: 'monospace',
          boxSizing: 'border-box',
          outline: 'none',
          background: '#fff',
          color: '#0B1F45',
        }}
      />
      {showFeedback && result && (
        <p style={{
          margin: '4px 0 0',
          fontSize: 12,
          color: result.valid ? '#16a34a' : '#dc2626',
        }}>
          {result.valid ? '✓ IBAN valide' : result.message}
        </p>
      )}
    </div>
  )
}
