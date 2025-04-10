const pica = window.pica();

for(let j = 1; j < 4133; j++){
    getInputFromImage(`images/0/0 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4685; j++){
    getInputFromImage(`images/1/1 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4177; j++){
    getInputFromImage(`images/2/2 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4351; j++){
    getInputFromImage(`images/3/3 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4073; j++){
    getInputFromImage(`images/4/4 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 3796; j++){
    getInputFromImage(`images/5/5 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4138; j++){
    getInputFromImage(`images/6/6 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4402; j++){
    getInputFromImage(`images/7/7 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4064; j++){
    getInputFromImage(`images/8/8 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}
for(let j = 1; j < 4189; j++){
    getInputFromImage(`images/9/9 (${j}).jpg`, (data) => {
        pixelsArr.push(data);
    });
}


function getInputFromImage(imageUrl, callback){
    const image = new Image();

    image.onload = function(){
        const canvas = document.getElementById("drawingCanvas");

        pica.resize(image, canvas, {
            quality: 3,
            unsharpAmount: 80,
            unsharpThreshold: 2
        }).then(() => {
            const imageData = context.getImageData(0, 0, 50, 50).data;

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