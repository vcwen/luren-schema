import 'reflect-metadata'
import { Prop, Schema } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
describe('Schema', () => {
  it('should build schema with props', () => {
    @Schema()
    class Test {
      @Prop()
      public name!: string
      @Prop({ type: 'number?' })
      public age?: number
    }
    const metadata = Reflect.getMetadata(MetadataKey.SCHEMA, Test.prototype)
    expect(metadata).toEqual(
      expect.objectContaining({
        id: 'Test',
        schema: expect.objectContaining({
          type: 'object',
          classConstructor: expect.any(Function),
          properties: {
            name: expect.objectContaining({
              type: 'string'
            }),
            age: expect.objectContaining({
              type: 'number'
            })
          },
          required: ['name']
        })
      })
    )
  })
})
