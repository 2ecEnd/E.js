const calcPredictionButton = document.getElementById("calcPrediction");
const trainingButton = document.getElementById("training");

calcPredictionButton.addEventListener('click', function(){
    calculatePrediction(getInput(), [0], 1);
});

trainingButton.addEventListener('click', function(){
    trainingTenNumbers();
});
