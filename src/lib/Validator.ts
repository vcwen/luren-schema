import Ajv from 'ajv'
const ajv = new Ajv()

export class Validator {
  public static validateFormat(value: string, format: string) {
    switch (format) {
      case 'date-time':
      case 'time':
      case 'date':
      case 'email':
      case 'idn-email':
      case 'idn-hostname':
      case 'ipv4':
      case 'ipv6':
      case 'uri':
      case 'uri-reference':
      case 'iri':
      case 'iri-reference':
      case 'uri-template':
      case 'json-pointer':
      case 'regex':
        const valid = ajv.validate({ format }, value) as boolean
        return valid
    }
    return true
  }
  public static validatePattern(value: string, pattern: string) {
    const valid = ajv.validate({ pattern }, value) as boolean
    return valid
  }
  public static validateLength(value: string, length: { minLength?: number; maxLength?: number }) {
    const valid = ajv.validate(length, value) as boolean
    return valid
  }
}
