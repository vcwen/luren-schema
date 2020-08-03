import { Map } from 'immutable'
import 'reflect-metadata'
import { JS_SCHEMA_PROPS } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsSchema } from '../lib/JsSchema'
import { convertSimpleSchemaToJsSchema, copyProperties } from '../lib/utils'
import { ICommonSchemaOptions, SimpleType } from '../types'

export interface IPropOptions extends ICommonSchemaOptions {
  type?: SimpleType
  schema?: any
  required?: boolean
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

const getPropMetadata = (
  options: IPropOptions,
  _2: object,
  propertyKey: string,
  descriptor?: TypedPropertyDescriptor<any>
) => {
  const metadata = new PropMetadata(propertyKey, options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(
      options.type || 'string'
    )
    metadata.schema = propSchema
    if (options.required === undefined) {
      metadata.required = propRequired
    }
  }
  if (descriptor) {
    if (descriptor.get) {
      if (!descriptor.set) {
        metadata.schema.virtual = true
      }
    } else {
      // only setter
      throw new Error('Only setter of property is not allowed')
    }
  }
  const schemaOptions = copyProperties(
    {},
    options,
    JS_SCHEMA_PROPS.filter((item) => item !== 'required')
  )
  Object.assign(metadata.schema, schemaOptions)
  return metadata
}

export function Prop(options: IPropOptions = {}) {
  return (
    target: object,
    propertyKey: string,
    descriptor?: TypedPropertyDescriptor<any>
  ) => {
    let metadataMap: Map<string, PropMetadata> =
      Reflect.getMetadata(MetadataKey.PROPS, target) || Map()
    const metadata = getPropMetadata(options, target, propertyKey, descriptor)
    metadataMap = metadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.PROPS, metadataMap, target)
  }
}
