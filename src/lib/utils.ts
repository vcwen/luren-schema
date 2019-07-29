import _ from 'lodash'
import util from 'util'
import { MetadataKey } from '../constants/MetadataKey'
import UtilMetadataKey from '../constants/UtilMetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { Constructor, IDataSchema, IJsonSchema, IJsSchema, IPersistSchema } from '../types'
import { DataTypes } from './DataTypes'
import JsDataTypes from './JsDataTypes'

export const isPrimitive = (value: any) => {
  return (typeof value !== 'object' && typeof value !== 'function') || value === null
}
export const getValidate = (
  schema: IJsSchema,
  dataTypes: DataTypes
): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  const type = schema.type
  const typeOptions = dataTypes.get(type)
  if (typeOptions) {
    return typeOptions.validate
  }
}
export const getSerialize = (
  schema: IJsSchema,
  dataTypes: DataTypes
): ((schema: IJsSchema, data: any) => any) | undefined => {
  const type = schema.type
  const typeOptions = dataTypes.get(type)
  if (typeOptions) {
    return typeOptions.serialize
  }
}

export const getDeserialize = (
  schema: IJsSchema,
  dataTypes: DataTypes
): ((schema: IJsSchema, data: any) => any) | undefined => {
  const type = schema.type
  const typeOptions = dataTypes.get(type)
  if (typeOptions) {
    return typeOptions.deserialize
  }
}

export const defineSchema = (
  constructor: Constructor<any>,
  schema: IJsSchema,
  simpleSchemaResolver?: (simpleSchema: any) => IJsSchema | undefined
) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  if (simpleSchemaResolver) {
    Reflect.defineMetadata(MetadataKey.SIMPLE_SCHEMA_RESOLVER, simpleSchemaResolver, constructor.prototype)
  }
}

export const validate = (data: any, schema?: IJsSchema, dataTypes: DataTypes = JsDataTypes): [boolean, string] => {
  if (!schema) {
    const metadata: SchemaMetadata | undefined = Reflect.getOwnMetadata(MetadataKey.SCHEMA, data)
    if (metadata) {
      schema = metadata.schema
    } else {
      throw new Error(`No schema found for ${util.inspect(data)}`)
    }
  }
  const validator = getValidate(schema, dataTypes)
  if (validator) {
    return validator(schema, data)
  } else {
    throw new Error(`No validate function available for ${schema.type}`)
  }
}

export const deserialize = (json: any, schema: IJsSchema, dataTypes: DataTypes = JsDataTypes) => {
  const deserializer = getDeserialize(schema, dataTypes)
  if (!deserializer) {
    throw new Error(`No deserialize function available for ${schema.type}`)
  }

  const data = deserializer(schema, json)

  const [valid, msg] = validate(schema, data)
  if (!valid) {
    throw new Error(msg)
  }
  return data
}

