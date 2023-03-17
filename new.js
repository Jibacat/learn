function myNew(constructor, ...args) {
  const obj = Object.create(constructor.prototype)
  const instance = constructor.apply(obj, args)
  if(typeof instance === 'object') {
    return instance
  }
  return obj
}