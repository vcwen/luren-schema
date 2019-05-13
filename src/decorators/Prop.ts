import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeSimpleSchema } from '../lib/utils'
import { IJsonOptions, IJsSchema } from '../types'

export interface IPropOptions {
  type?: string | { [prop: string]: any }
  schema?: any
  required?: boolean
  desc?: string
  format?: string
  enum?: any[]
  const?: any
  strict?: boolean
  private?: boolean
  default?: any
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
  json?: IJsonOptions
}

export class PropMetadata {
  public name: string
  public schema!: IJsSchema
  public required: boolean = false
  public format?: string
  public default?: any
  public strict: boolean = true
  public enum?: any[]
  public const?: any
  public desc?: string
  public private: boolean = false
  constructor(name: string, required: boolean = false) {
    this.name = name
    this.required = required
  }
}

const getPropMetadata = (options: IPropOptions, _2: object, propertyKey: string) => {
  const metadata = new PropMetadata(propertyKey, options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    metadata.schema = normalizeSimpleSchema(options.type || 'string')
  }
  metadata.strict = options.strict || false
  metadata.format = options.format
  metadata.enum = options.enum
  metadata.const = options.const
  metadata.private = options.private || false
  if (options.validate) {
    metadata.schema.validate = options.validate
  }
  if (options.serialize) {
    metadata.schema.serialize = options.serialize
  }
  if (options.deserialize) {
    metadata.schema.deserialize = options.deserialize
  }
  if (options.json) {
    if (metadata.schema.json) {
      Object.assign(metadata.schema.json, options.json)
    } else {
      metadata.schema.json = options.json
    }
  }
  return metadata
}

export function Prop(options: IPropOptions = {}) {
  return (target: object, propertyKey: string) => {
    let metadataMap: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, target) || Map()
    const metadata = getPropMetadata(options, target, propertyKey)
    metadataMap = metadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.PROPS, metadataMap, target)
  }
}
