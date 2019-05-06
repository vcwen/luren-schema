import 'reflect-metadata'
import { Prop, Schema } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
describe('Schema', () => {
  it('should build schema with props', () => {
    @Schema()
    class Test {
      @Prop({ required: true })
      public name!: string
      @Prop({ schema: { type: 'number' } })
      public age?: number
    }
    const metadata = Reflect.getMetadata(MetadataKey.SCHEMA, Test.prototype)
    expect(metadata).toEqual(
      expect.objectContaining({
        id: 'Test',
        schema: expect.objectContaining({
          type: 'object',
          modelConstructor: expect.any(Function),
          properties: {
            name: expect.objectContaining({
              name: 'name',
              type: 'string'
            }),
            age: expect.objectContaining({
              name: 'age',
              type: 'number'
            })
          },
          required: ['name']
        })
      })
    )
  })
})
