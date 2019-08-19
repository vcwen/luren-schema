import Ajv = require('ajv')
import _ from 'lodash'
import { DateTime } from 'luxon'
import { ALL_COMMON_SCHEMA_PROPS } from '../constants'
import { IJsonSchema, IJsSchema } from '../types'
import DataTypes from './DataTypes'
import { copyProperties, deserialize, getInclusiveProps, serialize, validate } from './utils'

const ajv = new Ajv()

export interface IJsTypeOptions {
  include?: string[]
  exclude?: string[]
  includeProps?: string[]
  excludeProps?: string[]
  onlyProps?: string[]
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
  public validate(value: any, schema: IJsSchema): [boolean, string?] {
    if (_.isNil(value)) {
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
  public serialize(value: any | undefined, schema: IJsSchema): any {
    const [valid, msg] = this.validate(value, schema)
    if (!valid) {
      throw new Error(msg)
    }
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    } else {
      return value
    }
  }
  public deserialize(value: any, schema: IJsSchema): any {
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    } else {
      const jsonSchema = this.toJsonSchema(schema)
      const valid = ajv.validate(jsonSchema, value) as boolean
      if (!valid) {
        throw new Error(ajv.errorsText())
      }
      return value
    }
  }

  public toJsonSchema(schema: IJsSchema): IJsonSchema {
    const jsonSchema: IJsonSchema = { type: schema.type }
    copyProperties(jsonSchema, schema, allJsonSchemaProps)
    return jsonSchema
  }
  protected getDefaultValue(schema: IJsSchema) {
    if (!_.isNil(schema.default)) {
      const value = schema.default
      const [valid, msg] = this.validate(value, schema)
      if (valid) {
        return value
      } else {
        throw new Error(msg)
      }
    }
  }
}

const allJsonSchemaProps = [
  'title',
  'description',
  'default',
  'examples',
  'enum',
  'const',
  'format',
  'pattern',
  'multipleOf',
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'items',
  'minItems',
  'maxItems',
  'uniqueItems',
  'additionalItems',
  'properties',
  'required',
  'additionalProperties'
]
// const commonSchemaProps = ['title', 'description', 'default', 'examples', 'enum', 'const']

