
function quickSort(arr) {
  
  if(arr.length < 1) {
    return arr
  }

  const pivot = arr[0]
  const left = []
  const right = []
  
  for(let i = 1; i < arr.length; i++) {
    const item = arr[i]
    if(item <= pivot) {
      left.push(item)
    } else {
      right.push(item)
    }
  }

  return quickSort(left).concat(pivot, quickSort(right))
}