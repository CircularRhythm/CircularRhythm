export class ColorScheme {
  constructor(json) {
    function getData(keyArray, data) {
      if(!data || !data[keyArray[0]]) return null
      if(keyArray.length == 1) {
        return data[keyArray[0]]
      } else {
        return getData(keyArray.slice(1), data[keyArray[0]])
      }
    }

    function getColor(key, defaultValue) {
      const data = getData(key.split("."), json)
      return data || defaultValue
    }

    this.background = this.arrayToRGBA(getColor("background", [255, 255, 255, 1]))
    this.bar = this.arrayToRGBA(getColor("bar", [0, 0, 0, 1]))
  }

  arrayToRGBA(array) {
    if(array.length == 4) {
      return `rgba(${array[0]},${array[1]},${array[2]},${array[3]})`
    } else {
      return `rgb(${array[0]},${array[1]},${array[2]})`
    }
  }
}