// tslint:disable-next-line: max-classes-per-file
export class AnyType extends JsType {
  public type: string = 'any'
  public validate(_1: any): [boolean, string?] {
    return [true]
  }
  public serialize(val: any, schema: IJsSchema) {
    if (_.isNil(val)) {
      return schema.default
    } else {
      return val
    }
  }
  public deserialize(val: any, schema: IJsSchema) {
    if (_.isNil(val)) {
      return schema.default
    } else {
      return val
    }
  }
  public toJsonSchema(schema: IJsSchema): IJsonSchema {
    const jsonSchema: IJsonSchema = {}
    copyProperties(jsonSchema, schema, allJsonSchemaProps)
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class StringType extends JsType {
  public type: string = 'string'
}

// tslint:disable-next-line: max-classes-per-file
export class BooleanType extends JsType {
  public type: string = 'boolean'
}

// tslint:disable-next-line: max-classes-per-file
export class NumberType extends JsType {
  public type: string = 'number'
}

// tslint:disable-next-line: max-classes-per-file
export class IntegerType extends JsType {
  public type: string = 'integer'
}

// tslint:disable-next-line: max-classes-per-file
export class DateType extends JsType {
  public type: string = 'date'
  public validate(value: any): [boolean, string?] {
    if (_.isNil(value)) {
      return [true]
    }
    if (value instanceof Date) {
      return [true]
    } else {
      return [false, `Invalid date value: ${value}`]
    }
  }
  public serialize(value: any | undefined, schema: IJsSchema) {
    const [valid, msg] = this.validate(value)
    if (!valid) {
      throw new Error(msg)
    }
    if (_.isNil(value)) {
      value = this.getDefaultValue(schema)
      if (_.isNil(value)) {
        return undefined
      }
    }
    const date = value as Date
    const format = schema.format
    if (format) {
      const timezone = schema.timezone || 'utc'
      const val = DateTime.fromJSDate(date).setZone(timezone)
      switch (format) {
        case 'time': {
          return val.toFormat('HH:mm:ssZZ')
        }
        case 'date': {
          return val.toISODate()
        }
        default:
          return date.toISOString()
      }
    } else {
      return value.toISOString()
    }
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    } else {
      const jsonSchema = this.toJsonSchema(schema)
      const valid = ajv.validate(jsonSchema, value) as boolean
      if (!valid) {
        throw new Error(ajv.errorsText())
      }
      const dateString = value as string
      const format = schema.format
      if (format) {
        const timezone = schema.timezone || 'utc'
        switch (format) {
          case 'time': {
            const val = DateTime.fromFormat(dateString, 'HH:mm:ssZZ')
            return val.toJSDate()
          }
          case 'date': {
            const val = DateTime.fromISO(dateString, { zone: timezone })
            return val.toJSDate()
          }
          default:
            return new Date(dateString)
        }
      } else {
        return new Date(dateString)
      }
    }
  }
  public toJsonSchema(schema: IJsSchema) {
    const jsonSchema: IJsonSchema = { type: 'string', format: 'date-time' }
    copyProperties(jsonSchema, schema, allJsonSchemaProps)
    return jsonSchema
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ArrayType extends JsType {
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
    copyProperties(jsonSchema, schema, allJsonSchemaProps)
    if (jsonItems) {
      jsonSchema.items = jsonItems
    }
    return jsonSchema
  }
  public validate(val: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] {
    if (_.isNil(val)) {
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
              return [valid, `[${i}]:${msg}`]
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
    const [valid, msg] = this.validate(value, schema, options)
    if (!valid) {
      throw new Error(msg)
    }
    if (_.isNil(value)) {
      value = this.getDefaultValue(schema)
    }
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
    }
  }
  public deserialize(value: any | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (_.isNil(value)) {
      value = this.getDefaultValue(schema)
      if (_.isNil(value)) {
        return
      }
    }
    const jsonSchema = this.toJsonSchema(schema)
    const valid = ajv.validate(jsonSchema, value) as boolean
    if (!valid) {
      throw new Error(ajv.errorsText())
    }
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
            return value.map((item) => deserialize(item, itemSchema, options))
          }
        }
      } else {
        return value
      }
    }
  }
}
// tslint:disable-next-line: max-classes-per-file
export class ObjectType extends JsType {
  public type: string = 'object'
  public toJsonSchema(schema: IJsSchema, options?: IJsTypeOptions) {
    const jsonSchema: IJsonSchema = { type: 'object' }
    options = options || {}
    const properties = schema.properties
    const props = getInclusiveProps(schema, options)
    if (properties && !_.isEmpty(properties)) {
      jsonSchema.properties = {}
      for (const prop of props) {
        const propSchema = properties[prop]
        const jsType = DataTypes.get(propSchema.type)
        Reflect.set(jsonSchema.properties, prop, jsType.toJsonSchema(propSchema))
      }
    }
    if (schema.required && !_.isEmpty(schema.required)) {
      const required = _.intersection(schema.required, props)
      jsonSchema.required = required
    }
    copyProperties(jsonSchema, schema, ALL_COMMON_SCHEMA_PROPS)
    return jsonSchema
  }
  public validate(data: any, schema: IJsSchema, options?: IJsTypeOptions): [boolean, string?] {
    if (_.isNil(data)) {
      return [true]
    }
    if (typeof data !== 'object') {
      return [false, `Invalid object value: ${data}`]
    }
    const properties = schema.properties || {}
    const requiredProps = schema.required || []

    const propNames = Object.getOwnPropertyNames(properties)
    for (const prop of propNames) {
      const propSchema = properties[prop]
      const value = Reflect.get(data, prop)
      if (requiredProps.includes(prop) && _.isNil(value)) {
        return [false, `${prop} is required`]
      }
      const [valid, msg] = validate(value, propSchema, options)
      if (!valid) {
        return [valid, `${prop}:${msg}`]
      }
    }
    return [true]
  }
  public serialize(data: any | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (_.isNil(data)) {
      data = this.getDefaultValue(schema)
      if (_.isNil(data)) {
        return
      }
    }
    const [valid, msg] = this.validate(data, schema, options)
    if (!valid) {
      throw new Error(msg)
    }

    const properties = schema.properties
    const json: any = {}
    options = options || {}
    if (properties) {
      const props = getInclusiveProps(schema, options)
      for (const prop of props) {
        const propSchema = properties[prop]
        let value = Reflect.get(data, prop)
        value = serialize(value, propSchema, options)
        if (_.isNil(value)) {
          continue
        }
        Reflect.set(json, prop, value)
      }
      if (schema.additionalProperties) {
        const dataProps = Object.getOwnPropertyNames(data)
        for (const dataProp of dataProps) {
          if (!props.includes(dataProp)) {
            const value = Reflect.get(data, dataProp)
            if (_.isNil(value)) {
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
  public deserialize(data: any | undefined, schema: IJsSchema, options?: IJsTypeOptions) {
    if (_.isNil(data)) {
      data = this.getDefaultValue(schema)
      if (_.isNil(data)) {
        return
      }
    }
    const jsonSchema = this.toJsonSchema(schema, options)
    const valid = ajv.validate(jsonSchema, data) as boolean
    if (!valid) {
      throw new Error(ajv.errorsText())
    }
    const properties = schema.properties
    if (properties && !_.isEmpty(properties)) {
      const obj = schema.classConstructor ? new schema.classConstructor() : {}
      const propNames = Object.getOwnPropertyNames(properties)
      for (const prop of propNames) {
        const propSchema = properties[prop]
        if (propSchema.virtual) {
          // ignore virtual props when deserialize
          continue
        }
        let value = Reflect.get(data, prop)
        value = deserialize(value, propSchema, options)
        if (_.isNil(value)) {
          continue
        }
        Reflect.set(obj, prop, value)
      }
      if (schema.additionalProperties) {
        const dataProps = Object.getOwnPropertyNames(data)
        for (const dataProp of dataProps) {
          if (!propNames.includes(dataProp)) {
            const value = Reflect.get(data, dataProp)
            if (_.isNil(value)) {
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
