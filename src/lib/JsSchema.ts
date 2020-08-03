import { Constructor } from '../types'

export interface IJsSchema {
  type: string
  classConstructor?: Constructor<any>
  title?: string
  description?: string
  default?: any
  examples?: any
  enum?: any[]
  const?: any
  // date
  timezone?: string
  // number options
  multipleOf?: number
  minimum?: number
  exclusiveMinimum?: number
  maximum?: number
  exclusiveMaximum?: number
  // string options
  minLength?: number
  maxLength?: number
  pattern?: string
  format?:
    | 'date-time'
    | 'time'
    | 'date'
    | 'email'
    | 'idn-email'
    | 'hostname'
    | 'idn-hostname'
    | 'ipv4'
    | 'ipv6'
    | 'uri'
    | 'uri-reference'
    | 'regex'
  // object options
  properties?: { [prop: string]: IJsSchema }
  required?: string[]
  additionalProperties?: boolean
  ignoreAdditionalProps?: boolean
  virtual?: boolean
  // array options
  items?: IJsSchema | IJsSchema[]
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}
