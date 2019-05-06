import IncomingFile from '../../src/lib/IncomingFile'

describe('IncomingFile', () => {
  it('should have props', () => {
    const file = new IncomingFile('file', '/path/file.png', 'image/png', 1000)
    expect(file).toEqual(
      expect.objectContaining({
        name: 'file',
        path: '/path/file.png',
        type: 'image/png',
        size: 1000
      })
    )
  })
})
