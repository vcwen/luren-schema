import _ from 'lodash'
import { MetadataKey } from '../constants/MetadataKey'
import UtilMetadataKey from '../constants/UtilMetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { Constructor, IJsSchema, IJsTypeOptions, ITypeOptions } from '../types'
import { DataTypes } from './DataTypes'

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
  dataTypes: DataTypes<ITypeOptions>
): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  return getTypeOption('validate', schema, dataTypes)
}
export const getSerialize = (
  schema: IJsSchema,
  dataTypes: DataTypes<ITypeOptions>
): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('serialize', schema, dataTypes)
}

export const getDeserialize = (
  schema: IJsSchema,
  dataTypes: DataTypes<ITypeOptions>
): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('deserialize', schema, dataTypes)
}

export const defineSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
}

export const validate = (schema: IJsSchema, data: any, dataTypes: DataTypes<ITypeOptions>): [boolean, string] => {
  const validateFunc = getValidate(schema, dataTypes)
  if (validateFunc) {
    return validateFunc(schema, data)
  } else {
    throw new Error(`No validate function available for ${schema.type}`)
  }
}

export const deserialize = (schema: IJsSchema, json: any, dataTypes: DataTypes<ITypeOptions>) => {
  let data = json
  const deserializeFunc = getDeserialize(schema, dataTypes)
  if (deserializeFunc) {
    data = deserializeFunc(schema, json)
  } else {
    throw new Error(`No deserialize function available for ${schema.type}`)
  }
  const [valid, msg] = validate(schema, data, dataTypes)
  if (!valid) {
    throw new Error(msg)
  }
  return data
}

export const serialize = (schema: IJsSchema, data: any, dataTypes: DataTypes<ITypeOptions>) => {
  const [valid, msg] = validate(schema, data, dataTypes)
  if (!valid) {
    throw new Error(msg)
  }

  const serializeFunc = getSerialize(schema, dataTypes)
  if (serializeFunc) {
    return serializeFunc(schema, data)
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

export const convertSimpleSchemaToJsSchema = (
  schema: any,
  // tslint:disable-next-line: ban-types
  classSchemaResolver: (constructor: Function) => IJsSchema | undefined
): [IJsSchema, boolean] => {
  if (typeof schema === 'function') {
    let metadataSchema: IJsSchema | undefined
    if (classSchemaResolver) {
      const classSchema = classSchemaResolver(schema)
      if (classSchema) {
        return [classSchema, true]
      }
    } else {
      const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, schema)
      if (schemaMetadata) {
        metadataSchema = schemaMetadata.schema
      }
    }
    if (metadataSchema) {
      return [metadataSchema, true]
    } else {
      switch (schema) {
        case String:
          schema = 'string'
          break
        case Boolean:
          schema = 'boolean'
          break
        case Number:
          schema = 'number'
          break
        case Object:
          schema = 'object'
          break
        case Date:
          schema = 'date'
          break
        case Array:
          schema = 'array'
          break
        default:
          throw new Error(`Invalid schema:${schema}`)
      }
    }
  }
  if (typeof schema === 'string') {
    const [type, required] = normalizeType(schema)
    const jsonSchema: any = { type }
    return [jsonSchema, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = { type: 'array' }
    if (schema[0]) {
      const [itemSchema] = convertSimpleSchemaToJsSchema(schema[0], classSchemaResolver)
      propSchema.items = itemSchema
    }
    return [propSchema, true]
  } else if (typeof schema === 'object') {
    const jsSchema: IJsSchema = { type: 'object', properties: {} } as any
    const requiredProps = [] as string[]
    const props = Object.getOwnPropertyNames(schema)
    for (const prop of props) {
      const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(schema[prop], classSchemaResolver)
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
  } else {
    throw new TypeError('Invalid schema:' + schema)
  }
}

export const normalizeSimpleSchema = (schema: any) => {
  return convertSimpleSchemaToJsSchema(schema, (constructor) => {
    const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, constructor.prototype)
    if (schemaMetadata) {
      return schemaMetadata.schema
    }
  })
}

export const jsSchemaToJsonSchema = (schema: IJsSchema, jsDataTypes: DataTypes<IJsTypeOptions>) => {
  let jsonSchema = Reflect.getMetadata(UtilMetadataKey.JSON_SCHEMA, schema)
  if (jsonSchema) {
    return jsonSchema
  }
  if (schema.toJsonSchema) {
    return schema.toJsonSchema()
  }
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
    jsonSchema.items = jsSchemaToJsonSchema(jsonSchema.items, jsDataTypes)
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
      jsonSchema.properties[prop] = jsSchemaToJsonSchema(propSchema, jsDataTypes)
    }
  }
  Reflect.defineMetadata(UtilMetadataKey.JSON_SCHEMA, jsonSchema, schema)
  return jsonSchema
}

export const mixinDecorators = (target: any, ...mixins: any[]) => {
  for (const mixin of mixins) {
    const keys = Reflect.getMetadataKeys(target)
    for (const key of keys) {
      const metadata = Reflect.getMetadata(key, mixin)
      Reflect.defineMetadata(key, metadata, target)
    }
  }
}
