module.exports = function() {
  return new Promise((resolve, reject) => {
    if (Math.random() > 0.5) {
      resolve({
        msg: 'this is random module'
      })
    } else {
      reject(501)
    }
  })
}