let graphNodes;
let n;

let brushMode = 'wall';
let startIsSet = false;
let finishIsSet = false;

let start = 0;
let finish = 0;

const form = document.getElementById('sizeForm');
form.addEventListener('submit', function(event) {
    event.preventDefault();

    let size = document.getElementById('size').value;
    n = parseInt(size);

    if (isNaN(n)){
        alert('Пожалуйста, введите число');
        return;
    }
    else if(n > 20){
        alert('Это слишком большой размер, максимум 20');
        return;
    }
    else if(n < 2){
        alert('Слишком маленькое число');
        return;
    }

    document.getElementById('modelsContainer').removeChild(form);
    createMap();
});

function createGenerateButton(){
    let generateButton = document.createElement('button');
    generateButton.id = "generate";
    generateButton.innerHTML = "Проложить путь";
    generateButton.addEventListener('click', function(){aStar()});

    document.getElementById("mapEditorContainer").appendChild(generateButton);
}

function createBrushes(){
    let brushContainer = document.createElement('div');
    brushContainer.id = "brushContainer";
    brushContainer.classList.add('brushContainer');

    let wallBrush = document.createElement('button');
    let startFinishBrush = document.createElement('button');
    wallBrush.id = "wallBrush";
    startFinishBrush.id = "startFinishBrush";

    wallBrush.addEventListener('click', function(){brushMode = 'wall'});
    startFinishBrush.addEventListener('click', function(){brushMode = 'start-finish'});

    document.getElementById("mapEditorContainer").appendChild(brushContainer);
    document.getElementById("brushContainer").appendChild(wallBrush);
    document.getElementById("brushContainer").appendChild(startFinishBrush);
}

function createMapEditorContainer(){
    let container = document.createElement('div');
    container.id = "mapEditorContainer";
    container.classList.add('mapEditor');

    document.getElementById("modelsContainer").appendChild(container);

    createGenerateButton();
    createBrushes();
}

function createMap(){
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

function toggleWall(cell, cellNumber){
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

function openTub(button){
    let div = document.getElementById("modelsContainer");
    button.classList.toggle('active');
    div.classList.toggle('open');
}

class Node{
    constructor(number){
        this.reachableNodes = [];
        this.isWall = false;
        this.explored = false;
        this.cost = 10000000;
        this.previousNode;

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

function createClearPathButton(startNode, finishNode){
    let generateButton = document.createElement('button');
    generateButton.id = "clearPath";
    generateButton.innerHTML = "Очистить путь";
    generateButton.addEventListener('click', function(){hidePath(startNode, finishNode)});

    document.getElementById("modelsContainer").appendChild(generateButton);
}

function evristicCost(currentNode, finishNode){
    return Math.abs(Math.floor(currentNode / n) - Math.floor(finishNode / n)) + Math.abs(currentNode%n - finishNode%n);
}

function aStar(){
    let flag = false;
    let startNode = start;
    let finishNode = finish;
    let currentNodeNumber;
    let reachable = [startNode];
    graphNodes[startNode].explored = true;
    graphNodes[startNode].cost = 0;

    while (reachable.length > 0){

        let currentNodeIndex = chooseNode(reachable, finishNode);
        currentNodeNumber = reachable[currentNodeIndex];

        let currentNode = graphNodes[currentNodeNumber];

        reachable.splice(currentNodeIndex, 1);

        if (currentNodeNumber == finishNode){
            flag = true;
        }
        else{
            for (let i of currentNode.reachableNodes){
                let nextNode = graphNodes[i];
                if (!nextNode.isWall){
                    if (!nextNode.explored){
                        reachable.push(i);
                        nextNode.explored = true;
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

function chooseNode(nodes, finishNode){
    let bestCost = 1000000;
    let currentNode;
    let bestNode;

    for (let i = 0; i < nodes.length; i++){
        currentNode = nodes[i];

        if(graphNodes[currentNode].cost + evristicCost(currentNode, finishNode) < bestCost){
            bestNode = i;
        }
    }

    return bestNode;
}

function clearGraphNodes(){
    for (let i of graphNodes){
        i.explored = false;
    }
}

function showPath(startNode, finishNode){
    let currentNode = finishNode;

    while(currentNode != startNode){
        currentNode = graphNodes[currentNode].previousNode;
        document.getElementById(currentNode).classList.toggle('path');
    }
}

function hidePath(startNode, finishNode){
    let currentNode = finishNode;

    while(currentNode != startNode){
        currentNode = graphNodes[currentNode].previousNode;
        document.getElementById(currentNode).classList.toggle('path');
    }

    document.getElementById("modelsContainer").removeChild(document.getElementById("clearPath"));
    createMapEditorContainer();
}