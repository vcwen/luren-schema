import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeSimpleSchema, getJsonValidate, getJsonSerialize, getJsonDeserialize } from '../lib/utils'
import { IJsonProcessor, IJsSchema } from '../types'
import jsonDataType from '../lib/JsonDataType'

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
  jsonName?: string
  jsonType?: string
  validate?: (
    schema: any,
    data: any,
    defaultValidate?: (schema: any, data: any) => [boolean, string]
  ) => [boolean, string]
  serialize?: (schema: any, data: any, defaultSerialize?: (schema: any, data: any) => any) => any
  deserialize?: (schema: any, data: any, defaultDeserialize?: (schema: any, data: any) => any) => any
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
  const name = options.jsonName || propertyKey
  const metadata = new PropMetadata(name, options.required)
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
  if (metadata.private) {
    metadata.schema.private = true
  }
  const jsonProcessor: IJsonProcessor = metadata.schema.json || ({} as any)
  const type = metadata.schema.type
  jsonProcessor.name = options.jsonName || propertyKey
  jsonProcessor.type = options.jsonType || type
  const validate = options.validate
  if (validate) {
    jsonProcessor.validate = (schema: IJsSchema, data: any) => {
      const defaultProcessor = jsonDataType.get(schema.type)
      return validate(schema, data, defaultProcessor ? defaultProcessor.validate : undefined)
    }
  } else if (!jsonProcessor.validate) {
    jsonProcessor.validate = getJsonValidate(metadata.schema)
  }
  const serialize = options.serialize
  if (serialize) {
    jsonProcessor.serialize = (schema: IJsSchema, data: any) => {
      const defaultProcessor = jsonDataType.get(schema.type)
      return serialize(schema, data, defaultProcessor ? defaultProcessor.serialize : undefined)
    }
  } else if (!jsonProcessor.serialize) {
    jsonProcessor.serialize = getJsonSerialize(metadata.schema)
  }
  const deserialize = options.deserialize
  if (deserialize) {
    jsonProcessor.deserialize = (schema: IJsSchema, data: any) => {
      const defaultProcessor = jsonDataType.get(schema.type)
      return deserialize(schema, data, defaultProcessor ? defaultProcessor.deserialize : undefined)
    }
  } else if (!jsonProcessor.deserialize) {
    jsonProcessor.deserialize = getJsonDeserialize(metadata.schema)
  }
  metadata.schema.json = jsonProcessor
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
