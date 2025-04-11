let graphNodes; // Массив вершин хранит объекты класса Node
let n;

let start = 0;
let finish = 0;


function createMap(){ // Создание таблицы размером n*n
    let table = document.createElement('table');
    table.classList.add("map");
    let number = 0;

    graphNodes = new Array(n*n);

    for(let i = 0; i < n; i++){
        let row = table.insertRow();
        for(let j = 0; j < n; j++){
            let cell = row.insertCell();
            cell.id = number;
            cell.classList.add('free');

            let cellNumber = number
            cell.addEventListener('click', function(){toggleWall(cell, cellNumber)})

            graphNodes[number] = new Node(number);

            number += 1;
        }
    }

    document.getElementById("modelsContainer").appendChild(table);
    createMapEditorContainer();
}


function toggleWall(cell, cellNumber){ // Функция превращает клетку в wall или start-finish, в зависимости от текущей кисти (brushMode)
    if (brushMode == 'wall'){
        cell.classList.toggle('wall')
        cell.classList.toggle('free')

        if (!graphNodes[cellNumber].isWall) graphNodes[cellNumber].isWall = true;
        else graphNodes[cellNumber].isWall = false;
    }
    else{
        if(!startIsSet){
            if(cell.classList.contains('finish')){
                cell.classList.toggle('finish')
                finishIsSet = false;
            }
            else{
                cell.classList.toggle('start')
                startIsSet = true;
                start = cellNumber;
            }
            cell.classList.toggle('free')
        }
        else if(!finishIsSet){
            if(cell.classList.contains('start')){
                cell.classList.toggle('start')
                startIsSet = false;
            }
            else{
                cell.classList.toggle('finish')
                finishIsSet = true;
                finish = cellNumber;
            }
            cell.classList.toggle('free')
        }
        else{
            if(cell.classList.contains('finish')){
                cell.classList.toggle('finish')
                finishIsSet = false;
            }
            else if(cell.classList.contains('start')){
                cell.classList.toggle('start')
                startIsSet = false;
            }
        }
    }
}


class Node{ // Класс для вершины
    constructor(number){
        this.reachableNodes = []; // Соседние клетки, в которые можно попасть из этой
        this.isWall = false;
        this.visited = false;
        this.cost = 10000000;
        this.previousNode; 

        // Проверка соседних клеток на доступность
        if ((number%n - (number-1)%n == 1) && (number-1 >= 0)){
            this.reachableNodes.push(number-1);
        }
        if (((number+1)%n - number%n == 1) && (number+1 < n*n)){
            this.reachableNodes.push(number+1);
        }
        if(number-n >= 0){
            this.reachableNodes.push(number-n);
        }
        if(number+n < n*n){
            this.reachableNodes.push(number+n);
        }
    }


}


async function aStar(){
    let flag = false; // Флаг становится true если мы нашли finish
    let startNode = start;
    let finishNode = finish;
    let currentNodeNumber;
    let reachable = [startNode]; // Массив с доступными для посещения клетками

    graphNodes[startNode].visited = true;
    graphNodes[startNode].cost = 0;
    
    while (reachable.length > 0 && !flag){

        let currentNodeIndex = chooseNode(reachable, finishNode); // Индекс лучшей клетки в массиве reachable

        currentNodeNumber = reachable[currentNodeIndex]; // Номер лучшей клетки

        let currentNode = graphNodes[currentNodeNumber]; // Сама клетка, объект класса Node

        reachable.splice(currentNodeIndex, 1);

        document.getElementById(currentNodeNumber).classList.add('current');

        if (currentNodeNumber == finishNode){
            flag = true;
        }
        else{
            for (let i of currentNode.reachableNodes){
                let nextNode = graphNodes[i];
                if (!nextNode.isWall){
                    if (!nextNode.visited){
                        reachable.push(i);
                        nextNode.visited = true;
                        nextNode.previousNode = currentNodeNumber;
                        nextNode.cost = currentNode.cost + 1;
                    }
                    else if(nextNode.cost > currentNode.cost + 1){
                        nextNode.cost = currentNode.cost + 1;
                        nextNode.previousNode = currentNodeNumber;
                    }
                }
            }
        }

        await sleep(10);
    }


    if (flag){
        showPath(startNode, finishNode);

        document.getElementById("modelsContainer").removeChild(document.getElementById("mapEditorContainer"));

        createClearPathButton(startNode, finishNode);
    }
    else{
        alert("Нет пути");
    }


    clearGraphNodes();
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


function clearGraphNodes(){
    for (let i of graphNodes){
        i.visited = false;
    }
}


function chooseNode(nodes, finishNode){ // Алгоритм выбора лучшей клетки из доступных
    let bestCost = 1000000;
    let currentNode;
    let bestNode;

    for (let i = 0; i < nodes.length; i++){
        currentNode = nodes[i];

        if(graphNodes[currentNode].cost + evristicCost(currentNode, finishNode) < bestCost){
            bestNode = i;
            bestCost = graphNodes[currentNode].cost + evristicCost(currentNode, finishNode);
        }

        // if(evristicCost(currentNode, finishNode) < bestCost){
        //     bestNode = i;
        //     bestCost = evristicCost(currentNode, finishNode);
        // }
    }

    return bestNode;
}


function evristicCost(currentNode, finishNode){ // Эвристика Манхэттенское расстояние
    return Math.abs(Math.floor(currentNode / n) - Math.floor(finishNode / n)) + Math.abs(currentNode%n - finishNode%n);
}