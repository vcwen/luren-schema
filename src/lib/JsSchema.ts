import { Constructor } from '../types'

export interface IJsSchema {
  type: string
  pattern?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema | IJsSchema[]
  virtual?: boolean
  readonly?: boolean
  required?: string[]
  classConstructor?: Constructor<any>
  default?: any
  [prop: string]: any
}
