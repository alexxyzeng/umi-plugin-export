function throttle(fn, interval) {
  // last为上一次触发回调的时间
  let last = 0

  return function () {
    let context = this
    let args = arguments
    let now = +new Date()

    if (now - last >= interval) {
      last = now;
      fn.apply(context, args);
    }
  }
}

module.exports = {
  throttle
}
