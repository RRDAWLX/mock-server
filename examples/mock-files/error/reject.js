module.exports = function() {
  return new Promise((resolve, reject) => {
    // reject()
    reject(501)
    // reject({code: 502})
  })
}
