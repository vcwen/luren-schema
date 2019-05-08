import { Map } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor, IJsSchema, IJsonOptions } from '../types'
import { PropMetadata } from './Prop'
import { getJsonValidate, getJsonSerialize, getJsonDeserialize } from '../lib/utils'
import jsonDataType from '../lib/JsonDataType'

export interface ISchemaOptions {
  id?: string
  validate?: (
    schema: IJsSchema,
    data: any,
    defaultValidate?: (schema: IJsSchema, data: any) => [boolean, string]
  ) => [boolean, string]
  serialize?: (schema: IJsSchema, data: any, defaultSerialize?: (schema: IJsSchema, data: any) => any) => any
  deserialize?: (schema: IJsSchema, data: any, defaultDeserialize?: (schema: IJsSchema, data: any) => any) => any
  jsonType?: string
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
      modelConstructor: constructor
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

    const metadata = new SchemaMetadata(options.id || constructor.name, jsSchema, options.desc)
    const jsonProcessor: IJsonOptions = {} as any
    const type = metadata.schema.type
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
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  }
}
