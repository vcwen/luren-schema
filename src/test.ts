import { List } from 'immutable'
import 'reflect-metadata'
import { defineSchema, normalizeSimpleSchema } from './lib/utils'

defineSchema(List as any, { type: 'array' }, (simpleSchema: List<any>) => {
  const content = simpleSchema.get(0)
  const [items] = normalizeSimpleSchema(content)
  return { type: 'list', items }
})
const Schema = (target: any) => {
  Reflect.defineMetadata('metadata', 'vincent', target.prototype)
}

@Schema
class Student {
  public name!: string
}

const s = new Student()

console.log(Reflect.getMetadata('metadata', Reflect.getPrototypeOf(s)))
console.log(Student.constructor.toString())
console.log(Reflect.getPrototypeOf(Student) === Student.constructor.prototype)

const [schema] = normalizeSimpleSchema(List([{ name: 'string' }]))
console.log(JSON.stringify(schema))
