let base64 = require('base-64')
const {net} = require('electron').remote
const {session} = require('electron').remote
const ses = session.fromPartition('persist:name')
// const ses = session.defaultSession
let localcookies = []
ses.cookies.get({}, function (error, cookies) {
  if (error) {
    console.log(error.stack)
  }
  localcookies = cookies
})
// const baseUrl = 'http://login.eagleeyenetworks.com'
const baseUrl = 'http://login.stage.eagleeyenetworks.com'
// const baseUrl = 'http://login.dev.eagleeyenetworks.com'
class EENApi {
  constructor () {
    var self = this
    self.authorized = false
    self.logging_in = false
    self.login_valid = false
    self._session = ses
    self._cookies = localcookies
    self._basic_auth = ''
  }

  login (user, pass) {
    var self = this
    return new Promise(function (resolve, reject) {
      const Authenticate = {
        method: 'POST',
        url: baseUrl + '/g/aaa/authenticate',
        port: 80,
        session: self._session
      }
      self._session.cookies.get({}, function (error, cookies) {
        if (error) {
          console.log(error.stack)
        }
        self._cookies = cookies
      })
      const authenticate = net.request(Authenticate)
      self._basic_auth = base64.encode(user + ':' + pass)
      authenticate.setHeader('content-type', 'application/json')
      authenticate.setHeader('Authorization', 'Basic ' + self._basic_auth)
      authenticate.on('response', (response) => {
        response.on('data', (chunk) => {
          const parsedAuthenticate = JSON.parse(chunk)
          const Authorize = {
            method: 'POST',
            url: baseUrl + '/g/aaa/authorize',
            port: 80,
            session: self._session
          }
          const authorize = net.request(Authorize)
          authorize.setHeader('content-type', 'application/json')
          authorize.setHeader('Authorization', 'Basic ' + self._basic_auth)
          authorize.on('response', (response) => {
            if (response.statusCode === 200) {
              console.log('logged in')
              self.login_valid = true
              self._session.cookies.get({}, function (error, cookies) {
                if (error) {
                  console.log(error.stack)
                }
                self._cookies = cookies
              })
              return resolve(response)
            } else {
              return reject(new Error(response))
            }
          })
          const jsondata = {'token': parsedAuthenticate.token}
          authorize.write(JSON.stringify(jsondata))
          authorize.end()
        })
        response.on('end', () => {
          console.log('done')
        })
      })
      const jsondata = {'username': user, 'password': pass}
      authenticate.write(JSON.stringify(jsondata))
      authenticate.end()
      self.logging_in = true
    })
  }

  query (method, endpoint, params, body) {
    var self = this
    console.log('Query: ' + method + ' ' + endpoint)
    return new Promise(function (resolve, reject) {
      if (params !== undefined) {
        params = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        // combine into string
        let urlAfter = params.join('&')
        endpoint = endpoint + '?' + urlAfter
      }
      const requestObj = {
        method: method,
        url: baseUrl + endpoint,
        port: 80,
        session: self._session
      }
      self._session.cookies.get({}, (error, cookies) => {
        if (error) {
          console.log(error.stack)
        }
        self._cookies = cookies
        const request = net.request(requestObj)
        // FIXME this is a hack until the session in electron net properly forwards cookies
        // https://github.com/electron/electron/issues/8891
        const cookiestring = self._cookies[0].name + '=' + self._cookies[0].value + '; ' + self._cookies[1].name + '=' + self._cookies[1].value
        request.setHeader('Cookie', cookiestring)
        request.setHeader('content-type', 'application/json')
        request.setHeader('Authorization', 'Basic ' + self._basic_auth)
        var totalChunks = ''
        request.on('response', (response) => {
          if (response.statusCode === 200) {
            console.log(response.statusCode)
          } else {
            console.log('error', response)
            return reject(new Error(response))
          }
          response.on('data', (chunk) => {
            totalChunks += chunk
            // console.log('got data', chunk.length, totalChunks.length)
            // console.log('total', totalChunks)
            if (chunk.length < 4096) {
              console.log('done query', endpoint)
              self.logging_in = true
              return resolve(JSON.parse(totalChunks))
            }
          })
          response.on('end', () => {
            console.log('done query', endpoint)
            self.logging_in = true
            return resolve(JSON.parse(totalChunks))
          })
        })

        if (body !== undefined) {
          request.write(JSON.stringify(body))
        }
        request.end()
      })
    })
  }

  statusFromDecimal (statusDecimal, type) {
    var invalid = statusDecimal >>> 16 & 1
    if (invalid === 1) {
      return 'invalid'
    }
    var registered = statusDecimal >>> 20 & 1
    var streaming = statusDecimal >>> 18 & 1
    var on = statusDecimal >>> 17 & 1
    if (type === 'bridge') {
      // Bridges
      if (registered === 1) {
        return 'online'
      } else {
        return 'offline'
      }
    } else if (type === 'multiview_camera') {
      // Multiview Cameras
      if (!registered) {
        return 'offline'
      } else if (registered && on) {
        return 'online'
      }
    } else {
      // Cameras
      if (registered && !streaming && on) {
        return 'offline'
      } else if (streaming) {
        return 'online'
      } else if (!on) {
        return 'off'
      }
    }
    return 'unknown'
  }

  deviceFromList (array) {
    var bridge = null
    var cameraState = null
    if (array[4].length > 0) {
      if (array[4][0].length > 0) {
        bridge = array[4][0][0]
        cameraState = array[4][0][1]
      }
    }
    return {
      accountId: array[0],
      esn: array[1],
      name: array[2],
      type: array[3],
      bridgeStatus: array[4],
      bridge: bridge,
      cameraState: cameraState,
      serviceStatus: array[5],
      permissions: array[6],
      tags: array[7],
      guid: array[8],
      serial: array[9],
      statusDecimal: array[10],
      status: this.statusFromDecimal(array[10], array[3]),
      timezone: array[11],
      UTCOffset: array[12],
      unsupported: array[13],
      ipAddress: array[14],
      isProxy: array[15],
      accountName: array[16],
      deprecated: array[17],
      videoInput: array[18],
      videoStatus: array[19],
      deviceLocation: array[20],
      parentCameraId: array[21],
      childCameraView: array[22],
      hidden: array[23],
      analogIgnored: array[24],
      isFirstResponder: array[25],
      searchTags: array[26],
      created: array[27]
    }
  }
}

export let eenclient = new EENApi()
