const pica = window.pica();

let input = [];

for(let i = 1; i < 4133; i++){
    getInputFromImage(`images/${0} (${Math.floor(Math.random() * 4133)}).jpg`, (data) => {
        input = data;
    });
}

function getInputFromImage(imageUrl, callback){
    const image = new Image();
    alert(1);

    image.onload = function(){
        const targetCanvas = document.getElementById("drawingCanvas");

        pica.resize(image, targetCanvas, {
            quality: 3,
            unsharpAmount: 80,
            unsharpThreshold: 2
        }).then(() => {
            const targetContext = targetCanvas.getContext('2d');
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

    return input;
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
    promise.then(result => alert(result));
}
