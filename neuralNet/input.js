function getInputFromImage(imageUrl, callback){
    const image = new Image();

    image.onload = function(){
        const canvas = document.getElementById("drawingCanvas");
        const context = canvas.getContext('2d');

        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(0, 0, 50, 50).data;

        let input = [];
        for (let i = 0; i < imageData.length; i+=4){
            input.push((255-((imageData[i] + imageData[i+1] + imageData[i+2])/3))/255);
        }

        callback(input);
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