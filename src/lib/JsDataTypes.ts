import _ from 'lodash'
import { IJsSchema, ITypeOptions } from '../types'
import { DataTypes } from './DataTypes'
import { getDeserialize, getSerialize, getValidate } from './utils'

export const createJsDataTypes = () => {
  const jsDataTypes = new DataTypes()

  // tslint:disable-next-line: max-classes-per-file
  class AnyTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return {}
    }
    public validate(_1: IJsSchema): [boolean, string] {
      return [true, '']
    }
    public serialize(_1: IJsSchema, val?: string) {
      return val
    }
    public deserialize(schema: IJsSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return val
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class StringTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'string' }
    }
    public validate(_1: IJsSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'string') {
        return [true, '']
      } else {
        return [false, `Invalid string:${val}`]
      }
    }
    public serialize(_1: IJsSchema, val?: string) {
      return val
    }
    public deserialize(schema: IJsSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'string' ? val : JSON.stringify(val)
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class BooleanTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'boolean' }
    }
    public validate(_1: IJsSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'boolean') {
        return [true, '']
      } else {
        return [false, `Invalid boolean: ${val}`]
      }
    }
    public serialize(_1: IJsSchema, val?: boolean) {
      return val
    }
    public deserialize(schema: IJsSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'boolean' ? val : val ? true : false
      }
    }
  }
  // tslint:disable-next-line: max-classes-per-file
  class NumberTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'number' }
    }
    public validate(_1: IJsSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'number') {
        return [true, '']
      } else {
        return [false, `invalid number: ${val}`]
      }
    }
    public serialize(_1: IJsSchema, val?: number) {
      return val
    }
    public deserialize(schema: IJsSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'number' ? val : Number.parseFloat(val)
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class DateTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'string', format: 'date-time' }
    }
    public validate(_1: IJsSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (val instanceof Date && !Number.isNaN(val.getTime())) {
        return [true, '']
      } else {
        return [false, `invalid date value: ${val}`]
      }
    }
    public serialize(_1: IJsSchema, val?: Date) {
      return val
    }
    public deserialize(schema: IJsSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        const d = new Date(val)
        if (!Number.isNaN(d.getTime())) {
          return d
        } else {
          throw new Error(`Can not convert val:${val} to Date `)
        }
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class ArrayTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'array' }
    }
    public validate(schema: IJsSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const validate = getValidate(itemSchema, jsDataTypes)
          for (let i = 0; i < val.length; i++) {
            if (validate) {
              const [valid, msg] = validate(itemSchema, val[i])
              if (!valid) {
                return [valid, `[${i}]${msg}`]
              }
            }
          }
        }
        return [true, '']
      } else {
        return [false, 'Invalid array']
      }
    }
    public serialize(schema: IJsSchema, val: any) {
      if (val === undefined) {
        return undefined
      } else {
        if (Array.isArray(val)) {
          const itemSchema = schema.items
          if (itemSchema) {
            const serialize = getSerialize(itemSchema, jsDataTypes)
            if (serialize) {
              return val.map((item) => serialize(itemSchema, item))
            }
          }
          return val
        } else {
          throw new Error('Data must be an array')
        }
      }
    }
    public deserialize(schema: IJsSchema, val?: any[]) {
      if (val === undefined) {
        return schema.default
      } else {
        if (Array.isArray(val)) {
          const itemSchema = schema.items
          if (itemSchema) {
            const deserialize = getDeserialize(itemSchema, jsDataTypes)
            if (deserialize) {
              return val.map((item) => deserialize(itemSchema, item))
            }
          }
          return val
        }
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class ObjectTypeOptions implements ITypeOptions {
    public toJsonSchema() {
      return { type: 'object' }
    }
    public validate(schema: IJsSchema, data: any): [boolean, string] {
      if (data === undefined) {
        return [true, '']
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
        const validate = getValidate(propSchema, jsDataTypes)
        const value = Reflect.get(data, prop)
        if (validate) {
          const [valid, msg] = validate(propSchema, value)
          if (!valid) {
            return [valid, msg]
          }
        }
      }
      return [true, '']
    }
    public serialize(schema: IJsSchema, data?: object) {
      if (data === undefined) {
        return undefined
      } else {
        const properties = schema.properties
        const json: any = {}
        if (properties) {
          const propNames = Object.getOwnPropertyNames(properties)
          for (const prop of propNames) {
            const propSchema = properties[prop]
            if (propSchema.private) {
              continue
            }
            const serialize = getSerialize(propSchema, jsDataTypes)
            let value = Reflect.get(data, prop)
            if (serialize) {
              value = serialize(propSchema, value)
            }
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
    public deserialize(schema: IJsSchema, data?: object) {
      if (data === undefined) {
        return schema.default
      } else {
        const properties = schema.properties
        if (properties && !_.isEmpty(properties)) {
          const obj = schema.classConstructor ? new schema.classConstructor() : {}
          const propNames = Object.getOwnPropertyNames(properties)
          for (const prop of propNames) {
            const propSchema = properties[prop]
            if (propSchema.private) {
              continue
            }
            const deserialize = getDeserialize(propSchema, jsDataTypes)
            let value = Reflect.get(data, prop)
            if (deserialize) {
              value = deserialize(propSchema, value)
            }
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

  jsDataTypes.add('any', new AnyTypeOptions())
  jsDataTypes.add('string', new StringTypeOptions())
  jsDataTypes.add('boolean', new BooleanTypeOptions())
  jsDataTypes.add('number', new NumberTypeOptions())
  jsDataTypes.add('date', new DateTypeOptions())
  jsDataTypes.add('array', new ArrayTypeOptions())
  jsDataTypes.add('object', new ObjectTypeOptions())
  return jsDataTypes
}
