import { Map } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor, IJsSchema } from '../types'
import { PropMetadata } from './Prop'

export interface ISchemaOptions {
  id?: string
  private?: boolean
  additionalProps?: boolean
  desc?: string
}

export class SchemaMetadata {
  public id: string
  public schema: IJsSchema
  public desc?: string
  constructor(id: string, schema: any, desc?: string) {
    this.id = id
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
    if (options.private) {
      jsSchema.private = true
    }
    if (options.additionalProps) {
      jsSchema.additionalProperties = true
    }

    const metadata = new SchemaMetadata(options.id || constructor.name, jsSchema, options.desc)
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  }
}
