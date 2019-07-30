export type Constructor<T> = new (...args: any[]) => T

export interface IJsonSchema {
  type?: string
  format?: string
  properties?: { [prop: string]: IJsonSchema }
  items?: IJsonSchema | IJsonSchema[]
  required?: string[]
  description?: string
  default?: any
  [prop: string]: any
}

export interface IJsSchema {
  type: string
  format?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema | IJsSchema[]
  required?: string[]
  description?: string
  default?: any
  additionalProperties?: boolean
  private?: boolean
  virtual?: boolean
  classConstructor?: Constructor<any>
  pattern?: string
  minLength?: number
  maxLength?: number
  [prop: string]: any
}

export type SimpleType =
  | string
  // tslint:disable-next-line: ban-types
  | Function
  | { [prop: string]: SimpleType }
  // tslint:disable-next-line: ban-types
  | Array<string | Function | { [prop: string]: SimpleType }>
