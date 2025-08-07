import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates Brazilian CRM (Conselho Regional de Medicina) format
 * @param crm - CRM string to validate (e.g., "CRM/SP 123456")
 * @returns boolean indicating if CRM format is valid
 */
export function validateCRM(crm: string): boolean {
  if (!crm || typeof crm !== 'string') return false
  
  // Brazilian CRM format: CRM/[STATE] [4-6 digits]
  // Examples: CRM/SP 123456, CRM/RJ 1234, CRM/MG 123456
  const crmRegex = /^CRM\/[A-Z]{2}\s\d{4,6}$/
  return crmRegex.test(crm.trim())
}
