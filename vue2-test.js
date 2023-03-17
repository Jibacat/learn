
// 取data中的value，当传入的expr是"a.b.c"，获取data.a.b.c
function getVal(vm,expr) {
  expr = expr.split('.');
  return expr.reduce((pre,next)=>{
      return pre[next];
  },vm.$data);
}


// 提供编译过程用到的工具方法
const CompileUtil = {
  updater: {
    textUpdater(node,value){
      node.textContent = value;
    },
    modelUpdater(node,value){
      node.value = value;
    }
  },
  // v-model 指令
  model(node, vm, expr){
    let updateFn = this.updater['modelUpdater']; // 获取v-model指令的更新函数

    //编译传入的新值，不会主动编译，直到调用Watcher.update()，才会调用cb()
    new Watcher(vm, expr, (newValue)=>{
        updateFn && updateFn(node, getVal(vm,expr));
    });

    updateFn && updateFn(node, getVal(vm,expr));  // 将v-model="message"中的message从data中获取value，然后将其赋值给node的value
  },
  // {{}} 节点
  text(node, vm, text){
    let updateFn = this.updater['textUpdater']; // 获取文本节点{{ }}的更新函数
    //  取出{{}}中的key，并获取data中对应的value
    let value = this.getTextVal(vm,text);

    text.replace(/\{\{([^}]+)\}\}/g, (...arguments)=> {
      const expr = arguments[1].trim(); // {{}} 中包裹的内容
      new Watcher(vm, expr, (newValue) => {
          updateFn && updateFn(node, this.getTextVal(vm,newValue));
      });
    });
    
    updateFn && updateFn(node,value); // 立即更新一次
  },
}


// 编译dom元素
// 编译的目的是为了将 v-指令 和 {{}}模板语法赋值
class Compile {
  // 不直接编译真实dom，而是先将真实dom转换成fragment，然后再编译
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el); // 如果已经是$el是dom元素，就直接使用，否则是一段字符串，把字符串当成css选择器，获取dom元素
    this.vm = vm
    if(this.el) {
      let fragment = this.nodeToFragment(this.el) 
      this.compile(fragment);
      this.el.appendChild(fragment)
    }
  }

  // 判断是元素节点还是文本节点
  isElementNode(node){
    return node.nodeType === 1;
  }

  // 判断是否是vue的指令
  isDirective(name){
    return name.include('v-');
  }

  // 将dom node转换成fragment，el的内容会被移除
  nodeToFragment(el) {
    let fragment = document.createDocumentFragment();
    let firstChild;
    // 将el的所有节点移动到fragment
    while (firstChild = el.firstChild){
        fragment.appendChild(firstChild);
    }
    return fragment;
  }
  
  compile(fragment){
    let childNodes = fragment.childNodes;
    Array.from(childNodes).forEach(node => {
        if(this.isElementNode(node)){
          this.compileElement(node);
          this.compile(node); // 元素节点，需要递归compile children
        } else {
          // 这里需要编译文本节点
          this.compileText(node);
        }
    });
  }


  // 编译元素节点
  compileElement(node){
    let attrs = node.attributes; // 获取所有attrs
    Array.from(attrs).forEach(attr => {
        let attrName = attr.name;
        if (this.isDirective(attrName)) { // 如果当前的attr是指令
            let expr = attr.value;  // 例如v-if="isShow"，获取指令的值isShow
            let type = attrName.slice(2); // 取「v-」后面的部分
            CompileUtil[type](node, this.vm, expr); // 调用工具类里的方法，compile这个指令
        }
    });
  }

  // 编译文本节点
  compileText(node){
    let text = node.textContent;
    let reg = /\{\{([^}]+)\}\}/g; 
    if (reg.test(text)){  // 文本节点是{{ }}的格式
        CompileUtil['text'](node, this.vm, text); // 将这个节点compile
    }
  }
}

class MVVM {
  constructor(options) {
    this.$el = options.el // dom元素
    this.$data = options.data; // 数据

    if(this.$el) {
      new Observer(this.$data)
      new Compile(this.$el, this)
    }
  }
}

// 观察data
class Observer {
  constructor(data) {
    this.observe(data)
  }

  observe(data) {
    // 数据不存在或者数据不是对象
    if (!data || typeof data !== 'object'){
      return;
    }
    // 将数据一一劫持 先获取到data的key和value
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key]); // 给key添加响应性
      this.observe(data[key]); // 继续observe value，深度观察
    });
  }

  // 为key添加响应性
  defineReactive(obj, key, value){
    let that = this;
    let dep = new Dep(); // 每个响应性key都会对应一个dep，dep中有一个存watcher的subs数组
    Object.defineProperty(obj, key, {
        enumerable:true,
        configurable:true,
        get() {
          Dep.target && dep.addSub(Dep.target); // 调用get方法，通过watcher中get获取data的key时，才会addSub，Dep.target指向这个watcher，将其添加至dep的subs
          return value;
        },
        set(newValue){
          if(newValue !== value){
            // 如果给key一个新值是对象，observe这个对象
            that.observe(newValue);
            value = newValue;
            // 重点：我们希望的是，数据变了，会让模板重新编译，所以我们这里需要一个观察者Watcher，使得数据和模板之间有关联
            dep.notify(); //通知全体，数据更新了
          }
        }
    });
  }
}

class Watcher {
  constructor(vm, expr, cb){
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    //先获取老的值
    this.value = this.get();
  }

  // 获取旧值
  get(){
    Dep.target = this; // 只要一创建Watcher实例, 就把实例赋给Dep.target
    let value = getVal(this.vm, this.expr);// 赋给Dep.target后，立马取属性触发expr的[get]方法，
    Dep.target = null; // 在[get]方法中，已经将watcher添加进了subs，Dep.target置为null，防止同一个watcher被重复添加进subs
    return value;
  }

  // 调用update时，获取最新的值，与旧值进行对比，值发横变化了，就调用cb
  update(){
    let newValue = getVal(this.vm, this.expr); // 更新的时候取值，虽然也触发了[get]，但不会将watcher添加到subs了，因为Dep.target = null
    let oldValue = this.value;
    if (newValue !== oldValue) {  // 每次更新判断新旧值是否变化
        this.cb(newValue); //就调用cb
        this.value = newValue
    }
  }

}

// 每个expr都有一个dep实例，subs记录着这个expr的watcher
class Dep {
  static target
  constructor(){
    this.subs = [];
  }
  addSub(watcher){
    this.subs.push(watcher);
  }
  // 通知全体完成添加订阅，循环每一个watcher，调用watcher的update(),文本节点和表单全部重新赋值
  notify(){
    this.subs.forEach(watcher => watcher.update());
  }
}