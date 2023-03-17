
// 这里必须是函数返回Promise，不能直接创建promise对象，因为promise对象自动在1000ms之后resolve，并发限制就没意义了
const p1 = () => new Promise((r, j) => {
  setTimeout(() => {
    console.log('1')
    r()
  }, 1000);
}) 
const p2 = () =>new Promise((r, j) => {
  setTimeout(() => {
    console.log('2')
    r()
  }, 1000);
})
const p3 = () =>new Promise((r, j) => {
  setTimeout(() => {
    console.log('3')
    r()
  }, 1000);
})
const p4 = () =>new Promise((r, j) => {
  setTimeout(() => {
    console.log('4')
    r()
  }, 1000);
})
const p5 = () =>new Promise((r, j) => {
  setTimeout(() => {
    console.log('5')
    r()
  }, 1000);
})



const arr = [p1,p2,p3,p4,p5]
function limitPromise(promiseArr, limit) {
  let settledPromiseCount = 0;
  let total = promiseArr.length
  let nextIndex = limit - 1

  return new Promise((r, j) => {
    const handle = (p) => {
      if(!p) return;
      p().then(() => {
        settledPromiseCount ++
        nextIndex++
        if(settledPromiseCount === total) {
          r();
        } else {
          handle(promiseArr[nextIndex])
        }
      })
    }
    const limitArr = promiseArr.slice(0, limit)
    limitArr.forEach((p) => {
      handle(p)
    })
  })
 

}

limitPromise([p1,p2,p3,p4,p5], 2).then((res) => {
  console.log('111', res)
})
