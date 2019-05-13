export type Constructor<T> = new (...args: any[]) => T

export interface IJsonOptions {
  disabled?: boolean
  type?: string
  additionalProps?: { [key: string]: any }
}

export interface IJsSchema {
  json?: IJsonOptions
  virtual?: boolean
  type: string
  classConstructor?: Constructor<any>
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
  format?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema
  required?: string[]
  description?: string
  [prop: string]: any
}

export interface ITypeOptions {
  json?: IJsonOptions
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}
