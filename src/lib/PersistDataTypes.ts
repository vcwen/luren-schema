import _ from 'lodash'
import { IPersistSchema, IPersistTypeOptions, ITypeOptions } from '../types'
import { DataTypes } from './DataTypes'
import { getDeserialize, getSerialize, getValidate } from './utils'

export const createPersistDataTypes = () => {
  const dataTypes = new DataTypes<IPersistTypeOptions>()
  class StringPersistTypeOptions implements IPersistTypeOptions {
    public validate(_1: IPersistSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'string') {
        return [true, '']
      } else {
        return [false, `Invalid string:${val}`]
      }
    }
    public serialize(schema: IPersistSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'string' ? val : JSON.stringify(val)
      }
    }
    public deserialize(_1: IPersistSchema, val?: string) {
      return val
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class BooleanPersistTypeOptions implements ITypeOptions {
    public validate(_1: IPersistSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'boolean') {
        return [true, '']
      } else {
        return [false, `Invalid boolean: ${val}`]
      }
    }
    public serialize(schema: IPersistSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'boolean' ? val : val ? true : false
      }
    }
    public deserialize(_1: IPersistSchema, val?: boolean) {
      return val
    }
  }
  // tslint:disable-next-line: max-classes-per-file
  class NumberPersistTypeOptions implements ITypeOptions {
    public validate(_1: IPersistSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (typeof val === 'number') {
        return [true, '']
      } else {
        return [false, `invalid number: ${val}`]
      }
    }
    public deserialize(_1: IPersistSchema, val?: number) {
      return val
    }
    public serialize(schema: IPersistSchema, val?: any) {
      if (val === undefined) {
        return schema.default
      } else {
        return typeof val === 'number' ? val : Number.parseFloat(val)
      }
    }
  }
  // tslint:disable-next-line: max-classes-per-file
  class ArrayPersistTypeOptions implements ITypeOptions {
    public type: string = 'array'
    public validate(schema: IPersistSchema, val: any): [boolean, string] {
      if (val === undefined) {
        return [true, '']
      }
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const validate = getValidate(itemSchema, dataTypes)
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
    public serialize(schema: IPersistSchema, val?: any[]) {
      if (val === undefined) {
        return schema.default
      } else {
        if (Array.isArray(val)) {
          const itemSchema = schema.items
          if (itemSchema) {
            const serialize = getSerialize(itemSchema, dataTypes)
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
    public deserialize(schema: IPersistSchema, val?: any[]) {
      if (val === undefined) {
        return undefined
      }
      if (Array.isArray(val)) {
        const itemSchema = schema.items
        if (itemSchema) {
          const deserialize = getDeserialize(itemSchema, dataTypes)
          if (deserialize) {
            return val.map((item) => deserialize(itemSchema, item))
          }
        }
        return val
      } else {
        throw new Error('Data must be an array')
      }
    }
  }

  // tslint:disable-next-line: max-classes-per-file
  class ObjectPersistTypeOptions implements ITypeOptions {
    public validate(schema: IPersistSchema, data: any): [boolean, string] {
      if (data === undefined) {
        return [true, '']
      }
      if (typeof data !== 'object') {
        return [false, 'Invalid object']
      } else {
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
          const validate = getValidate(propSchema, dataTypes)
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
    }
    public serialize(schema: IPersistSchema, data?: object) {
      if (data === undefined) {
        return schema.default
      } else {
        const properties = schema.properties
        if (properties && !_.isEmpty(properties)) {
          const doc: any = {}
          const propNames = Object.getOwnPropertyNames(properties)
          for (const prop of propNames) {
            const propSchema = properties[prop]
            const serialize = getSerialize(propSchema, dataTypes)
            let value = Reflect.get(data, prop)
            if (serialize) {
              value = serialize(propSchema, value)
            }
            if (value !== undefined) {
              Reflect.set(doc, prop, value)
            }
          }
          if (schema.additionalProperties) {
            const dataProps = Object.getOwnPropertyNames(doc)
            for (const dataProp of dataProps) {
              if (!propNames.includes(dataProp)) {
                const value = Reflect.get(doc, dataProp)
                if (value === undefined) {
                  continue
                }
                Reflect.set(doc, dataProp, value)
              }
            }
          }
          return doc
        } else {
          return data
        }
      }
    }
    public deserialize(schema: IPersistSchema, doc?: object) {
      if (doc === undefined) {
        return undefined
      } else {
        if (typeof doc !== 'object') {
          throw new Error('Data must be object')
        }
        const properties = schema.properties
        if (properties && !_.isEmpty(properties)) {
          const obj = schema.classConstructor ? new schema.classConstructor() : {}
          const propNames = Object.getOwnPropertyNames(properties)
          for (const prop of propNames) {
            const propSchema = properties[prop]
            const deserialize = getDeserialize(propSchema, dataTypes)
            let value = Reflect.get(doc, prop)
            if (deserialize) {
              value = deserialize(propSchema, value)
            }
            if (value !== undefined) {
              Reflect.set(obj, prop, value)
            }
          }
          if (schema.additionalProperties) {
            const dataProps = Object.getOwnPropertyNames(doc)
            for (const dataProp of dataProps) {
              if (!propNames.includes(dataProp)) {
                const value = Reflect.get(doc, dataProp)
                if (value === undefined) {
                  continue
                }
                Reflect.set(obj, dataProp, value)
              }
            }
          }
          return obj
        } else {
          return doc
        }
      }
    }
  }

  dataTypes.add('string', new StringPersistTypeOptions())
  dataTypes.add('boolean', new BooleanPersistTypeOptions())
  dataTypes.add('number', new NumberPersistTypeOptions())
  dataTypes.add('array', new ArrayPersistTypeOptions())
  dataTypes.add('object', new ObjectPersistTypeOptions())
  return dataTypes
}
