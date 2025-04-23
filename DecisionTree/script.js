
let decisionTree; 
const MAX_DEPTH = 25; // Максимальная глубина дерева 


// Класс дерева решений
class DecisionTree {
    constructor(maxDepth, target) {
        this.maxDepth = maxDepth; 
        this.target = target;
        this.root = null; 
    }


    startBuildTree(data, attributes) {
        this.root = this.buildTree(data, attributes, 0);
    }

    // Рекурсивное построение дерева
    buildTree(data, attributes, depth) {
        // Условия остановки рекурсии:
        if (depth >= this.maxDepth || data.length <= 1) {
            return this.createLeaf(data); 
        }

        // Получаем все значения целевого признака
        let targetValues = data.map(line => line[this.target]);


        // Если все значения одинаковые - создаем лист
        if (this.isSame(targetValues)) {
            return this.createLeaf(data);
        }

        // Ищем лучшее разбиение по критерию информационного прироста
        let bestSplit = this.findBestSplit(data, attributes);

        let bestAttribute = bestSplit[0];
        let bestValue = bestSplit[1];
        let bestGain = bestSplit[2];

        
        // Если не нашли полезного разбиения 
        if (bestGain <= 0) {
            return this.createLeaf(data);
        }

        // Разделяем данные на две части

        let splitTree = this.splitTree(data, bestAttribute, bestValue);

        let leftData = splitTree[0];
        let rightData = splitTree[1];


        // Удаляем использованный признак из доступных
        
        // Рекурсивно строим поддеревья
        let leftChild = this.buildTree(leftData, attributes, depth + 1);
        let rightChild = this.buildTree(rightData, attributes, depth + 1);

        // Возвращаем узел дерева

        return {
            type: 'node', 
            attribute: bestAttribute, 
            value: bestValue, 
            left: leftChild, 
            right: rightChild 
        };

    }

    // Поиск наилучшего разбиения
    findBestSplit(data, attributes) {
        let bestAttribute;   
        let bestValue;     
        let bestGain = -Infinity; 
        let bestSplit = [];
    

        let targetValues = [];
        for (let line of data) {
            targetValues.push(line[this.target]); 
        }

        let currentEntropy = this.calculateEntropy(targetValues);
    

        for (let attribute of attributes) {
 

            if (!isNaN(parseFloat(data[0][attribute]))) {
                // Для числовых

                // Собираем все уникальные значения признака
                let uniqueValues = [];
                let valuesSet = new Set(); 

                for (let line of data) {
                    valuesSet.add(parseFloat(line[attribute]));
                }

  
                for (let value of valuesSet) {
                    uniqueValues.push(value);
                }
                uniqueValues.sort((a, b) => a - b);
    
                // Перебираем возможные пороги для разделения

                for (let i = 0; i < uniqueValues.length - 1; i++) {

                    let threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                    
                    // Разделяем данные на две группы
                    let leftData = [];
                    let rightData = [];

                    for (let line of data) {
                        if (parseFloat(line[attribute]) <= threshold) {
                            leftData.push(line);
                        } 
                        
                        else {
                            rightData.push(line);
                        }
                    }
    

                    if (leftData.length === 0 || rightData.length === 0) continue;
    
                    // Вычисляем информационный прирост

                    let leftTargets = []; 
                    let rightTargets = [];

      
                    for (let line of leftData) { 
                        leftTargets.push(line[this.target]); 

                    }

                    
                    for (let line of rightData) {
                        rightTargets.push(line[this.target]); 
                    }

                    // Вычисляем информационный прирост для этого разделения
                    let gain = this.calculateInformationGain(currentEntropy, leftTargets, rightTargets);


                    if (gain > bestGain) { 
                        bestGain = gain;    
                        bestAttribute = attribute; 
                        bestValue = threshold;    
                    }
                }


            } 
            
            else {
                // Для текстовых

                let values = new Set();
                for (let line of data) {
                    values.add(line[attribute]);
                }
    

                for (let value of values) {

                    let leftData = [];
                    let rightData = [];

                    for (let line of data) {
                        if (line[attribute] === value) {
                            leftData.push(line);
                        } 
                        
                        else {
                            rightData.push(line);
                        }
                    }
    
   
                    if (leftData.length === 0 || rightData.length === 0) continue;
    

                    let leftTargets = []; 
                    let rightTargets = []; 

                    for (let line of leftData) { 
                        leftTargets.push(line[this.target]); 

                    }

                    
                    for (let line of rightData) { 
                        rightTargets.push(line[this.target]); 
                    }

 
                    let gain = this.calculateInformationGain(currentEntropy, leftTargets, rightTargets);


                
                    if (gain > bestGain) { 
                        bestGain = gain;    
                        bestAttribute = attribute; 
                        bestValue = value;    
                    }
                }
            }
        }

        bestSplit = [bestAttribute, bestValue, bestGain];
    

        return bestSplit;
    }



