export class Rank {
  static get D() { return 0 }
  static get C() { return 1 }
  static get B() { return 2 }
  static get A() { return 3 }
  static get AA() { return 4 }
  static get AAA() { return 5 }

  static fromRate(rate) {
    if(rate >= 0.95) return Rank.AAA
    if(rate >= 0.9) return Rank.AA
    if(rate >= 0.8) return Rank.A
    if(rate >= 0.65) return Rank.B
    if(rate >= 0.50) return Rank.C
    return Rank.D
  }

  static toString(rank) {
    switch(rank) {
      case Rank.AAA: return "AAA"
      case Rank.AA: return "AA"
      case Rank.A: return "A"
      case Rank.B: return "B"
      case Rank.C: return "C"
      case Rank.D: return "D"
    }
  }
}
