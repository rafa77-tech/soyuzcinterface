import { validateCRM, cn } from '../utils'

describe('validateCRM', () => {
  it('should validate valid CRM formats', () => {
    const validCRMs = [
      'CRM/SP 123456',
      'CRM/RJ 1234',
      'CRM/MG 999999',
      'CRM/BA 12345',
      'CRM/RS 4567'
    ]

    validCRMs.forEach(crm => {
      expect(validateCRM(crm)).toBe(true)
    })
  })

  it('should reject invalid CRM formats', () => {
    const invalidCRMs = [
      '', // empty string
      'CRM/SP123456', // missing space
      'CRM/SP 123', // too few digits
      'CRM/SP 1234567', // too many digits
      'CRM/ABC 123456', // invalid state format
      'CRM/sp 123456', // lowercase state
      'CRMS/SP 123456', // typo in CRM
      'CRM/SP 12345a', // letter in number
      'CRM/ 123456', // missing state
      'CRM/SP  123456', // extra space
      '123456', // no CRM prefix
      'SP 123456' // missing CRM/
    ]

    invalidCRMs.forEach(crm => {
      expect(validateCRM(crm)).toBe(false)
    })
  })

  it('should handle edge cases', () => {
    expect(validateCRM(null as any)).toBe(false)
    expect(validateCRM(undefined as any)).toBe(false)
    expect(validateCRM(123456 as any)).toBe(false)
    expect(validateCRM('  CRM/SP 123456  ')).toBe(true) // trims whitespace
  })

  it('should validate Brazilian state codes', () => {
    const brazilianStates = [
      'CRM/AC 1234', // Acre
      'CRM/AL 1234', // Alagoas  
      'CRM/AP 1234', // Amapá
      'CRM/AM 1234', // Amazonas
      'CRM/BA 1234', // Bahia
      'CRM/CE 1234', // Ceará
      'CRM/DF 1234', // Distrito Federal
      'CRM/ES 1234', // Espírito Santo
      'CRM/GO 1234', // Goiás
      'CRM/MA 1234', // Maranhão
      'CRM/MT 1234', // Mato Grosso
      'CRM/MS 1234', // Mato Grosso do Sul
      'CRM/MG 1234', // Minas Gerais
      'CRM/PA 1234', // Pará
      'CRM/PB 1234', // Paraíba
      'CRM/PR 1234', // Paraná
      'CRM/PE 1234', // Pernambuco
      'CRM/PI 1234', // Piauí
      'CRM/RJ 1234', // Rio de Janeiro
      'CRM/RN 1234', // Rio Grande do Norte
      'CRM/RS 1234', // Rio Grande do Sul
      'CRM/RO 1234', // Rondônia
      'CRM/RR 1234', // Roraima
      'CRM/SC 1234', // Santa Catarina
      'CRM/SP 1234', // São Paulo
      'CRM/SE 1234', // Sergipe
      'CRM/TO 1234'  // Tocantins
    ]

    brazilianStates.forEach(crm => {
      expect(validateCRM(crm)).toBe(true)
    })
  })
})

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('px-4', 'px-2')).toBe('px-2') // tailwind-merge functionality
  })
})