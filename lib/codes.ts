// Redemption code generation utility

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes I, O, 0, 1 for clarity

function generateRandomChars(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return result
}

export function generateRedemptionCode(): string {
  const year = new Date().getFullYear()
  const randomPart = generateRandomChars(4)
  return `FROG-${year}-${randomPart}`
}

export function generateMultipleCodes(count: number): string[] {
  const codes: string[] = []
  const usedCodes = new Set<string>()

  while (codes.length < count) {
    const code = generateRedemptionCode()
    if (!usedCodes.has(code)) {
      usedCodes.add(code)
      codes.push(code)
    }
  }

  return codes
}
