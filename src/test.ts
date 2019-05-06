import { Schema } from './decorators/schema'
import { Prop } from './decorators/Prop'
import { dataToJson, jsonToData, defineSchema } from './lib/utils'
import { MetadataKey } from './constants/MetadataKey'
import { ObjectId } from 'mongodb'

defineSchema(ObjectId, {
  type: 'object',
  modelConstructor: ObjectId,
  json: {
    type: 'string',
    validate: (_1: any, val: any) => {
      const valid = ObjectId.isValid(val)
      if (valid) {
        return [valid, '']
      } else {
        return [valid, 'Invalid ObjectId']
      }
    },
    serialize: (_1: any, data: ObjectId) => {
      return data.toHexString()
    },
    deserialize: (_1: any, data: any) => {
      return new ObjectId(data)
    }
  }
})

@Schema({ id: 'person' })
class Person {
  @Prop({ type: ObjectId, required: true, jsonName: 'id', jsonType: 'string' })
  _id!: ObjectId
  @Prop({ type: 'string' })
  name!: string
  @Prop({ type: 'number' })
  seq!: number
  @Prop({ type: 'boolean' })
  isValid!: boolean
}

const p = new Person()
p._id = new ObjectId()
p.name = 'vincent'
p.seq = 1
p.isValid = true

const metadata = Reflect.getMetadata(MetadataKey.SCHEMA, p)
console.log(dataToJson(p, metadata.schema))

const json = { id: '5cc65d715e6c0c704af5c019', name: 'vincent', seq: 1, isValid: true }
console.log(jsonToData(json, metadata.schema))
