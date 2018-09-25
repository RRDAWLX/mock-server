module.exports = function(req) => {
  return {msg: `this is a restful api, param = ${req.params.param}`}
}
