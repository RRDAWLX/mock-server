module.exports = function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        msg: 'this is a promise module'
      })
    }, 1000);
  })
}