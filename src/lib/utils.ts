import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/schema'
import _ from 'lodash'
import { Constructor, IJsSchema, IJsonOptions } from '../types'
import jsonDataType, { JsonDataType } from './JsonDataType'
import dataType from './DataType'

export const getJsonOptions = (schema: IJsSchema, dataType: JsonDataType): IJsonOptions => {
  const jsonOptions = schema.json || dataType.get(schema.type)
  if (!jsonOptions) {
    throw new Error(`Unknown json type:${schema.type}`)
  }
  return jsonOptions
}

export const getJsonValidate = (schema: IJsSchema): ((schema: IJsSchema, data: any) => [boolean, string]) => {
  if (schema.json && schema.json.validate) {
    return schema.json.validate
  } else {
    const type = schema.type
    const jsonOptions = jsonDataType.get(type)
    if (!jsonOptions) {
      throw new Error(`Unknown json type:${type}`)
    }
    if (jsonOptions && jsonOptions.validate) {
      return jsonOptions.validate
    } else {
      return () => [true, '']
    }
  }
}
export const getJsonSerialize = (schema: IJsSchema) => {
  if (schema.json && schema.json.serialize) {
    return schema.json.serialize
  } else {
    const type = schema.type
    const jsonOptions = jsonDataType.get(type)
    if (jsonOptions && jsonOptions.serialize) {
      return jsonOptions.serialize
    } else {
      return (_1: IJsSchema, data: any) => data
    }
  }
}

export const getJsonDeserialize = (schema: IJsSchema) => {
  if (schema.json && schema.json.deserialize) {
    return schema.json.deserialize
  } else {
    const type = schema.type
    const jsonOptions = jsonDataType.get(type)
    if (jsonOptions && jsonOptions.deserialize) {
      return jsonOptions.deserialize
    } else {
      return (_1: IJsSchema, data: any) => data
    }
  }
}

export const defineSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
}

export const addType = (type: string, options: IJsonOptions) => {
  jsonDataType.add(type, options)
}

export const deserialize = (schema: IJsSchema, json: any) => {
  const validate = getJsonValidate(schema)
  const [valid, msg] = validate(schema, json)
  if (!valid) {
    throw new Error(msg)
  }
  const deserialize = getJsonDeserialize(schema)
  return deserialize(schema, json)
}

export const serialize = (schema: IJsSchema, data: any) => {
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

export const jsSchemaToJsonSchema = (schema: IJsSchema) => {
  const jsonSchema = _.cloneDeep(schema) as any
  if (jsonSchema.json) {
    if (jsonSchema.json.type) {
      jsonSchema.type = jsonSchema.json.type
    }
    if (jsonSchema.json.additionalProps) {
      Object.assign(jsonSchema, jsonSchema.json.additionalProps)
    }
    Reflect.deleteProperty(jsonSchema, 'json')
  }

  Reflect.deleteProperty(jsonSchema, 'modelConstructor')
  if (jsonSchema.items) {
    jsonSchema.items = jsSchemaToJsonSchema(jsonSchema.items)
  }
  const properties = jsonSchema.properties
  if (properties) {
    jsonSchema.properties = {}
    const props = Object.getOwnPropertyNames(properties)
    for (const prop of props) {
      const propSchema = properties[prop]
      const key = _.get(propSchema, 'json.name', prop)
      jsonSchema.properties[key] = jsSchemaToJsonSchema(propSchema)
      if (key !== prop && jsonSchema.required) {
        const index = jsonSchema.required.indexOf(prop)
        if (index !== -1) {
          jsonSchema.required[index] = key
        }
      }
    }
  }
  return jsonSchema
}

export const validateJson = (schema: IJsSchema, data: any) => {
  const validate = getJsonValidate(schema)
  return validate(schema, data)
}

export const validate = (schema: IJsSchema, data: any): [boolean, string] => {
  let schemaValidate = schema.validate
  if (schemaValidate) {
    return schemaValidate(schema, data)
  } else {
    const typeOptions = dataType.get(schema.type)
    if (typeOptions) {
      schemaValidate = typeOptions.validate
      return schemaValidate(schema, data)
    } else {
      return [true, '']
    }
  }
}
