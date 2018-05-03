/* created at 2018-5-3 */

// 先来一个构造函数G，并对它初始化
function G (options) {
	this._init(options)
}

// 用来存储所有的Watcher，在data改变时遍历Watcher并更新
G.prototype._binding = {}

// 初始化
G.prototype._init = function (options) {
	this.$options = options
	this.$el = document.querySelector(options.el)
	this.$data = options.data()
	this.$methods = options.methods

	this._observe(this.$data)
	this._compile(this.$el)
}

// 绑定value和this.$data
G.prototype._observe = function (data) {
	let value
	let _this = this

	for (let key in data) {
		value = data[key]
		this._binding[key] = []

		// 键值如果还是object继续遍历
		if (typeof value === 'object') {
			this._observe(value)
		}

		// 这次的重点部分，通过defineProperty方法绑定value和this.$data
		Object.defineProperty(this.$data, key, {
			enumberable: true,
			configurable: true,
			get () {
				return value
			},
			set (newVal) {
				if (value !== newVal) {
					value = newVal

					// 这里是在数据有改动时，遍历所有的Watcher，并通过_update方法绑定更新dom内的表现
					_this._binding[key].forEach(function (item) {
						item._update()
					})
				}
			}
		})
	}
}

// 编译dom结构上的g-x属性
G.prototype._compile = function (el) {
	let nodes = el.children

	for (let i = 0; i < nodes.length; i++) {
		let node = nodes[i]

		if (node.hasAttribute('g-model') && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
			// 把g-model的node实例化为GWatcher并存入this._binding
			node.addEventListener('input', (() => {
				let attr = node.getAttribute('g-model')

				this._binding[attr].push(new GWatcher(
					node,
					'value',
					this.$data,
					attr
				))

				// 立即执行的匿名函数返回如下的方法（关联g-modele，更新this.$data）
				return () => {
					this.$data[attr] = node.value
				}
			})(), false)
		}

		// 把g-bind的node实例化为GWatcher并存入this._binding
		if (node.hasAttribute('g-bind')) {
			let attr = node.getAttribute('g-bind')

			this._binding[attr].push(new GWatcher(
				node,
				'innerHTML',
				this.$data,
				attr
			))
		}

		if (node.hasAttribute('g-click')) {
			let fn = node.getAttribute('g-click')

			node.addEventListener('click', () => {
				// 注册点击事件，执行g-click的方法，并把作用于绑定到this.$data
				this.$methods[fn].bind(this.$data)()
			}, false)
		}
	}
}

/**
 * 构造函数
 * @param {object} el   需要操作的node节点
 * @param {string} attr 改变页面表现的属性
 * @param {object} vm   绑定的数据对象
 * @param {string} key  需要操作的this.$data内的键名
 */
function GWatcher (el, attr, vm, key) {
	this.$el = el
	this.$attr = attr
	this.$vm = vm
	this.$key = key

	this._update()
}

// 关联g-bind的node节点和this.$data
GWatcher.prototype._update = function () {
	this.$el[this.$attr] = this.$vm[this.$key]
}