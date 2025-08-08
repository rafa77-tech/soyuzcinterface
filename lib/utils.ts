import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateCRM(crm: string): boolean {
  if (!crm || typeof crm !== 'string') {
    return false
  }

  // Trim whitespace
  const trimmedCRM = crm.trim()
  
  // Brazilian state codes
  const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]
  
  // Pattern: CRM/XX NNNN-NNNNNN
  const crmPattern = /^CRM\/([A-Z]{2})\s(\d{4,6})$/
  const match = trimmedCRM.match(crmPattern)
  
  if (!match) {
    return false
  }
  
  const state = match[1]
  const number = match[2]
  
  // Validate state code
  if (!validStates.includes(state)) {
    return false
  }
  
  // Validate number (4-6 digits)
  if (number.length < 4 || number.length > 6) {
    return false
  }
  
  return true
}
