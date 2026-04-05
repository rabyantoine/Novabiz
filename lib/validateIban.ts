export function formatIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean
}

export function validateIban(iban: string): { valid: boolean; message: string } {
  const clean = iban.replace(/\s+/g, '').toUpperCase()

  if (clean.length < 15) {
    return { valid: false, message: 'IBAN invalide — trop court (minimum 15 caractères)' }
  }
  if (clean.length > 34) {
    return { valid: false, message: 'IBAN invalide — trop long (maximum 34 caractères)' }
  }
  if (!/^[A-Z]{2}[0-9]{2}/.test(clean)) {
    return { valid: false, message: 'IBAN invalide — doit commencer par 2 lettres et 2 chiffres' }
  }

  // Move first 4 chars to end, then replace letters with numbers (A=10 … Z=35)
  const rearranged = clean.slice(4) + clean.slice(0, 4)
  const numeric = rearranged.split('').map(c => {
    const code = c.charCodeAt(0)
    return code >= 65 && code <= 90 ? String(code - 55) : c
  }).join('')

  // BigInt modulo 97
  let remainder = BigInt(0)
  for (const digit of numeric) {
    remainder = (remainder * BigInt(10) + BigInt(digit)) % BigInt(97)
  }

  if (remainder !== BigInt(1)) {
    return { valid: false, message: 'IBAN invalide — checksum incorrect' }
  }

  return { valid: true, message: 'IBAN valide ✓' }
}
