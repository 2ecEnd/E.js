class neuralNetwork{ 
    constructor(inputSize, hiddenSize, outputSize){ // Инициализация нейронки случайными весами
        this.hiddenWeights = Array.from({length: inputSize}, () => Array(hiddenSize).fill().map(() => Math.random() - 0.5));
        this.outputWeights = Array.from({length: hiddenSize}, () => Array(outputSize).fill().map(() => Math.random() - 0.5));

        this.hiddenArray = new Array(128).fill(0); // размер скрытого слоя 128
        this.outputArray = new Array(10).fill(0); // размер выходного слоя 10
    }
}


const net = new neuralNetwork(2500, 128, 10);

getWeights(); // загружаю тренированные веса в нейронку

const intervals = [1033, 1171, 1044, 1087, 1018, 948, 1034, 1100, 1015, 1047];

const answerText = document.getElementById("neural-answer");

const phrases = ["Это ", "Выглядит как ", "Это похоже на ", "Скорее всего, это ", "Я склоняюсь к ", "Бьюсь об заклад, это ", "Мне кажется, это "];
const sign = ["!", ""];

let averageLoss;

async function trainingTenNumbers(){ // Функция для обучения нейронки
    let losses = [];

    for(let t = 0; t < 10; t++){
        averageLoss = 0;

        const totalIterations = 42000;
        const batchSize = 100;

        for (let j = 0; j < totalIterations; j+= batchSize){
            const promises = [];

            for(let i = j; i < j+batchSize; i++){
                const promise = new Promise((resolve) => {
                    let targetVector = new Array(10).fill(0);
                    let randomNum = Math.floor(Math.random() * 10);
                    let randomFolder = Math.floor(Math.random() * 4 + 1);
                    targetVector[randomNum] = 1;
        
                    getInputFromImage(`images/${randomNum}/${randomFolder}/${randomNum} (${Math.floor(Math.random() * intervals[randomNum]) + 1}).jpg`, (data) => {
                        calculatePrediction(data, targetVector, 0);
                        resolve();
                    });
                });
                promises.push(promise);
            }

            await Promise.all(promises);

            document.getElementById("inputFile").innerHTML = `${j}, ${t}`;
        }

        losses.push((averageLoss/42000).toFixed(2));
        //alert(`Средний Loss за эпоху составил: ${(averageLoss/42000).toFixed(2)}`);
    }

    for(let i = 0; i < 10; i++){
        alert(`Средний Loss за эпоху составил: ${losses[i]}`);
    }
}

let opacityTimer = setTimeout(() => {
    answerText.classList.remove("active");
}, 10);

function outputPrediction(arr){ // Вывод ответа
    let bestPred = 0;
    for(let i = 0; i < arr.length; i++){
        if (arr[i] > arr[bestPred]) bestPred = i;
    }

    clearTimeout(opacityTimer)

    answerText.classList.add("active");

    arr[bestPred] > 0.3 ? answerText.innerHTML = `${phrases[Math.floor(Math.random() * phrases.length)]}${bestPred}${sign[Math.floor(Math.random() * 2)]}` : answerText.innerHTML = "Не могу понять что это";

    opacityTimer = setTimeout(() => {
        answerText.classList.remove("active");
    }, 2000);
}

function calculatePrediction(input, targetVector, flag){ // Вычисление выходного слоя
    if (flag === 1){
        net.hiddenArray.fill(0);
        net.outputArray.fill(0);
    }

    calculateHiddenLayer(input);
    for(let i = 0; i < 128; i++){
        for(let j = 0; j < 10; j++){
            net.outputArray[j] += net.hiddenArray[i] * net.outputWeights[i][j];
        }
    }

    net.outputArray = softmax(net.outputArray); // С помощью функции softMax получаю процентное соотношение

    for(let i = 0; i < 10; i++){
        net.outputArray[i] = parseFloat(net.outputArray[i].toFixed(2));
    }

    flag === 1 ? outputPrediction(net.outputArray) : train(input, targetVector); // Тренирую если флаг равен нулю, 0 - значит идёт тренировка 
}


function calculateHiddenLayer(input){ // Вычисление скрытого слоя
    for(let i = 0; i < 2500; i++){
        for(let j = 0; j < 128; j++){
            net.hiddenArray[j] += input[i] * net.hiddenWeights[i][j];
        }
    }

    for(let j = 0; j < 128; j++){
        net.hiddenArray[j] = Math.max(0, net.hiddenArray[j]); // Relu
    }
}


function softmax(arr){
    const expArr = arr.map(i => Math.exp(i));
    const expSum = expArr.reduce((sum, i) => sum+i, 0);

    return expArr.map(i => i/expSum);
}


function train(input, targetVector){ // Функция обновления весов, сама тренировка
    const learningRate = 0.00005;

    const outputError = net.outputArray.map((x, i) => x - targetVector[i]); // Вычисляется ошибка

    let loss = 0;
    for (let i = 0; i < 10; i++) { // Вычисляется loss по формуле и далее прибовляется к среднему лосу, нужно было мне для определения уровня обученности
        loss -= targetVector[i] * Math.log(net.outputArray[i] + 1e-10); 
    }

    averageLoss += loss;

    for(let i = 0; i < 128; i++){ // Обновляются выходные веса
        for(let j = 0; j < 10; j++){
            net.outputWeights[i][j] -= outputError[j]*net.hiddenArray[i]*learningRate;
        }
    }

    const hiddenError = new Array(128).fill(0);

    for(let i = 0; i < 128; i++){ // Вычисляется ошибка в скрытом слое
        for(let j = 0; j < 10; j++){
            hiddenError[i] += outputError[j]*net.outputWeights[i][j];
        }
        hiddenError[i]*= (net.hiddenArray[i] > 0)? 1 : 0;
    }

    for(let i = 0; i < 2500; i++){ // Обновляются скрытые веса
        for(let j = 0; j < 128; j++){
            net.hiddenWeights[i][j] -= hiddenError[j]*input[i]*learningRate;
        }
    }

    net.hiddenArray.fill(0);
    net.outputArray.fill(0);
}