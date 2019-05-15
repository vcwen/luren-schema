import { Map } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor, IJsSchema } from '../types'
import { PropMetadata } from './Prop'

export interface ISchemaOptions {
  id?: string
  validate?: (schema: IJsSchema, data: any) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any) => any
  deserialize?: (schema: IJsSchema, data: any) => any
  private?: boolean
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
      properties[prop] = Object.assign({}, propMetadata.schema, {
        name: propMetadata.name
      })
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
    if (options.validate) {
      jsSchema.validate = options.validate
    }
    if (options.serialize) {
      jsSchema.serialize = options.serialize
    }
    if (options.deserialize) {
      jsSchema.deserialize = options.deserialize
    }
    if (options.private) {
      jsSchema.private = options.private
    }

    const metadata = new SchemaMetadata(options.id || constructor.name, jsSchema, options.desc)
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  }
}
