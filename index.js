/**
 *  一个函数，用于生成一个配置项
 *  data: 一个对象，包含alias,protocol,host,port四个值
 *  该函数将生成一个包含这四个值的div元素，div元素中包含一个select元素，一个alias的input框，一个host的input框，一个port的input框，两个span元素用于跳转和删除
 *  该函数将返回该div元素
 */
function generateGatewayItem(data = {}) {
  const {
    alias: aliasVal = '',
    protocol: protocolVal = 'http',
    host: hostVal = '',
    port: portVal = ''
  } = data
  // 创建一个新的div元素作为配置项的容器
  const configItem = document.createElement('div')
  configItem.classList.add('gateway-item') // 添加类名以进行样式控制

  // 创建select元素
  const select = document.createElement('select')
  select.classList.add('gateway-select', 'gateway-protocol')
  // 添加选项
  ;['http', 'https'].forEach((protocol) => {
    const option = document.createElement('option')
    option.value = protocol
    option.textContent = protocol
    select.appendChild(option)
  })
  select.value = 'http'
  select['data-type'] = 'protocol'

  const inputAlias = document.createElement('input')
  inputAlias.type = 'text'
  inputAlias.classList.add('gateway-input', 'gateway-alias')
  inputAlias.placeholder = 'alias'
  inputAlias.value = aliasVal
  inputAlias['data-type'] = 'alias'
  inputAlias.setAttribute('data-type', 'alias')

  const inputHost = document.createElement('input')
  inputHost.type = 'text'
  inputHost.classList.add('gateway-input', 'gateway-host')
  inputHost.placeholder = 'localhost'
  inputHost.value = hostVal
  inputHost.setAttribute('data-type', 'host')

  const inputPort = document.createElement('input')
  inputPort.type = 'text'
  inputPort.classList.add('gateway-input', 'gateway-port')
  inputPort.placeholder = 'port'
  inputPort.value = portVal
  inputPort.setAttribute('data-type', 'port')

  // 创建两个span元素作为按钮
  const btnJump = document.createElement('span')
  btnJump.textContent = '跳转'
  btnJump.classList.add('gateway-btn')

  const btnAdd = document.createElement('span')
  btnAdd.textContent = '删除'
  btnAdd.classList.add('gateway-btn')

  // 将所有子元素添加到configItem中
  ;[inputAlias, select, inputHost, inputPort, btnJump, btnAdd].forEach(
    (child) => {
      configItem.appendChild(child)
    }
  )

  return configItem
}

/**
 * @description
 *  一个函数，用于将data添加到gatewayWarpHistory中
 * @param {Array} data - 一个数组，包含alias,protocol,host,port四个值
 * @return {undefined}
 */
function gatewayWarpCreateItem(data = []) {
  const configItem = generateGatewayItem(data)
  gatewayWarpHistory.appendChild(configItem)
}

/**
 * @description
 *  一个函数，用于在node下面所有的configItem中，遍历出protocol,host,port的值
 *  并且如果host和port的值为空，抛出一个Error
 *  如果所有的值都存在，则将其push到result.data中
 * @param {HTMLDivElement} node - configItem的父元素
 * @return {Object} { data: string[], next: boolean }
 *  data: 一个数组，包含protocol,host,port的值
 *  next: 一个boolean值，用于表示当前configItem中所有的输入框是否都有值
 */
function checkCurrentItem(node) {
  const result = Array.from(node.children).reduce(
    (prev, cur) => {
      if (
        cur.tagName === 'SELECT' ||
        cur.classList.contains('gateway-host') ||
        cur.classList.contains('gateway-port') ||
        cur.classList.contains('gateway-alias')
      ) {
        const key = cur.getAttribute('data-type')
        if (
          cur.classList.contains('gateway-alias') ||
          cur.classList.contains('gateway-protocol')
        ) {
          if (cur.value) {
            prev.data[key] = cur.value
          }
        }
        if (
          cur.classList.contains('gateway-host') ||
          cur.classList.contains('gateway-port')
        ) {
          if (!cur.value) {
            cur.focus()
            prev.next = false
            throw new Error('value is empty')
          } else {
            prev.data[key] = cur.value
          }
        }
      }
      return prev
    },
    { data: {}, next: true }
  )
  return result
}

const gatewayWarpHistory = document.getElementById('gatewayWarpHistory')
const gatewayWarpCurrent = document.getElementById('gatewayWarpCurrent')
const gatewayRedirect = document.getElementById('gatewayRedirect')

/**
 *  chrome.storage.local.get() 的Promise封装
 *  @param {string} [key='web'] -  chrome.storage.local.get() 的key
 *  @return {Promise<Object|Error>} -  Promise的resolve是Object，reject是Error
 */
function getLocalStorage(key = 'web') {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        const d = result[key] ? JSON.parse(result[key]) : {}
        resolve(d) // 确保总是返回一个明确定义的值
      }
    })
  })
}  
window.onload = async () => {
  gatewayWarpHistory.addEventListener('click', function (event) {
    if (
      event.target &&
      event.target.textContent === '跳转' &&
      event.target.classList.contains('gateway-btn')
    ) {
      console.log('跳转按钮被点击了！')

      // 阻止事件进一步冒泡（可选，取决于你的具体需求）
      event.stopPropagation()
    }
    if (
      event.target &&
      event.target.textContent === '删除' &&
      event.target.classList.contains('gateway-btn')
    ) {
      console.log('删除按钮被点击了！')
      event.target.parentNode.remove()
    }
  })

  gatewayWarpCurrent.addEventListener('click', async function (event) {
    if (
      event.target &&
      event.target.textContent === '跳转' &&
      event.target.classList.contains('gateway-btn')
    ) {
      const parentNode = event.target.parentNode
      const itemVal = checkCurrentItem(parentNode)
      if (itemVal.next) {
        const { protocol, host, port, alias } = itemVal.data
        const { token = '', location = '' } = await getLocalStorage()
        const repToken = token.replace(/"|'/g, '')
        const baseURL = location.split('/#/')?.[1] ?? ''
        chrome.windows.create({
          url: `${protocol}://${host}:${port}/#/${baseURL}?token=${encodeURIComponent(repToken)}&a=2`,
          type: 'normal',
          focused: true
        })
      }
      event.stopPropagation()
    }
    if (
      event.target &&
      event.target.textContent === '保存' &&
      event.target.classList.contains('gateway-btn')
    ) {
      const parentNode = event.target.parentNode
      const itemVal = checkCurrentItem(parentNode)
      if (itemVal.next) {
        gatewayWarpCreateItem(itemVal.data)
      }
      event.stopPropagation()
    }
  })
}
