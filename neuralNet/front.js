const calcPredictionButton = document.getElementById("calcPrediction");
const trainingButton = document.getElementById("training");
const inputFileButton = document.getElementById("inputFile");
const saveDataButton = document.getElementById("saveData");

calcPredictionButton.addEventListener('click', function(){
    calculatePrediction(getInput(), [0], 1);
});

trainingButton.addEventListener('click', function(){
    trainingTenNumbers();
});

inputFileButton.addEventListener('click', function(){
    getFile();
});

saveDataButton.addEventListener('click', function(){
    saveDataToJson(pixelsArr, 'pixelsArr.json');
});