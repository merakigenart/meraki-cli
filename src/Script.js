//customized script

// center point
let centerX = 0.0,
    centerY = 0.0;

let radius = 45,
    rotAngle = -90;
let accelX = 0.0,
    accelY = 0.0;
let deltaX = 0.0,
    deltaY = 0.0;
let springing = 0.0009,
    damping = 0.98;

//corner nodes
let nodes = 5;

//zero fill arrays
let nodeStartX = [];
let nodeStartY = [];
let nodeX = [];
let nodeY = [];
let angle = [];
let frequency = [];

// soft-body dynamics
let organicConstant = 1.0;

let colors = [150, 200, 250];
let bgcolors = [10, 50, 75, 100];
let color, bgcolor;

class Script extends MerakiScript {
    execute() {
        color = Meraki.random.element(colors);
        bgcolor = Meraki.random.element(bgcolors);
        console.log(color, bgcolor);
        createCanvas(1000, Meraki.window.height);

        //center shape in window
        centerX = width / 2;
        centerY = height / 2;

        //initialize arrays to 0
        for (let i = 0; i < nodes; i++) {
            nodeStartX[i] = 0;
            nodeStartY[i] = 0;
            nodeY[i] = 0;
            nodeY[i] = 0;
            angle[i] = 0;
        }

        // iniitalize frequencies for corner nodes
        for (let i = 0; i < nodes; i++) {
            frequency[i] = Meraki.random.number(5, 12);
        }

        noStroke();
        frameRate(30);
    }

    draw() {
        //fade background
        fill(bgcolor, bgcolor);
        rect(0, 0, width, height);
        drawShape();
        moveShape();
    }

    initialize() {
        super.initialize();
        // p5 preload() code here
    }

    version() {
        return '1.0.2';
    }

    configure() {
        return {
            renderTimeMs: 150,
            library: {
                name: 'p5',
                version: '1.4.0',
            },
        };
    }

    traits() {
        return {
            primaryColor: color,
            backgroundColor: bgcolor,
        };
    }
}

function drawShape() {
    //  calculate node  starting locations
    for (let i = 0; i < nodes; i++) {
        nodeStartX[i] = centerX + cos(radians(rotAngle)) * radius;
        nodeStartY[i] = centerY + sin(radians(rotAngle)) * radius;
        rotAngle += 360.0 / nodes;
    }

    // draw polygon
    curveTightness(organicConstant);
    fill(color);
    beginShape();
    for (let i = 0; i < nodes; i++) {
        curveVertex(nodeX[i], nodeY[i]);
    }
    for (let i = 0; i < nodes - 1; i++) {
        curveVertex(nodeX[i], nodeY[i]);
    }
    endShape(CLOSE);
}

function moveShape() {
    //move center point
    deltaX = mouseX - centerX;
    deltaY = mouseY - centerY;

    // create springing effect
    deltaX *= springing;
    deltaY *= springing;
    accelX += deltaX;
    accelY += deltaY;

    // move predator's center
    centerX += accelX;
    centerY += accelY;

    // slow down springing
    accelX *= damping;
    accelY *= damping;

    // change curve tightness
    organicConstant = 1 - (abs(accelX) + abs(accelY)) * 0.1;

    //move nodes
    for (let i = 0; i < nodes; i++) {
        nodeX[i] = nodeStartX[i] + sin(radians(angle[i])) * (accelX * 2);
        nodeY[i] = nodeStartY[i] + sin(radians(angle[i])) * (accelY * 2);
        angle[i] += frequency[i];
    }
}
