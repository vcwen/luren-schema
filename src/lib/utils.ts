import _ from 'lodash'
import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { Constructor, IJsonSchema, IJsSchema } from '../types'
import DataTypes from './DataTypes'
import { IJsTypeOptions } from './JsType'

export const defineJsSchema = (target: Constructor, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(target.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, target.prototype)
}

export const getJsSchema = (target: object | Constructor) => {
  const targetObj = typeof target === 'object' ? Reflect.getPrototypeOf(target) : target.prototype
  const metadata: SchemaMetadata | undefined = Reflect.getOwnMetadata(MetadataKey.SCHEMA, targetObj)
  if (metadata) {
    return metadata.schema
  } else {
    return undefined
  }
}
export const validate = (data: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] => {
  const jsType = DataTypes.get(schema.type)
  return jsType.validate(data, schema, options)
}

export const serialize = (data: any, schema: IJsSchema, options?: IJsTypeOptions) => {
  const jsType = DataTypes.get(schema.type)
  const [valid, msg] = jsType.validate(data, schema, options)
  if (!valid) {
    throw new Error(msg)
  }
  return jsType.serialize(data, schema, options)
}

export const deserialize = (json: any, schema: IJsSchema, options?: IJsTypeOptions) => {
  const jsType = DataTypes.get(schema.type)
  const data = jsType.deserialize(json, schema, options)
  return data
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
  if (typeof schema === 'function') {
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
    const jsSchema: IJsSchema = { type: 'object' }
    const properties: { [key: string]: IJsSchema } = {}
    const requiredProps = [] as string[]
    const props = Object.getOwnPropertyNames(schema)
    for (const prop of props) {
      const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(schema[prop])
      const [propName, required] = normalizeProp(prop)
      properties[propName] = propSchema
      if (required && propRequired) {
        requiredProps.push(propName)
      }
    }
    if (!_.isEmpty(properties)) {
      jsSchema.properties = properties
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

export const toJsonSchema = <T extends IJsSchema>(schema: T) => {
  const jsonSchema: IJsonSchema = Reflect.getMetadata(MetadataKey.JSON_SCHEMA, schema)
  if (jsonSchema) {
    return jsonSchema
  }
  if (schema.toJsonSchema) {
    return schema.toJsonSchema()
  }
  const jsType = DataTypes.get(schema.type)
  return jsType.toJsonSchema(schema)
}

export const copyProperties = (target: object, source: object, props: string[]) => {
  for (const prop of props) {
    const value = Reflect.get(source, prop)
    if (value !== undefined) {
      Reflect.set(target, prop, value)
    }
  }
}

export const getInclusiveProps = (objectSchema: IJsSchema, options: IJsTypeOptions): string[] => {
  if (objectSchema.type !== 'object') {
    throw new Error('getInclusiveProps only works with object schema')
  }
  if (options.onlyProps) {
    return options.onlyProps
  }
  const include = options.include || []
  const exclude = options.exclude || []
  const includeProps = options.includeProps || []
  const excludeProps = options.excludeProps || []
  const properties = objectSchema.properties || {}
  const allProps = Object.getOwnPropertyNames(properties)
  let props = allProps.filter((prop) => {
    const propSchema = properties[prop]
    return !propSchema.virtual
  })
  if (_.isEmpty(options)) {
    return props
  }
  props = props.filter((prop) => {
    const propSchema = properties[prop]
    return !exclude.some((item) => {
      return Reflect.get(propSchema, item)
    })
  })
  props = props.concat(
    allProps.filter((prop) => {
      const propSchema = properties[prop]
      return include.some((item) => {
        return Reflect.get(propSchema, item)
      })
    })
  )
  props = _.uniq(props)
  props = _.difference(props, excludeProps)
  props = _.uniq(_.union(props, includeProps))
  props = _.intersection(props, allProps)
  return props
}

export const setErrorMessagePrefix = (err: any, prefix: string) => {
  if (err instanceof Error) {
    err.message = prefix + err.message
    return err
  } else {
    return prefix + err
  }
}
