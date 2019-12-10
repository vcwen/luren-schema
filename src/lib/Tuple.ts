export class Tuple {
  public items: any[]
  constructor(items: any[]) {
    if (items.length === 0) {
      throw new TypeError('tuple required at least one element.')
    }
    this.items = items
  }
}

export const tuple = (items: any[]) => {
  return new Tuple(items)
}

export default Tuple
