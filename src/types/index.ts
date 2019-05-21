export type Constructor<T> = new (...args: any[]) => T

export interface IJsonOptions {
  type?: string
  additionalProps?: { [key: string]: any }
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
  [prop: string]: any
}

// tslint:disable-next-line: no-empty-interface
export interface IDataSchema extends IJsSchema {}

export interface ITypeOptions {
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
}

export interface IJsTypeOptions extends ITypeOptions {
  json?: IJsonOptions
}

// tslint:disable-next-line: no-empty-interface
export interface IDataTypeOptions extends ITypeOptions {}
