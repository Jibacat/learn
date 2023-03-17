function binarySearch(sortedArr, target) {

  let left = 0
  let right = sortedArr.length - 1

  while(left !== right) {
    const mid = Math.floor((right - left) / 2)
    if(target > sortedArr[mid]) {
      // 在右侧
      left = mid - 1
    } else if(target < sortedArr[mid]) {
      // 左侧
      right = mid + 1
    } else {
      return mid
    }
  }

  return -1
  
}