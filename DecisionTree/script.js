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

        // Получаю все значения целевого признака
        let targetValues = data.map(line => line[this.target]);


        // Если все значения одинаковые - создаем лист
        if (this.isSame(targetValues)) {
            return this.createLeaf(data);
        }

        // Ищу лучшее разбиение по критерию информационного прироста
        let bestSplit = this.findBestSplit(data, attributes);

        let bestAttribute = bestSplit[0];
        let bestValue = bestSplit[1];
        let bestGain = bestSplit[2];

        
        // Если не нашли полезного разбиения 
        if (bestGain <= 0) {
            return this.createLeaf(data);
        }

        // Разделяю данные на две части

        let splitTree = this.splitTree(data, bestAttribute, bestValue);

        let leftData = splitTree[0];
        let rightData = splitTree[1];


        // Удаляю использованный признак из доступных
        
        // Рекурсивно строим поддеревья
        let leftChild = this.buildTree(leftData, attributes, depth + 1);
        let rightChild = this.buildTree(rightData, attributes, depth + 1);

        // Возвращаю узел дерева

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


    

    // Создаю лист дерева
    createLeaf(data) {

        return {
            type: 'leaf',         
            value: data[0][this.target],      
        };
    }

    

    
}

let nodeDataVisualization = new Map();

// Визуализация дерева решения
function visualizeTree() {
    let visualization = document.getElementById('treeVisualization');
    visualization.innerHTML = '';
    nodeDataVisualization.clear();


    let treeVisualization = d3.select(visualization).style('width', '100%').style('height', '600px'); 


    // Создаю SVG холст 
    let svg = treeVisualization.append('svg').attr('width', 2000).attr('height', 2000);

    // Функция масштабирования
    let zoomFunction = d3.zoom().scaleExtent([0.5, 3]).on('zoom', (event) => {
        treeElements.attr('transform', event.transform);
    });

    svg.call(zoomFunction);

    // Все элементы дерева помещаю в одну группу
    let treeElements = svg.append('g');



 
    let treePosition = d3.tree().nodeSize([120, 200]).separation(() => 3);

  


    // Преобразую данные в формат иерархический формат для d3
    let treeHierarchy = d3.hierarchy(decisionTree.root, function(node) {

        if (node.type === 'node') {
            return [node.left, node.right]; 
        }
        return []; 
    });

    treePosition(treeHierarchy);

    

    // Рисую линии между узлами
    treeElements.selectAll('.line') 
        .data(treeHierarchy.links()) // Привязываю данные о связях
        .enter() // Для каждого нового элемента
        .append('path') // Создаю SVG-путь 
        .attr('class', 'line')
        .attr('d', d3.linkVertical() 
            .x(d => d.x) 
            .y(d => d.y) 
        );

    

    // Создаю узлы 
    let nodes = treeElements.selectAll('.node') 
        .data(treeHierarchy.descendants()) // Привязываю данные узлов
        .enter() // Для каждого нового узла
        .append('g') // Создаю группу для каждого узла

        .attr('class', 'node')
        .attr('type', d => `${d.data.type}`)

        .attr('transform', d => `translate(${d.x},${d.y})`)

        .each(function(d) {
            // Сохраняю связь между данными и DOM-элементом
            nodeDataVisualization.set(d.data, this);
        });


    

    // Рисую узлы
    nodes.append('rect')
        .attr('width', 150) 
        .attr('height', 50) 
        .attr('x', -75) 
        .attr('y', -25) 
    
    

    // Текст узла
    nodes.append('text')
        .attr('dy', 4) 
        .attr('text-anchor', 'middle') 
        .style('font-size', '14px') 
        .text(d => {

            if (d.data.type === 'leaf') {

                return `${d.data.value}`;
            }

            else {
                if (!isNaN(d.data.value)) {
                    return `${d.data.attribute} <= ${d.data.value}`;
                }

                else {
                    return `${d.data.attribute} = ${d.data.value}`;
                }
            }

        });
    
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


// Подсветка узлов на пути
function highlightPath(path) {
    d3.selectAll('.node').classed('active', false); // Сбрасываю подсветку
    
    // Подсвечиваю все узлы на пути
    path.forEach(node => {
        let elementHTML = nodeDataVisualization.get(node);
        d3.select(elementHTML).classed('active', true);
    });
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

    // Сбрасываю подсветку
    d3.selectAll('.node').classed('active', false);



    // Формирую HTML с результатами

    let resultHTML = '<h2>Решения:</h2>';

    userData.forEach((line, index) => {
        let path = findPath(line);
        let decision = path[path.length-1].value;
        resultHTML += `
            <div class="decisionLine">
                <strong>Строка ${index + 1}:</strong> ${decision}
                <button class="highlightButton" data-index="${index}">Показать путь</button>
            </div>
        `;
    });


    document.getElementById('decisionResult').innerHTML = resultHTML;

    document.querySelectorAll('.highlightButton').forEach(button => {
        button.addEventListener('click', () => {
            let index = parseInt(this.getAttribute('data-index'));
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

    // Определяю целевую переменную 
    let targetColumn = Object.keys(data[0]).pop();

    
    // Строю дерево
    decisionTree = new DecisionTree(MAX_DEPTH, targetColumn);
    decisionTree.startBuildTree(data, Object.keys(data[0]).filter(column => column !== targetColumn));
    visualizeTree()
});

// Обработчик кнопки предсказания
document.getElementById('decisionButton').addEventListener('click', makeDecision);

