export class CarveRing {

    Spread: number;
    Frequency: number;

    constructor(spread: number, freq: number){
        this.Frequency = freq;
        this.Spread = spread;
    }

    returnFrequency() : number {
        console.log(this.Frequency)
        return this.Frequency
    }

}