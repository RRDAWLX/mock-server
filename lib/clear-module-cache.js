/**
 * 删除被修改文件对应的模块以及直接、间接引用该模块的模块的缓存。
 * @param {string} filename 需要被删除缓存的模块的 filenmame。
 * @param {string} prefix 直接、间接引用目标模块的模块的 filenmame 前缀为 prefix 才可被删除。
 */
module.exports = function (filename, prefix) {
  let cache = Object.values(require.cache)
    .filter(m => m.filename.startsWith(prefix))
  let modules = [require.cache[filename]]
  let m

  while (m = modules.shift()) {
    delete require.cache[m.id]

    for (let _m of cache) {
      if (_m !== m && _m.children.includes(m)) {
        modules.push(_m)
      }
    }
  }
}