export const serialize = (data: any, schema?: IJsSchema, dataTypes: DataTypes = JsDataTypes) => {
  if (!schema) {
    const metadata: SchemaMetadata | undefined = Reflect.getOwnMetadata(MetadataKey.SCHEMA, data)
    if (metadata) {
      schema = metadata.schema
    } else {
      throw new Error(`No schema found for ${util.inspect(data)}`)
    }
  }
  const [valid, msg] = validate(schema, data)
  if (!valid) {
    throw new Error(msg)
  }
  const serializer = getSerialize(schema, dataTypes)
  if (serializer) {
    return serializer(schema, data)
  } else {
    throw new Error(`No serialize function available for ${schema.type}`)
  }
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

export const convertSimpleSchemaToJsSchema = (schema: any): [IJsSchema, boolean] => {
  if (typeof schema === 'object' && !Array.isArray(schema)) {
    const resolver: (simpleSchema: any) => IJsSchema | undefined = Reflect.getMetadata(
      MetadataKey.SIMPLE_SCHEMA_RESOLVER,
      schema
    )
    if (resolver) {
      const jsSchema = resolver(schema)
      if (jsSchema) {
        return [jsSchema, true]
      }
    }
  } else if (typeof schema === 'function') {
    const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, schema.prototype)
    if (schemaMetadata) {
      return [schemaMetadata.schema, true]
    } else {
      let type: string
      switch (schema) {
        case String:
          type = 'string'
          break
        case Boolean:
          type = 'boolean'
          break
        case Number:
          type = 'number'
          break
        case Object:
          type = 'object'
          break
        case Date:
          type = 'date'
          break
        case Array:
          type = 'array'
          break
        default:
          throw new Error(`Invalid schema:${schema}`)
      }
      return [{ type }, true]
    }
  }

  let extraOptions: any

  // if length is greater than one, it means it has options rather than an array type
  if (Array.isArray(schema) && schema.length > 1) {
    extraOptions = schema[1]
    schema = schema[0]
  }

  if (typeof schema === 'string') {
    const [type, required] = normalizeType(schema)
    const jsSchema: IJsSchema = Object.assign({ type }, extraOptions)
    return [jsSchema, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = Object.assign({ type: 'array' }, extraOptions)
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
    Object.assign(jsSchema, extraOptions)
    return [jsSchema, true]
  } else {
    throw new TypeError('Invalid schema:' + schema)
  }
}

export const normalizeSimpleSchema = (schema: any) => {
  return convertSimpleSchemaToJsSchema(schema)
}

export const toJsonSchema = <T extends IDataSchema>(
  schema: T,
  dataTypes: DataTypes,
  propertiesHandler?: (properties: { [prop: string]: T }) => { [prop: string]: T }
) => {
  let jsonSchema: IJsonSchema = Reflect.getMetadata(UtilMetadataKey.JSON_SCHEMA, schema)
  if (jsonSchema) {
    return jsonSchema
  }
  if (schema.toJsonSchema) {
    return schema.toJsonSchema()
  }
  const jsSchema = schema
  const typeOptions = dataTypes.get(schema.type)

  if (typeOptions) {
    jsonSchema = typeOptions.toJsonSchema()
  } else {
    jsonSchema = { type: jsSchema.type }
  }

  if (jsSchema.items) {
    jsonSchema.items = toJsonSchema(jsSchema.items as T, dataTypes, propertiesHandler)
  }
  let properties = schema.properties
  if (properties) {
    jsonSchema.properties = {}
    if (propertiesHandler) {
      properties = propertiesHandler(properties as any)
    }
    const props = Object.getOwnPropertyNames(properties)
    for (const prop of props) {
      const propSchema = properties[prop]
      jsonSchema.properties[prop] = toJsonSchema(propSchema as T, dataTypes, propertiesHandler)
    }
  }
  const propNames = Object.getOwnPropertyNames(jsSchema).filter(
    (prop) => !['type', 'items', 'properties'].includes(prop)
  )
  for (const prop of propNames) {
    const val = Reflect.get(jsSchema, prop)
    if (val !== undefined && typeof val !== 'function') {
      Reflect.set(jsonSchema, prop, val)
    }
  }
  Reflect.defineMetadata(UtilMetadataKey.JSON_SCHEMA, jsonSchema, schema)
  return jsonSchema
}

export const jsSchemaToJsonSchema = (schema: IJsSchema, dataTypes: DataTypes) => {
  return toJsonSchema<IJsSchema>(schema, dataTypes, (properties) => {
    const filteredProperties = {}
    const props = Object.getOwnPropertyNames(properties)
    for (const prop of props) {
      const propSchema = properties[prop]
      if (propSchema.private) {
        continue
      }
      Reflect.set(filteredProperties, prop, Reflect.get(properties, prop))
    }
    return filteredProperties
  })
}

export const persistSchemaToJsonSchema = (schema: IPersistSchema, dataTypes: DataTypes) => {
  return toJsonSchema(schema, dataTypes)
}
