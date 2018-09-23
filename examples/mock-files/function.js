module.exports = function (req) {
  return {
    msg: `you request ${req.path}, this is a function module!`
  }
}