import { Map } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { ALL_JS_SCHEMA_PROPS } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsSchema } from '../lib/JsSchema'
import { copyProperties } from '../lib/utils'
import { Constructor, ICommonSchemaOptions } from '../types'
import { PropMetadata } from './Prop'

export interface ISchemaOptions extends ICommonSchemaOptions {
  desc?: string
}

export class SchemaMetadata {
  public name: string
  public schema: IJsSchema
  public desc?: string
  constructor(name: string, schema: any, desc?: string) {
    this.name = name
    this.schema = schema
    this.desc = desc
  }
}

export function Schema(options: ISchemaOptions = {}) {
  return (constructor: Constructor<any>) => {
    const jsSchema: IJsSchema = {
      type: 'object',
      classConstructor: constructor
    }
    const propMetadataMap: Map<string, PropMetadata> =
      Reflect.getMetadata(MetadataKey.PROPS, constructor.prototype) || Map()
    const properties = {} as any
    const requiredProps: string[] = []
    for (const [prop, propMetadata] of propMetadataMap) {
      properties[prop] = Object.assign({}, propMetadata.schema)
      if (propMetadata.required) {
        requiredProps.push(prop)
      }
    }
    if (!_.isEmpty(properties)) {
      jsSchema.properties = properties
    }
    if (!_.isEmpty(requiredProps)) {
      jsSchema.required = requiredProps
    }

    const metadata = new SchemaMetadata(constructor.name, jsSchema, options.desc)
    copyProperties(metadata.schema, options, ALL_JS_SCHEMA_PROPS)
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  }
}
