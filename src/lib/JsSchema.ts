import { Constructor } from '../types'

export interface IJsSchema {
  type: string
  pattern?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema | IJsSchema[]
  readonly?: boolean
  required?: string[]
  classConstructor?: Constructor<any>
  default?: any
  [prop: string]: any
}
