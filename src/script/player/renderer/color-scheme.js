// TODO: stub
export class ColorScheme {
  constructor(json, default) {
    this.colors = [
      "background"
    ]
    function getData(data, levels, numLevel, fn) {
      return 0

    }
    //this.background = arrayToRGBA(json.background)
    this.colors.forEach((name) => {
      levels = name.split(".")
      return getData(json, levels, 0, this.arrayToRGBA)
    })

  }

  arrayToRGBA(array) {
    if(array.length == 4) {
      return `rgba(${array[0]},${array[1],${array[2]},${array[3]})`
    } else {
      return `rgb(${array[0]},${array[1],${array[2]})`
    }
  }
}
