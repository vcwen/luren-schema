import _ from 'lodash'
import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { Constructor } from '../types'
import { IJsSchema } from './JsSchema'
import { Tuple } from './Tuple'

export const defineJsSchema = (target: Constructor, schema: IJsSchema) => {
  const metadata = new SchemaMetadata(target.name, schema)
  Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, target.prototype)
}

export const getJsSchema = (target: object | Constructor) => {
  const targetObj =
    typeof target === 'object'
      ? Reflect.getPrototypeOf(target)
      : target.prototype
  const metadata: SchemaMetadata | undefined = Reflect.getOwnMetadata(
    MetadataKey.SCHEMA,
    targetObj
  )
  if (metadata) {
    return metadata.schema
  } else {
    return undefined
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
  simpleSchema: any,
  // tslint:disable-next-line: ban-types
  preprocessor?: (simpleSchema: any) => IJsSchema | undefined
): [IJsSchema, boolean] => {
  if (!preprocessor) {
    // tslint:disable-next-line: ban-types
    preprocessor = (simSchema: any) => {
      if (typeof simSchema === 'function') {
        const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(
          MetadataKey.SCHEMA,
          simSchema.prototype
        )
        if (schemaMetadata) {
          return schemaMetadata.schema
        }
      }
    }
  }
  const schema = preprocessor(simpleSchema)
  if (schema) {
    return [schema, true]
  }
  if (typeof simpleSchema === 'function') {
    let type: string
    switch (simpleSchema) {
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
        throw new Error(`Invalid schema:${simpleSchema}`)
    }
    return [{ type }, true]
  }

  let extraOptions: any

  // if length is greater than one, it means it has options rather than an array type
  if (Array.isArray(simpleSchema) && simpleSchema.length > 1) {
    extraOptions = simpleSchema[1]
    simpleSchema = simpleSchema[0]
  }

  if (typeof simpleSchema === 'string') {
    const [type, required] = normalizeType(simpleSchema)
    const jsSchema: IJsSchema = Object.assign({ type }, extraOptions)
    return [jsSchema, required]
  } else if (Array.isArray(simpleSchema)) {
    const propSchema: any = Object.assign({ type: 'array' }, extraOptions)
    if (simpleSchema[0]) {
      const [itemSchema] = convertSimpleSchemaToJsSchema(
        simpleSchema[0],
        preprocessor
      )
      propSchema.items = itemSchema
    }
    return [propSchema, true]
  } else if (simpleSchema instanceof Tuple) {
    const propSchema: any = Object.assign({ type: 'array' }, extraOptions)
    const items = simpleSchema.items
    propSchema.items = items.map((item) => {
      const [s] = convertSimpleSchemaToJsSchema(item, preprocessor)
      return s
    })
    return [propSchema, true]
  } else if (typeof simpleSchema === 'object') {
    const jsSchema: IJsSchema = { type: 'object' }
    const properties: { [key: string]: IJsSchema } = {}
    const requiredProps = [] as string[]
    const props = Object.getOwnPropertyNames(simpleSchema)
    for (const prop of props) {
      const [propSchema, propRequired] = convertSimpleSchemaToJsSchema(
        simpleSchema[prop],
        preprocessor
      )
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
    throw new TypeError('Invalid schema:' + simpleSchema)
  }
}

export const copyProperties = (
  target: object,
  source: object,
  props: string[]
) => {
  for (const prop of props) {
    const value = Reflect.get(source, prop)
    if (!_.isNil(value)) {
      Reflect.set(target, prop, value)
    }
  }
  return target
}

export const clone = <T>(
  source: T,
  filter: (key: string, val: any) => boolean = () => true
): T => {
  if (_.isNil(source)) {
    return source
  }
  if (typeof source !== 'object') {
    return source
  }
  if (Array.isArray(source)) {
    return source.map((item) => clone(item, filter)) as any
  } else {
    const copy: any = {}
    const keys = Object.keys(source)
    for (const key of keys) {
      const val: any = Reflect.get(source as any, key)
      if (filter(key, val)) {
        copy[key] = clone(val, filter)
      }
    }
    return copy as T
  }
}

export const setErrorMessagePrefix = (err: any, prefix: string) => {
  if (err instanceof Error) {
    err.message = prefix + err.message
    return err
  } else {
    return prefix + err
  }
}

export const normalizeNullValue = (value: any) => {
  if (value === null) {
    value = undefined
  } else if (Array.isArray(value)) {
    value = value.map((item) => {
      if (item === null) {
        return undefined
      } else {
        return item
      }
    })
  } else if (typeof value === 'object') {
    const props = Object.getOwnPropertyNames(value)
    for (const prop of props) {
      if (Reflect.get(value, prop) === null) {
        Reflect.set(value, prop, undefined)
      }
    }
  }
  return value
}

type Props = number | string | Props[] | { [prop: string]: Props }
// when val is set that mean the prop is a key
export const normalizeStringProp = (prop: string, val?: Props) => {
  const originProp = prop
  prop = prop.replace(arraySymbolRegex, '.')
  prop = prop.replace(dotTrimRegex, '')
  if (prop.includes('.')) {
    const propsInArray = prop.split('.')
    if (propsInArray.length === 2) {
      if (val) {
        return { [propsInArray[0]]: { [propsInArray[1]]: val } }
      } else {
        return { [propsInArray[0]]: propsInArray[1] }
      }
    } else if (propsInArray.length > 2) {
      const propsInObject: Props = {}
      let parent = propsInObject
      let parentKey: string = propsInArray[0]
      for (let i = 1; i < propsInArray.length - 2; i++) {
        const obj = {}
        Reflect.set(parent, propsInArray[i], obj)
        parent = obj
        parentKey = propsInArray[i]
      }
      if (val) {
        parent[parentKey] = {
          [propsInArray[propsInArray.length - 2]]: {
            [propsInArray[propsInArray.length - 1]]: val
          }
        }
      } else {
        parent[parentKey] = {
          [propsInArray[propsInArray.length - 2]]:
            propsInArray[propsInArray.length - 1]
        }
      }
      return propsInObject as Props
    } else {
      throw new Error(`Invalid prop ${originProp}`)
    }
  } else {
    if (val) {
      return { [prop]: val }
    } else {
      return prop
    }
  }
}

const arraySymbolRegex = new RegExp('[\\[|\\]]', 'g')
const dotTrimRegex = new RegExp(/(^\.)|(\.$)/, 'g')
export const normalizeProps = (props: Props): Props => {
  if (typeof props === 'number') {
    return props.toString()
  } else if (typeof props === 'string') {
    return normalizeStringProp(props) as string
  } else if (Array.isArray(props)) {
    return (props as any[]).map((prop) => normalizeProps(prop))
  } else {
    const propsObj: Props = {}
    const keys = Object.keys(props)
    for (const key of keys) {
      Object.assign(
        propsObj,
        normalizeStringProp(key, normalizeProps(props[key]))
      )
    }
    return propsObj
  }
}

export const includeSchemaProps = (
  schema: IJsSchema,
  props: Props
): IJsSchema => {
  const newSchema: IJsSchema = { ...schema }
  if (schema.type === 'array') {
    if (schema.items) {
      // tuple
      if (Array.isArray(schema.items)) {
        const items: IJsSchema[] = []
        if (Array.isArray(props)) {
          for (let i = 0; i < props.length; i++) {
            if (typeof props[i] === 'number') {
              items.push(schema.items[props[i] as number])
            } else {
              items.push(includeSchemaProps(schema.items[i], props[i]))
            }
          }
        } else if (typeof props === 'number') {
          items.push(Reflect.get(items, props))
        } else if (typeof props === 'string') {
          const parsed = Number.parseInt(props, 10)
          if (Number.isNaN(parsed)) {
            throw new Error('Only index or array is valid for tuple type')
          } else {
            items.push(Reflect.get(items, props))
          }
        } else {
          throw new Error('Only index or array is valid for tuple type')
        }
        newSchema.items = items
      } else {
        newSchema.items = includeSchemaProps(schema.items, props)
      }
    } else {
      throw new Error(
        `can not include ${JSON.stringify(props)} in a type unspecified array`
      )
    }
  } else if (schema.type === 'object') {
    if (schema.properties) {
      const properties: { [key: string]: IJsSchema } = {}
      if (typeof props === 'string' || typeof props === 'number') {
        properties[props] = schema.properties[props]
      } else if (Array.isArray(props)) {
        for (const p of props) {
          if (typeof p === 'object') {
            const keys = Object.keys(p)
            for (const key of keys) {
              properties[key] = includeSchemaProps(
                schema.properties[key],
                Reflect.get(p, key)
              )
            }
          } else {
            properties[p] = schema.properties[p]
          }
        }
      } else {
        const propNames = Object.keys(props)
        for (const pn of propNames) {
          properties[pn] = includeSchemaProps(schema.properties[pn], props[pn])
        }
      }
      newSchema.properties = properties
      if (newSchema.required) {
        newSchema.required = _.intersection(
          newSchema.required,
          Object.keys(properties)
        )
      }
    } else {
      throw new Error(
        `can not include ${JSON.stringify(
          props
        )} in a object without properties specified`
      )
    }
  } else {
    throw new Error(
      `can not include ${JSON.stringify(props)} in ${schema.type}`
    )
  }
  return newSchema
}

export interface ITransformOptions {
  include?: Props
  exclude?: Props
}

export const transformSchema = (
  schema: IJsSchema | Constructor,
  options: ITransformOptions
) => {
  if (typeof schema === 'function') {
    const clazz = schema
    schema = Reflect.getMetadata(MetadataKey.SCHEMA, schema) as IJsSchema
    if (!schema) {
      throw new Error(`${clazz.name} doesn't have schema defined on it`)
    }
  }
  if (options.include) {
    schema = includeSchemaProps(schema, normalizeProps(options.include))
  }
  return schema
}
