let decisionTree; 

class Node {
    constructor(type, value, attribute = undefined, leftChild = undefined, rightChild = undefined) {
        this.type = type;
        this.attribute = attribute;
        this.value = value;
        this.left = leftChild;
        this.right = rightChild;
    }
}

// Класс дерева решений
class DecisionTree {
    constructor(target, maxDepth) {
        this.target = target;
        this.root = null; 
        this.maxDepth = maxDepth;
    }


    startBuildTree(data, attributes) {
        this.root = this.buildTree(data, attributes, 0);
    }

    // Рекурсивное построение дерева
    buildTree(data, attributes, depth) {
        // Условия остановки рекурсии:
        if (depth >= this.maxDepth || data.length <= 1) {
            let leaf = new Node('leaf', data[0][this.target]);
            return leaf; 
        }

        // Получаем все значения целевого признака
        let targetValues = data.map(line => line[this.target]);


        // Если все значения одинаковые - создаем лист
        if (this.isSame(targetValues)) {
            let leaf = new Node('leaf', data[0][this.target]);
            return leaf;
        }

        // Ищем лучшее разбиение по критерию информационного прироста
        let bestSplit = this.findBestSplit(data, attributes);

        let bestAttribute = bestSplit[0];
        let bestValue = bestSplit[1];
        let bestGain = bestSplit[2];

        
        // Если не нашли полезного разбиения 
        if (bestGain <= 0) {
            let leaf = new Node('leaf', data[0][this.target]);
            return leaf;
        }

        // Разделяем данные на две части

        let splitTree = this.splitTree(data, bestAttribute, bestValue);

        let leftData = splitTree[0];
        let rightData = splitTree[1];

        
        // Рекурсивно строим поддеревья
        let leftChild = this.buildTree(leftData, attributes, depth + 1);
        let rightChild = this.buildTree(rightData, attributes, depth + 1);

        // Возвращаем узел дерева

        let node = new Node('node', bestValue, bestAttribute, leftChild, rightChild);

        return node;
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

                // Собираю все уникальные значения признака
                let uniqueValues = [];
                let valuesSet = new Set(); 

                for (let line of data) {
                    valuesSet.add(parseFloat(line[attribute]));
                }

  
                for (let value of valuesSet) {
                    uniqueValues.push(value);
                }
                uniqueValues.sort((a, b) => a - b);
    
                // Перебираю возможные пороги для разделения

                for (let i = 0; i < uniqueValues.length - 1; i++) {

                    let threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                    
                    // Разделяю данные на две группы
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
    
                    // Вычисляю информационный прирост

                    let leftTargets = []; 
                    let rightTargets = [];

      
                    for (let line of leftData) { 
                        leftTargets.push(line[this.target]); 

                    }

                    
                    for (let line of rightData) {
                        rightTargets.push(line[this.target]); 
                    }

                    // Вычисляю информационный прирост для этого разделения
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
        let valueCounts = {};
        for (let value of values) {

            if (!valueCounts[value]) {
                valueCounts[value] = 0; 
            }
            valueCounts[value]++;

        }
        
        let entropy = 0;
        
        // Формула энтропии Шеннона
        for (let value in valueCounts) {
            let p = valueCounts[value] / values.length;
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
        let setValues = new Set(values);
        if (setValues.length === 1) {
            return true;
        }
        else {
            return false;
        }
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
        showError('Вначале необходимо построить дерево решений');
        return;
    }


    let csvData = document.getElementById('decisionData').value.trim();
    
    if (!csvData) {
        showError('Введите ваши данные');
        return;
    }


    let userData = parseCSV(csvData);

    // Сбрасываю подсветку
    d3.selectAll('.node').classed('active', false);



    // Формирую HTML с результатами

    let resultHTML = '<h2>Решения:</h2>';

    userData.forEach((line, index) => {
        let path = findPath(line);
        let decision = path[path.length-1].value;
        resultHTML += `
            <div class="decisionLine">
                Строка ${index + 1}: ${decision}
                <button class="highlightButton" dataIndex="${index}">Показать путь</button>
            </div>
        `;
    });


    document.getElementById('decisionResult').innerHTML = resultHTML;

    document.querySelectorAll('.highlightButton').forEach(button => {
        button.addEventListener('click', function() {
            let index = parseInt(this.getAttribute('dataIndex'));
            let line = userData[index];
            let path = findPath(line);
            highlightPath(path); // Подсвечиваем путь
        });
    });
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
    
    
    let headers = lines[0].split(';').map(header => header.trim());

    let data = [];

    let newLines = lines.slice(1);

    newLines.forEach((line, i) => {
        let values = line.split(';').map(value => value.trim());
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
    let maxDepth = parseInt(document.getElementById('maxDepth').value)

    if (!csvData) {
        showError('Введите обучающюю выборку');
        return;
    }

    let data = parseCSV(csvData);


    if (data.length === 0) {
        showError('Введённая информация некоректна');
        return;
    }

    // Определяю целевую переменную 
    let targetColumn = Object.keys(data[0]).pop();



    
    // Строю дерево
    decisionTree = new DecisionTree(targetColumn, maxDepth);
    decisionTree.startBuildTree(data, Object.keys(data[0]).filter(column => column !== targetColumn));
    visualizeTree()
});

// Обработчик кнопки предсказания
document.getElementById('decisionButton').addEventListener('click', makeDecision);

