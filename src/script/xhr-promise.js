export default class XHRPromise {
  static send(config) {
    const method = config.method || "GET"
    const url = config.url
    const responseType = config.responseType || ""
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open(method, url)
      request.responseType = responseType
      request.onload = () => {
        if(request.status == 200) {
          resolve(request.response)
        } else if(request.status){
          reject({status: request.status, statusText: request.statusText})
        }
      }
      //request.onerror = () => reject({status: -1, statusText: "Network Error"})
      request.onerror = () => reject({status: 404, statusText: "Network Error"})
      request.send()
    })
  }
}
