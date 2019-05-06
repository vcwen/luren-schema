export type Constructor<T> = new (...args: any[]) => T

export interface IJsonProcessor {
  name?: string
  type?: string
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}

export interface ITypeJsonProcessor {
  type: string
  validate: (schema: IJsSchema, data: any) => [boolean, string]
  serialize: (schema: IJsSchema, data: any) => any
  deserialize: (schema: IJsSchema, data: any) => any
}

export interface IJsSchema {
  title?: string
  json?: IJsonProcessor
  type: string
  modelConstructor?: Constructor<any>
  format?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema
  required?: string[]
  description?: string
  [prop: string]: any
}
