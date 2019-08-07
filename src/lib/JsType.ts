import Ajv = require('ajv')
import _ from 'lodash'
import { IJsonSchema, IJsSchema } from '../types'
import DataTypes from './DataTypes'
import { copyProperties, deserialize, serialize, validate } from './utils'
import { Validator } from './Validator'

const ajv = new Ajv()

export interface IJsTypeOptions {
  include?: string[]
  exclude?: string[]
}
export interface IJsType {
  type: string
  serialize: (value: any, schema: IJsSchema, options?: IJsTypeOptions) => any
  deserialize: (value: any, schema: IJsSchema, options?: IJsTypeOptions) => any
  validate(value: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?]
  toJsonSchema(schema: IJsSchema, options?: IJsTypeOptions): IJsonSchema
}

export abstract class JsType implements IJsType {
  public abstract type: string
  public deserialize(value: any, schema: IJsSchema): any {
    const jsonSchema = this.toJsonSchema(schema)
    const valid = ajv.validate(jsonSchema, value) as boolean
    if (!valid) {
      throw new Error(ajv.errorsText())
    }
    if (value === undefined && schema) {
      return schema.default
    } else {
      return value
    }
  }
  public serialize(value: any | undefined, schema: IJsSchema): any {
    const [valid, msg] = this.validate(value, schema)
    if (!valid) {
      throw new Error(msg)
    }
    if (value === undefined && schema) {
      return schema.default
    } else {
      return value
    }
  }
  public validate(value: any, schema: IJsSchema): [boolean, string?] {
    if (value === undefined) {
      return [true]
    } else {
      const jsonSchema = this.toJsonSchema(schema)
      const valid = ajv.validate(jsonSchema, value) as boolean
      if (valid) {
        return [true]
      } else {
        return [false, ajv.errorsText()]
      }
    }
  }
  public toJsonSchema(schema: IJsSchema): IJsonSchema {
    const jsonSchema: IJsonSchema = Object.assign({}, schema)
    jsonSchema.type = this.type
    return jsonSchema
  }
}

const commonSchemaProps = ['title', 'description', 'default', 'examples', 'enum', 'const']

