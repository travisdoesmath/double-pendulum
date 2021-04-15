import { Pendula } from "wasm-pendulum";
import { memory } from "wasm-pendulum/double_pendulum_bg";
import { scaleLinear, scaleSequential } from "d3-scale";
import { interpolateRainbow } from "d3-scale-chromatic";

let n = 250;

let ns = [...Array(n).keys()].map(x => 2);
let thetas = [...Array(n).keys()].map(x => Math.PI + 0.1 + x*10**(-10))
console.log(thetas)
let nPendulums = ns.length;

const pendula = new Pendula(ns, thetas);

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

var scale = scaleLinear().domain([0,1]).range([0,200])
var color = scaleSequential(interpolateRainbow).domain([0, nPendulums]);

const partialSums = arr => {
    let s = 0;
    return arr.map(x => s += x);
}
let nSums = partialSums(ns)
let nSum = nSums[nSums.length - 1];

const fps = new class {
    constructor() {
        this.fps = document.getElementById('fps');
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }
        let mean = sum / this.frames.length;

        this.fps.textContent = `fps: ${Math.round(min)}`;
    }
};


function draw() {
    fps.render();

    let coordsPtr = pendula.time_step(1/60);
    let coordsArray = new Float64Array(memory.buffer, coordsPtr, 2 * nSum);
    let pendulumIndex = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < nSum; i++) {
        let x1 = 0.5*canvas.width;
        let y1 = 0.5*canvas.height;
        if (i === 0 || nSums.includes(i)) {
            if (i !== 0) pendulumIndex++;
            x1 = 0.5*canvas.width;
            y1 = 0.5*canvas.height;            
        } else {
            x1 = 0.5*canvas.width + scale(coordsArray[2*i - 2]);
            y1 = 0.5*canvas.height + scale(coordsArray[2*i - 1]);
        }
        let x2 = 0.5*canvas.width + scale(coordsArray[2*i]);
        let y2 = 0.5*canvas.height + scale(coordsArray[2*i + 1]);
        // ctx.fillStyle = color(pendulumIndex);
        ctx.strokeStyle = color(pendulumIndex);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // ctx.beginPath();
        // ctx.arc(x2, y2, 3, 0, Math.PI * 2, true);
        // ctx.fill();
    }

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);