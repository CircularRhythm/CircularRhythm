export function getTypeStyle(typeString) {
  const s = typeString.toLowerCase()
  if(s.indexOf("easy") != -1) {
    if(s.indexOf("very") != -1) return "VeryEasy"
    return "Easy"
  }
  if(s.indexOf("medium") != -1) return "Medium"
  if(s.indexOf("hard") != -1) {
    if(s.indexOf("very") != -1) return "VeryHard"
    return "Hard"
  }
  if(s.indexOf("beginner") != -1) return "VeryEasy"
  if(s.indexOf("normal") != -1) return "Easy"
  if(s.indexOf("hyper") != -1) return "Medium"
  if(s.indexOf("another") != -1) {
    if(s.indexOf("+") != -1) return "VeryHard"
    return "Hard"
  }
  if(s.indexOf("black") != -1) return "VeryHard"
  if(s.indexOf("leggendaria") != -1) return "VeryHard"
  return "Unknown"
}
