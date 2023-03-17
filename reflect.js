let miaoMiao = {
  _name: '疫苗',
  get name () {
    return this._name;
  }
}
let miaoXy = new Proxy(miaoMiao, {
  get (target, prop, receiver) { // receiver指向kexingMiao
    console.log({ target, receiver})
  }
});

let kexingMiao = {
  __proto__: miaoXy,
  _name: '科兴疫苗'
};
console.log(kexingMiao.name)

// target指向miaoMiao，


const person = {
  name: 'Alice',
  get greeting() {
    return `Hello, my name is ${this.name}`;
  }
};

const anotherPerson = {
  name: 'Bob'
};

const greeting = Reflect.get(person, 'greeting', anotherPerson); // receiver：调用访问器属性时要用作 this 值的对象，不传则是是target
console.log(greeting); // output: "Hello, my name is Bob"
