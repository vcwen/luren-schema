import _ from 'lodash'
import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/schema'
import { Constructor, IJsSchema } from '../types'
import { DataType } from './DataType'

export const getTypeOption = (
  prop: string,
  schema: IJsSchema
): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  let property = _.get(schema, prop)
  if (!property) {
    const type = schema.type
    const typeOptions = DataType.get(type)
    if (typeOptions) {
      property = _.get(typeOptions, prop)
    }
  }
  return property
}

export const getValidate = (schema: IJsSchema): ((schema: IJsSchema, data: any) => [boolean, string]) | undefined => {
  return getTypeOption('validate', schema)
}
export const getSerialize = (schema: IJsSchema): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('serialize', schema)
}

export const getDeserialize = (schema: IJsSchema): ((schema: IJsSchema, data: any) => any) | undefined => {
  return getTypeOption('deserialize', schema)
}

export const defineSchema = (constructor: Constructor<any>, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(constructor.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
}

export const validate = (schema: IJsSchema, data: any): [boolean, string] => {
  const validateFunc = getValidate(schema)
  if (validateFunc) {
    return validateFunc(schema, data)
  } else {
    return [true, '']
  }
}

export const deserialize = (schema: IJsSchema, json: any, validated: boolean = false) => {
  if (!validated) {
    const [valid, msg] = validate(schema, json)
    if (!valid) {
      throw new Error(msg)
    }
  }
  const deserializeFunc = getDeserialize(schema)
  if (deserializeFunc) {
    return deserializeFunc(schema, json)
  } else {
    return json
  }
}

export const serialize = (schema: IJsSchema, data: any, validated: boolean = false) => {
  if (!validated) {
    const [valid, msg] = validate(schema, data)
    if (!valid) {
      throw new Error(msg)
    }
  }
  const serializeFunc = getSerialize(schema)
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
  const jsonSchema = _.cloneDeep(schema) as any
  if (schema.json) {
    if (schema.json.type) {
      jsonSchema.type = jsonSchema.json.type
    }
    if (schema.json.additionalProps) {
      Object.assign(jsonSchema, schema.json.additionalProps)
    }
    Reflect.deleteProperty(jsonSchema, 'json')
  }
  Reflect.deleteProperty(jsonSchema, 'classConstructor')
  if (jsonSchema.items) {
    jsonSchema.items = jsSchemaToJsonSchema(jsonSchema.items)
  }
  const properties = schema.properties
  if (properties) {
    jsonSchema.properties = {}
    const props = Object.getOwnPropertyNames(properties)
    for (const prop of props) {
      const propSchema = properties[prop]
      if (propSchema.json && propSchema.json.disabled) {
        continue
      }
      jsonSchema.properties[prop] = jsSchemaToJsonSchema(propSchema)
    }
  }
  return jsonSchema
}
