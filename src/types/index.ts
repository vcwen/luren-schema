export type Constructor<T> = new (...args: any[]) => T

export interface IJsonSchema {
  type?: string
  format?: string
  properties?: { [prop: string]: IJsonSchema }
  items?: IJsonSchema
  required?: string[]
  description?: string
  default?: any
  [prop: string]: any
}

export interface IDataSchema {
  type: string
  format?: string
  properties?: { [prop: string]: IDataSchema }
  items?: IDataSchema
  required?: string[]
  description?: string
  default?: any
  additionalProperties?: boolean
  classConstructor?: Constructor<any>
  [prop: string]: any
  toJsonSchema?: () => IJsonSchema
}
export interface IJsSchema extends IDataSchema {
  private?: boolean
  virtual?: boolean
  properties?: { [prop: string]: IJsSchema }
  items?: IJsSchema
}

// tslint:disable-next-line: no-empty-interface
export interface IPersistSchema extends IDataSchema {
  properties?: { [prop: string]: IPersistSchema }
  items?: IPersistSchema
}

export interface ITypeOptions {
  validate: (schema: IDataSchema, data: any) => [boolean, string]
  serialize: (schema: IDataSchema, data: any) => any
  deserialize: (schema: IDataSchema, data: any) => any
  toJsonSchema: () => IJsonSchema
}

export type SimpleType =
  | string
  // tslint:disable-next-line: ban-types
  | Function
  | { [prop: string]: SimpleType }
  // tslint:disable-next-line: ban-types
  | Array<string | Function | { [prop: string]: SimpleType }>
