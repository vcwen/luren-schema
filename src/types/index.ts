import Tuple from '../lib/Tuple'

export type Constructor<T = any> = new (...args: any[]) => T

export interface ICommonSchemaOptions {
  title?: string
  description?: string
  default?: any
  examples?: any
  enum?: any[]
  const?: any
  format?: string
  multipleOf?: number
  minimum?: number
  exclusiveMinimum?: number
  maximum?: number
  exclusiveMaximum?: number
  minItems?: number
  maxItems?: number
  minLength?: number
  maxLength?: number
  uniqueItems?: boolean
  additionalItems?: boolean
  additionalProperties?: boolean
}
export interface IJsonSchema extends ICommonSchemaOptions {
  type?: string
  pattern?: string
  required?: string[]
  properties?: { [prop: string]: IJsonSchema }
  items?: IJsonSchema | IJsonSchema[]
  [prop: string]: any
}

export type SimpleType =
  | string
  // tslint:disable-next-line: ban-types
  | Function
  | Tuple
  | { [prop: string]: SimpleType }
  // tslint:disable-next-line: ban-types
  | Array<string | Function | { [prop: string]: SimpleType }>
