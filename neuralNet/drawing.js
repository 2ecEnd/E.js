const canvas = document.getElementById('drawingCanvas');
const clearCanvasButton = document.getElementById('clearCanvas');
const context = canvas.getContext('2d');

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

context.clearRect(0, 0, canvas.width, canvas.height);
context.fillStyle = 'white';
context.fillRect(0, 0, canvas.width, canvas.height);

clearCanvasButton.addEventListener('click', function(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
});

let isDrawing = false;
let x = 0;
let y = 0;

context.strokeStyle = '#000000';
context.lineWidth = 3;
context.lineCap = 'round';
context.lineJoin = 'round';

function startDrawing(mouseEvent){
    isDrawing = true;
    x = mouseEvent.offsetX / 14;
    y = mouseEvent.offsetY / 14;
}

function draw(mouseEvent){
    if (!isDrawing) return;

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y);
    context.stroke();

    x = mouseEvent.offsetX / 14;
    y = mouseEvent.offsetY / 14;
}

function stopDrawing() {
    isDrawing = false;
}

const sizeInputField = document.getElementById('size-input')
const sizeInputSlider = document.getElementById('size-slider')

sizeInputSlider.addEventListener("input", function() {
    context.lineWidth = this.value;
    sizeInputField.value = this.value;
});

sizeInputField.addEventListener("input", function() {
    context.lineWidth = this.value;
    sizeInputSlider.value = this.value;
});