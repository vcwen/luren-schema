export type Constructor<T> = new (...args: any[]) => T

export interface IJsonOptions {
  type?: string
  additionalProps?: { [key: string]: any }
}
export interface IJsonSchema {
  type?: string
  format?: string
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema
  required?: string[]
  description?: string
  default?: any
  [prop: string]: any
}
export interface IJsSchema {
  private?: boolean
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
  default?: any
  [prop: string]: any
  toJsonSchema?: () => IJsonSchema
}

// tslint:disable-next-line: no-empty-interface
export interface IPersistSchema extends IJsSchema {}

export interface ITypeOptions {
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}

export interface IJsTypeOptions extends ITypeOptions {
  json?: IJsonOptions
}

// tslint:disable-next-line: no-empty-interface
export interface IPersistTypeOptions extends ITypeOptions {}

export type SimpleType =
  | string
  // tslint:disable-next-line: ban-types
  | Function
  | { [prop: string]: SimpleType }
  // tslint:disable-next-line: ban-types
  | Array<string | Function | { [prop: string]: SimpleType }>
