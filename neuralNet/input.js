const pica = window.pica();

function getInputFromImage(imageUrl, callback){
    const image = new Image();

    image.onload = function(){
        const targetCanvas = document.getElementById("drawingCanvas");

        pica.resize(image, targetCanvas, {
            quality: 3,
            unsharpAmount: 80,
            unsharpThreshold: 2
        }).then(() => {
            const targetContext = targetCanvas.getContext('2d', { willReadFrequently: true });
            const imageData = targetContext.getImageData(0, 0, 50, 50).data;

            let input = [];
            for (let i = 0; i < imageData.length; i+=4){
                input.push((((imageData[i] + imageData[i+1] + imageData[i+2])/3))/255);
            }

            callback(input);
        })
    }

    image.src = imageUrl;
}


function getInput(){
    const canvas = document.getElementById("drawingCanvas");
    const context = canvas.getContext('2d');

    const imageData = context.getImageData(0, 0, 50, 50).data;

    let input = [];
    for (let i = 0; i < imageData.length; i+=4){
        input.push((255-((imageData[i] + imageData[i+1] + imageData[i+2])/3))/255);
    }

    return centering(input, canvas, context);
}


function centering(input, canvas, context){
    let minX = 50, minY = 50, maxX = 0, maxY = 0;

    for(let i = 0; i < 50; i++){
        for(let j = 0; j < 50; j++){
            if (input[(i*50) + j] > 0.5){
                if (j < minX) minX = j;
                if (i < minY) minY = i;
                if (j > maxX) maxX = j;
                if (i > maxY) maxY = i;
            }
        }
    }

    const digitWidth = maxX - minX;
    const digitHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = 25 - centerX;
    const offsetY = 25 - centerY;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 50;
    tempCanvas.height = 50;
    const tempContext = tempCanvas.getContext("2d");

    tempContext.fillStyle = "white";
    tempContext.fillRect(0, 0, 50, 50);

    tempContext.drawImage(canvas, offsetX, offsetY);
    context.drawImage(canvas, offsetX, offsetY);

    document.getElementById('body').appendChild(tempCanvas);

    const newImageData = tempContext.getImageData(0, 0, 50, 50).data;

    let newInput = [];
    for (let i = 0; i < newImageData.length; i+=4){
        newInput.push((255-((newImageData[i] + newImageData[i+1] + newImageData[i+2])/3))/255);
    }
    
    return newInput;
}


function saveDataToJson(data, filename){
    const jsonData = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonData], {type: 'application/json'});

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


async function loadJsonFile() {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON Files',
        accept: { 'application/json': ['.json'] },
      }],
    });
    const file = await fileHandle.getFile();
    const content = await file.text();
    return JSON.parse(content);
}


function getFile(){
    const promise = loadJsonFile();
    promise.then(result => {
        net.hiddenWeights = result[0];
        net.outputWeights = result[1];
    });
}
