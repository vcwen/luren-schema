export type Constructor<T> = new (...args: any[]) => T

export interface IJsonOptions {
  name?: string
  type?: string
  additionalProps?: { [key: string]: any }
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}

export interface IJsSchema {
  json?: IJsonOptions
  type: string
  modelConstructor?: Constructor<any>
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  format?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema
  required?: string[]
  description?: string
  [prop: string]: any
}

export interface ITypeOptions {
  validate: (schema: IJsSchema, data: any) => [boolean, string]
}