    // Вычисление информационного прироста
    calculateInformationGain(parentEntropy, leftTargets, rightTargets) {

        let total = leftTargets.length + rightTargets.length;
        
        // Энтропия левой и правой частей
        let leftEntropy = this.calculateEntropy(leftTargets);
        let rightEntropy = this.calculateEntropy(rightTargets);
        
        // Формула информационного прироста
        return parentEntropy - (leftTargets.length / total * leftEntropy + rightTargets.length / total * rightEntropy);
    }

    // Вычисление энтропии
    calculateEntropy(values) {
        // Подсчет количества каждого класса
        let counts = {};
        for (let value of values) {

            if (!counts[value]) {
                counts[value] = 0; 
            }
            counts[value]++;

        }
        
        let entropy = 0;
        
        // Формула энтропии Шеннона
        for (let key in counts) {
            let p = counts[key] / values.length;
            entropy += p * Math.log2(p);
        }

        entropy = (-1) * entropy;
        
        return entropy;
    }

    // Разделение данных на две части
    splitTree(data, attribute, value) {
        let leftData = []; 
        let rightData = []; 
        
        for (let line of data) {
            if (!isNaN(parseFloat(line[attribute]))) {
                // Для числовых

                if (parseFloat(line[attribute]) <= value) {
                    leftData.push(line);
                } 
                
                else {
                    rightData.push(line);
                }

            } 

            else {
                // Для текстовых

                if (line[attribute] === value) {
                    leftData.push(line);
                } 
                
                else {
                    rightData.push(line);
                }
            }
        }

        let splitTree = [leftData, rightData];
        
        return splitTree;
    }


    isSame(values) {
        return new Set(values).size === 1;
    }

    // Создание листа дерева
    

    // Создаёт лист дерева решений (конечный узел)
    createLeaf(data) {

        return {
            type: 'leaf',         
            value: data[0][this.target],      
        };
    }

    

    
}





// Нахождение пути предсказания для строки
function findPath(line) {
    let path = []; 
    let currentNode = decisionTree.root; 
    

    while (currentNode && currentNode.type !== 'leaf') {
        path.push(currentNode); 
        if (compareValues(line[currentNode.attribute], currentNode.value)) {
            currentNode = currentNode.left; 
        } 
        
        else {
            currentNode = currentNode.right; 
        }
    }
    path.push(currentNode);
    
    return path;
}



// Функция для принятия решений
function makeDecision() {
    if (!decisionTree) {
        alert('Вначале необходимо построить дерево решений');
        return;
    }


    let csvData = document.getElementById('decisionData').value.trim();
    
    if (!csvData) {
        alert('Введите ваши данные');
        return;
    }


    let userData = parseCSV(csvData);



    // Формируем HTML с результатами

    let resultHTML = '<h3>Prediction Results:</h3>';

    userData.forEach((line, index) => {
        let path = findPath(line);
        let decision = path[path.length-1].value;
        resultHTML += `
            <div class="decisionLine">
                <strong>Строка ${index + 1}:</strong> ${decision}
                <button class="highlight-btn" data-index="${index}">Показать путь</button>
            </div>
        `;
    });


    document.getElementById('decisionResult').innerHTML = resultHTML;


}

// Сравнение значений с учетом типа
function compareValues(a, b) {
    if (!isNaN(a) && !isNaN(b)) {
        return parseFloat(a) <= parseFloat(b); // Числовое сравнение
    }
    return a === b; // Строковое сравнение
}


function parseCSV(inputText) {
    let lines = inputText.split('\n');
    
    
    let headers = lines[0].split(',').map(header => header.trim());

    let data = [];

    let newLines = lines.slice(1);

    newLines.forEach((line, i) => {
        let values = line.split(',').map(value => value.trim());
        let row = {};
        headers.forEach((header, j) => {
            row[header] = values[j] || '';
        });
        data[i] = row;
    });

    return data;
}

// Обработчик кнопки построения дерева
document.getElementById('buildTreeButton').addEventListener('click', () => {
    let csvData = document.getElementById('trainingData').value.trim();
    if (!csvData) {
        alert('Введите обучающюю выборку');
        return;
    }

    let data = parseCSV(csvData);


    if (data.length === 0) {
        alert('Введённая информация некоректна');
        return;
    }

    // Определяем целевую переменную (последний столбец)
    let targetColumn = Object.keys(data[0]).pop();

    
    // Строим дерево
    decisionTree = new DecisionTree(MAX_DEPTH, targetColumn);
    decisionTree.startBuildTree(data, Object.keys(data[0]).filter(column => column !== targetColumn));
});

// Обработчик кнопки предсказания
document.getElementById('predictButton').addEventListener('click', makeDecision);