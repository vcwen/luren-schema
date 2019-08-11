import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { convertSimpleSchemaToJsSchema } from '../lib/utils'
import { IJsSchema, SimpleType } from '../types'

export interface IPropOptions {
  type?: SimpleType
  schema?: any
  required?: boolean
  desc?: string
  format?: string
  enum?: any[]
  const?: any
  strict?: boolean
  virtual?: boolean
  private?: boolean
  default?: any
}

export class PropMetadata {
  public name: string
  public schema!: IJsSchema
  public required: boolean = true
  public format?: string
  public default?: any
  public strict: boolean = true
  public enum?: any[]
  public const?: any
  public desc?: string
  public private: boolean = false
  public virtual: boolean = false
  constructor(name: string, required: boolean = true) {
    this.name = name
    this.required = required
  }
}

const getPropMetadata = (options: IPropOptions, _2: object, propertyKey: string) => {
  const metadata = new PropMetadata(propertyKey, options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(options.type || 'string')
    metadata.schema = propSchema
    if (options.required === undefined) {
      metadata.required = propRequired
    }
  }
  metadata.virtual = options.virtual || false
  metadata.strict = options.strict || false
  metadata.format = options.format
  metadata.enum = options.enum
  metadata.const = options.const
  metadata.private = options.private || false
  if (options.private) {
    metadata.schema.private = options.private
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
