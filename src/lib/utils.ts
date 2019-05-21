import _ from 'lodash'
import { MetadataKey } from '../constants/MetadataKey'
import UtilMetadataKey from '../constants/UtilMetadataKey'
import { SchemaMetadata } from '../decorators/schema'
import { Constructor, IJsSchema, ITypeOptions } from '../types'
import { DataTypes, jsDataTypes } from './DataType'

export const getTypeOption = <T>(
  prop: string,
  schema: IJsSchema,
  dataTypes: DataTypes<T>
): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  let property = _.get(schema, prop)
  if (!property) {
    const type = schema.type
    const typeOptions = dataTypes.get(type)
    if (typeOptions) {
      property = _.get(typeOptions, prop)
    }
  }
  return property
}

export const getValidate = (
  schema: IJsSchema,
  dataTypes: DataTypes<ITypeOptions> = jsDataTypes
): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  return getTypeOption('validate', schema, dataTypes)
}
export const getSerialize = (
  schema: IJsSchema,
  dataTypes: DataTypes<ITypeOptions> = jsDataTypes
): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('serialize', schema, dataTypes)
}

export const getDeserialize = (
  schema: IJsSchema,
  dataTypes: DataTypes<ITypeOptions> = jsDataTypes
): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('deserialize', schema, dataTypes)
}

export const defineSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
}

export const validate = (
  schema: IJsSchema,
  data: any,
  dataTypes: DataTypes<ITypeOptions> = jsDataTypes
): [boolean, string] => {
  const validateFunc = getValidate(schema, dataTypes)
  if (validateFunc) {
    return validateFunc(schema, data)
  } else {
    return [true, '']
  }
}

export const deserialize = (schema: IJsSchema, json: any, dataTypes: DataTypes<ITypeOptions> = jsDataTypes) => {
  let data = json
  const deserializeFunc = getDeserialize(schema, dataTypes)
  if (deserializeFunc) {
    data = deserializeFunc(schema, json)
  }
  const [valid, msg] = validate(schema, data)
  if (!valid) {
    throw new Error(msg)
  }
  return data
}

export const serialize = (schema: IJsSchema, data: any, dataTypes: DataTypes<ITypeOptions> = jsDataTypes) => {
  const [valid, msg] = validate(schema, data)
  if (!valid) {
    throw new Error(msg)
  }

  const serializeFunc = getSerialize(schema, dataTypes)
  if (serializeFunc) {
    return serializeFunc(schema, data)
  } else {
    return data
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
      return _.cloneDeep(schemaMetadata.schema)
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
  let jsonSchema = Reflect.getMetadata(UtilMetadataKey.JSON_SCHEMA, schema)
  if (jsonSchema) {
    return jsonSchema
  } else {
    jsonSchema = _.cloneDeep(schema) as any
    const typeOptions = jsDataTypes.get(schema.type)
    if (typeOptions && typeOptions.json) {
      if (typeOptions.json.type) {
        jsonSchema.type = typeOptions.json.type
      }
      if (typeOptions.json.additionalProps) {
        Object.assign(jsonSchema, typeOptions.json.additionalProps)
      }
    }
    if (jsonSchema.classConstructor) {
      Reflect.deleteProperty(jsonSchema, 'classConstructor')
    }

    if (jsonSchema.items) {
      jsonSchema.items = jsSchemaToJsonSchema(jsonSchema.items)
    }
    const properties = schema.properties
    if (properties) {
      jsonSchema.properties = {}
      const props = Object.getOwnPropertyNames(properties)
      for (const prop of props) {
        const propSchema = properties[prop]
        if (propSchema.private) {
          continue
        }
        jsonSchema.properties[prop] = jsSchemaToJsonSchema(propSchema)
      }
    }
    Reflect.defineMetadata(UtilMetadataKey.JSON_SCHEMA, jsonSchema, schema)
    return jsonSchema
  }
}
