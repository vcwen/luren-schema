import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/schema'
import _ from 'lodash'
import { Constructor, IJsSchema, IJsonProcessor } from '../types'
import jsonDataType, { JsonDataType } from './JsonDataType'

export const getJsonProcessor = (schema: IJsSchema, dataType: JsonDataType) => {
  const jsonProcessor = schema.json || dataType.get(schema.type)
  if (!jsonProcessor) {
    throw new Error(`Unknown json type:${schema.type}`)
  }
  return jsonProcessor
}

export const getJsonValidate = (schema: IJsSchema) => {
  if (schema.json && schema.json.validate) {
    return schema.json.validate
  } else {
    const type = schema.type
    const jsonProcessor = jsonDataType.get(type)
    if (!jsonProcessor) {
      throw new Error(`Unknown json type:${type}`)
    }
    const validate = jsonProcessor.validate
    if (!validate) {
      throw new Error(`No validate for type:${type}`)
    }
    return validate
  }
}
export const getJsonSerialize = (schema: IJsSchema) => {
  if (schema.json && schema.json.serialize) {
    return schema.json.serialize
  } else {
    const type = schema.type
    const jsonProcessor = jsonDataType.get(type)
    if (!jsonProcessor) {
      throw new Error(`Unknown json type:${type}`)
    }
    const serialize = jsonProcessor.serialize
    if (!serialize) {
      throw new Error(`No serialize for type:${type}`)
    }
    return serialize
  }
}

export const getJsonDeserialize = (schema: IJsSchema) => {
  if (schema.json && schema.json.deserialize) {
    return schema.json.deserialize
  } else {
    const type = schema.type
    const jsonProcessor = jsonDataType.get(type)
    if (!jsonProcessor) {
      throw new Error(`Unknown json type:${type}`)
    }
    const deserialize = jsonProcessor.deserialize
    if (!deserialize) {
      throw new Error(`No deserialize for type:${type}`)
    }
    return deserialize
  }
}

export const defineSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
}

export const addType = (type: string, processor: IJsonProcessor) => {
  jsonDataType.add(type, processor)
}

export const jsonToData = (json: any, schema: IJsSchema) => {
  const validate = getJsonValidate(schema)
  const [valid, msg] = validate(schema, json)
  if (!valid) {
    throw new Error(msg)
  }
  const deserialize = getJsonDeserialize(schema)
  return deserialize(schema, json)
}

export const dataToJson = (data: any, schema: IJsSchema) => {
  const serialize = getJsonSerialize(schema)
  return serialize(schema, data)
}

const normalizeType = (type: string): [string, boolean] => {
  const regex = /(\w+?)(\?)?$/
  const match = regex.exec(type)
  if (match) {
    const prop = match[1]
    // tslint:disable-next-line:no-magic-numbers
    if (match[2]) {
      return [prop, false]
    } else {
      return [prop, true]
    }
  } else {
    throw new Error('Invalid type:' + type)
  }
}

const normalizeProp = (decoratedProp: string): [string, boolean] => {
  const regex = /(\w+?)(\?)?$/
  const match = regex.exec(decoratedProp)
  if (match) {
    const prop = match[1]
    // tslint:disable-next-line:no-magic-numbers
    if (match[2]) {
      return [prop, false]
    } else {
      return [prop, true]
    }
  } else {
    throw new Error('Invalid prop:' + decoratedProp)
  }
}

export const convertSimpleSchemaToJsSchema = (schema: any): [any, boolean] => {
  if (typeof schema === 'string') {
    const [type, required] = normalizeType(schema)
    const jsonSchema: any = { type }
    return [jsonSchema, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = { type: 'array' }
    if (schema[0]) {
      const [itemSchema] = convertSimpleSchemaToJsSchema(schema[0])
      propSchema.items = itemSchema
    }
    return [propSchema, true]
  } else if (typeof schema === 'object') {
    const jsSchema: IJsSchema = { type: 'object', properties: {} } as any
    const requiredProps = [] as string[]
    const props = Object.getOwnPropertyNames(schema)
    for (const prop of props) {
      const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(schema[prop])
      const [propName, required] = normalizeProp(prop)
      if (jsSchema.properties) {
        jsSchema.properties[propName] = propSchema
      }
      if (required && propRequired) {
        requiredProps.push(propName)
      }
    }
    if (!_.isEmpty(requiredProps)) {
      jsSchema.required = requiredProps
    }
    return [jsSchema, true]
  } else if (typeof schema === 'function') {
    const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, schema)
    if (!schemaMetadata) {
      throw new Error(`Invalid schema:${schema.name}`)
    }
    return [schemaMetadata.schema, true]
  } else {
    throw new TypeError('Invalid schema:' + schema)
  }
}

export const normalizeSimpleSchema = (schema: any): any => {
  if (typeof schema === 'function') {
    const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, schema.prototype)
    if (schemaMetadata) {
      return schemaMetadata.schema
    } else {
      throw new Error('Invalid schema.')
    }
  }
  if (_.isEmpty(schema)) {
    throw new Error('Invalid schema.')
  }
  const [jsSchema] = convertSimpleSchemaToJsSchema(schema)
  return jsSchema
}
