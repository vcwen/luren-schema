import { Map } from 'immutable'
import 'reflect-metadata'
import { ALL_JS_SCHEMA_PROPS } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { convertSimpleSchemaToJsSchema, copyProperties } from '../lib/utils'
import { ICommonSchemaOptions, IJsSchema, SimpleType } from '../types'

export interface IPropOptions extends ICommonSchemaOptions {
  type?: SimpleType
  schema?: any
  required?: boolean
  virtual?: boolean
  private?: boolean
}

export class PropMetadata {
  public name: string
  public schema!: IJsSchema
  public required: boolean = true
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
  if (options.virtual) {
    metadata.schema.virtual = true
  }
  if (options.private) {
    metadata.schema.private = options.private
  }
  const schemaOptions = copyProperties({}, options, ALL_JS_SCHEMA_PROPS.filter((item) => item !== 'required'))
  Object.assign(metadata.schema, schemaOptions)
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