// tslint:disable-next-line: max-classes-per-file
export class AnyType implements IJsType {
  public type: string = 'any'
  public validate(): [boolean, string?] {
    return [true]
  }
  public serialize(val: any, schema?: IJsSchema) {
    if (val === undefined && schema) {
      return schema.default
    } else {
      return val
    }
  }
  public deserialize(val: any, schema?: IJsSchema) {
    if (val === undefined && schema) {
      return schema.default
    } else {
      return val
    }
  }
  public toJsonSchema(schema: IJsSchema): IJsonSchema {
    const jsonSchema: IJsonSchema = Object.assign({}, schema)
    Reflect.deleteProperty(jsonSchema, 'type')
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class StringType extends JsType {
  public type: string = 'string'
  public validate(value: any, schema: IJsSchema): [boolean, string?] {
    if (value === undefined) {
      return [true]
    }
    if (typeof value === 'string') {
      if (schema.format) {
        const valid = Validator.validateFormat(value, schema.format)
        if (!valid) {
          return [false, `invalid ${schema.format} format:${value}`]
        }
      }
      if (schema.pattern) {
        const valid = Validator.validatePattern(value, schema.pattern)
        if (!valid) {
          return [false, `invalid ${schema.pattern} pattern:${value}`]
        }
      }
      if (schema.minLength || schema.maxLength) {
        const valid = Validator.validateLength(value, { minLength: schema.minLength, maxLength: schema.maxLength })
        if (!valid) {
          return [false, `invalid length:${value}`]
        }
      }
      return [true]
    } else {
      return [false, `invalid string value: ${value}`]
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class BooleanType extends JsType {
  public type: string = 'boolean'
  public validate(val: any, _1: IJsSchema): [boolean, string?] {
    if (val === undefined) {
      return [true]
    }
    if (typeof val === 'boolean') {
      return [true, '']
    } else {
      return [false, `Invalid boolean: ${val}`]
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NumberType extends JsType {
  public type: string = 'number'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'number' }
    copyProperties(jsonSchema, schema, [
      ...commonSchemaProps,
      'multipleOf',
      'minimum',
      'exclusiveMinimum',
      'maximum',
      'exclusiveMaximum'
    ])
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class IntegerType extends JsType {
  public type: string = 'integer'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'integer' }
    copyProperties(jsonSchema, schema, [
      ...commonSchemaProps,
      'multipleOf',
      'minimum',
      'exclusiveMinimum',
      'maximum',
      'exclusiveMaximum'
    ])
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class DateType extends JsType {
  public type: string = 'date'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'string', format: 'date-time' }
    copyProperties(jsonSchema, schema, [...commonSchemaProps, 'format'])
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ArrayType implements IJsType {
  public type: string = 'array'
  public toJsonSchema(schema: IJsSchema, options?: IJsTypeOptions) {
    const jsonSchema: IJsonSchema = { type: 'array' }
    const items = schema.items
    let jsonItems: IJsonSchema | IJsonSchema[] | undefined
    if (items) {
      if (Array.isArray(items)) {
        jsonItems = items.map((item) => {
          const jsType = DataTypes.get(item.type)
          return jsType.toJsonSchema(item, options)
        })
      } else {
        const jsType = DataTypes.get(items.type)
        jsonItems = jsType.toJsonSchema(items, options)
      }
    }
    copyProperties(jsonSchema, schema, [...commonSchemaProps, 'minItems', 'maxItems', 'uniqueItems', 'additionalItems'])
    if (jsonItems) {
      jsonSchema.items = jsonItems
    }
    return jsonSchema
  }
  public validate(val: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] {
    if (val === undefined) {
      return [true]
    }
    if (Array.isArray(val)) {
      const itemSchema = schema.items
      if (itemSchema) {
        if (Array.isArray(itemSchema)) {
          for (let i = 0; i < val.length; i++) {
            const [valid, msg] = validate(val[i], itemSchema[i], options)
            if (!valid) {
              return [valid, `[${i}]${msg}`]
            }
          }
        } else {
          for (let i = 0; i < val.length; i++) {
            const [valid, msg] = validate(val[i], itemSchema, options)
            if (!valid) {
              return [valid, `[${i}]${msg}`]
            }
          }
        }
      }
      return [true, '']
    } else {
      return [false, `Invalid array:${val}`]
    }
  }
  public serialize(value: any, schema: IJsSchema, options?: IJsTypeOptions) {
    const [valid, msg] = this.validate(value, schema)
    if (!valid) {
      throw new Error(msg)
    }
    if (value === undefined) {
      return schema.default
    } else {
      if (Array.isArray(value)) {
        if (schema.items) {
          if (Array.isArray(schema.items)) {
            const val: any[] = []
            for (let i = 0; i < value.length; i++) {
              val.push(serialize(value[i], schema.items[i], options))
            }
            return val
          } else {
            const itemSchema = schema.items
            if (itemSchema) {
              return value.map((item) => serialize(item, itemSchema, options))
            }
          }
        } else {
          return value
        }
      } else {
        throw new Error('Data must be an array')
      }
    }
  }
  public deserialize(value: any[] | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    const jsonSchema = this.toJsonSchema(schema)
    const valid = ajv.validate(jsonSchema, value) as boolean
    if (!valid) {
      throw new Error(ajv.errorsText())
    }
    if (value === undefined) {
      return schema.default
    } else {
      if (Array.isArray(value)) {
        if (schema.items) {
          if (Array.isArray(schema.items)) {
            const val: any[] = []
            for (let i = 0; i < value.length; i++) {
              val.push(deserialize(value[i], schema.items[i], options))
            }
            return val
          } else {
            const itemSchema = schema.items
            if (itemSchema) {
              return value.map((item) => deserialize(itemSchema, item, options))
            }
          }
        } else {
          return value
        }
      } else {
        throw new Error('Data must be an array')
      }
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ObjectType implements IJsType {
  public type: string = 'object'
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'object' }
    const properties = schema.properties
    if (properties) {
      jsonSchema.properties = {}
      for (const prop of Object.getOwnPropertyNames(properties)) {
        const propSchema = properties[prop]
        const jsType = DataTypes.get(propSchema.type)
        Reflect.set(jsonSchema.properties, prop, jsType.toJsonSchema(propSchema))
      }
    }
    copyProperties(jsonSchema, schema, ['additionalProperties'])
    return jsonSchema
  }
  public validate(data: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] {
    if (data === undefined) {
      return [true]
    }
    if (typeof data !== 'object') {
      return [false, 'Invalid object']
    }
    const properties = schema.properties || {}
    const requiredProps = schema.required
    if (requiredProps) {
      for (const prop of requiredProps) {
        if (Reflect.get(data, prop) === undefined) {
          return [false, `${prop} is required`]
        }
      }
    }

    const propNames = Object.getOwnPropertyNames(properties)
    for (const prop of propNames) {
      const propSchema = properties[prop]
      const value = Reflect.get(data, prop)
      const [valid, msg] = validate(value, propSchema, options)
      if (!valid) {
        return [valid, msg]
      }
    }
    return [true]
  }
  public serialize(data: object | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (data === undefined) {
      return schema.default
    } else {
      const properties = schema.properties
      const json: any = {}
      if (properties) {
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          if (options) {
            if (options.include) {
              const inclusive = options.include.some((item) => {
                return Reflect.get(data, item)
              })
              if (!inclusive) {
                continue
              }
            }
            if (options.exclude) {
              const exclusive = options.exclude.some((item) => {
                return Reflect.get(data, item)
              })
              if (exclusive) {
                continue
              }
            }
          }
          const propSchema = properties[prop]
          let value = Reflect.get(data, prop)
          value = serialize(value, propSchema, options)
          if (value === undefined) {
            continue
          }
          Reflect.set(json, prop, value)
        }
        if (schema.additionalProperties) {
          const dataProps = Object.getOwnPropertyNames(data)
          for (const dataProp of dataProps) {
            if (!propNames.includes(dataProp)) {
              const value = Reflect.get(data, dataProp)
              if (value === undefined) {
                continue
              }
              Reflect.set(json, dataProp, value)
            }
          }
        }
      } else {
        Object.assign(json, data)
      }
      return json
    }
  }
  public deserialize(data: object | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (data === undefined) {
      return schema.default
    } else {
      const properties = schema.properties
      if (properties && !_.isEmpty(properties)) {
        const obj = schema.classConstructor ? new schema.classConstructor() : {}
        const propNames = Object.getOwnPropertyNames(properties)
        for (const prop of propNames) {
          const propSchema = properties[prop]
          if (options) {
            if (options.include) {
              const inclusive = options.include.some((item) => {
                return Reflect.get(data, item)
              })
              if (!inclusive) {
                continue
              }
            }
            if (options.exclude) {
              const exclusive = options.exclude.some((item) => {
                return Reflect.get(data, item)
              })
              if (exclusive) {
                continue
              }
            }
          }
          let value = Reflect.get(data, prop)
          value = deserialize(propSchema, value, options)
          if (value === undefined) {
            continue
          }
          Reflect.set(obj, prop, value)
        }
        if (schema.additionalProperties) {
          const dataProps = Object.getOwnPropertyNames(data)
          for (const dataProp of dataProps) {
            if (!propNames.includes(dataProp)) {
              const value = Reflect.get(data, dataProp)
              if (value === undefined) {
                continue
              }
              Reflect.set(obj, dataProp, value)
            }
          }
        }
        return obj
      } else {
        return data
      }
    }
  }
}
