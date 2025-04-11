class neuralNetwork{
    constructor(inputSize, hiddenSize, outputSize){
        this.hiddenWeights = Array.from({length: inputSize}, () => Array(hiddenSize).fill().map(() => Math.random() - 0.5));
        this.outputWeights = Array.from({length: hiddenSize}, () => Array(outputSize).fill().map(() => Math.random() - 0.5));

        this.hiddenArray = new Array(128).fill(0);
        this.outputArray = new Array(10).fill(0);
    }
}


const net = new neuralNetwork(2500, 128, 10);

const intervals = [4132, 4684, 4176, 4350, 4072, 3795, 4137, 4401, 4063, 4188];

async function trainingTenNumbers(){
    for(let i = 0; i < 45000; i++){
        await new Promise((resolve) => {
            let targetVector = new Array(10).fill(0);
            let randomNum = Math.floor(Math.random() * 10);
            targetVector[randomNum] = 1;

            getInputFromImage(`images/${randomNum} (${Math.floor(Math.random() * intervals[randomNum])}).jpg`, (data) => {
                calculatePrediction(data, targetVector, 0);
                resolve();
            });
        });
        inputFileButton.innerHTML = i;
    }
}


function outputPrediction(arr){
    let bestPred = 0;
    for(let i = 0; i < arr.length; i++){
        if (arr[i] > arr[bestPred]) bestPred = i;
    }
    bestPred > 0.4 ? alert(`это ${bestPred}`) : alert("Не могу понять что это");
}

function calculatePrediction(input, targetVector, flag){
    if (flag == 1){
        net.hiddenArray.fill(0);
        net.outputArray.fill(0);
    }

    calculateHiddenLayer(input);
    for(let i = 0; i < 128; i++){
        for(let j = 0; j < 10; j++){
            net.outputArray[j] += net.hiddenArray[i] * net.outputWeights[i][j];
        }
    }

    net.outputArray = softmax(net.outputArray);

    for(let i = 0; i < 10; i++){
        net.outputArray[i] = parseFloat(net.outputArray[i].toFixed(2));
    }

    flag == 1 ? outputPrediction(net.outputArray) : train(input, targetVector);
}


function calculateHiddenLayer(input){
    for(let i = 0; i < 2500; i++){
        for(let j = 0; j < 128; j++){
            net.hiddenArray[j] += input[i] * net.hiddenWeights[i][j];
        }
    }

    for(let j = 0; j < 128; j++){
        net.hiddenArray[j] = Math.max(0, net.hiddenArray[j]);
    }
}


function softmax(arr){
    const expArr = arr.map(i => Math.exp(i));
    const expSum = expArr.reduce((sum, i) => sum+i, 0);

    return expArr.map(i => i/expSum);;
}


function train(input, targetVector){
    const learningRate = 0.00001;

    const outputError = net.outputArray.map((x, i) => x - targetVector[i]);

    for(let i = 0; i < 128; i++){
        for(let j = 0; j < 10; j++){
            net.outputWeights[i][j] -= outputError[j]*net.hiddenArray[i]*learningRate;
        }
    }

    const hiddenError = new Array(128).fill(0);

    for(let i = 0; i < 128; i++){
        for(let j = 0; j < 10; j++){
            hiddenError[i] += outputError[j]*net.outputWeights[i][j];
        }
        hiddenError[i]*= (net.hiddenArray[i] > 0)? 1 : 0;
    }

    for(let i = 0; i < 2500; i++){
        for(let j = 0; j < 128; j++){
            net.hiddenWeights[i][j] -= hiddenError[j]*input[i]*learningRate;
        }
    }

    net.hiddenArray.fill(0);
    net.outputArray.fill(0);
}