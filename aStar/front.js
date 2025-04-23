let brushMode = 'wall';
let startIsSet = false;
let finishIsSet = false;

let buttonsAreActive = false;


//                         ФУНКЦИИ ДЛЯ СОЗДАНИЯ И ОТОБРАЖЕНИЯ ВЫЗУАЛЬНЫХ ЧАСТЕЙ: КНОПОК И КОНТЕЙНЕРОВ                             //
//                                                          ||                                                                    //
//                                                          \/                                                                    //


const arrow = document.getElementById("arrow");
const wallButton = document.getElementById("wallBrush");
const startfinishButton = document.getElementById("start-finishBrush");
const findPathButton = document.getElementById("findPath");
const generateMazeButton = document.getElementById("generateMaze");
const slider = document.getElementById("speedSlider");
const animSwitch = document.getElementById("toggle-input");

slider.addEventListener("input", function() {
    if(this.value == 50) sleepTime = 0.01;
    else{
        sleepTime = 50 - this.value;
    }
});

animSwitch.addEventListener("change", function() {
    this.checked ? animOn = true : animOn = false;
});


generateMazeButton.addEventListener('click', function(){
    if (buttonsAreActive) generateMaze();
});

wallButton.addEventListener('click', function(){
    if (buttonsAreActive) brushMode = "wall";
});

startfinishButton.addEventListener('click', function(){
    if (buttonsAreActive) brushMode = "start-finish";
});

findPathButton.addEventListener('click', function(){
    if (buttonsAreActive){
        aStar();
        this.classList.remove("button");
        this.classList.add("deactiveButton");
    }
});

arrow.addEventListener('click', async function(){
    document.getElementById("header").classList.toggle("active");
});


const form = document.getElementById('sizeForm'); 
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Перехват информации из формы

    let size = document.getElementById('size').value;
    n = parseInt(size);

    if (isNaN(n)){
        alert('Пожалуйста, введите число');
        return;
    }
    else if(n > 110){
        alert('Это слишком большой размер, максимум 110');
        return;
    }
    else if(n < 2){
        alert('Слишком маленькое число');
        return;
    }

    document.getElementById('tableContainer').removeChild(form);
    createMap();
    activateButtons();
    buttonsAreActive = true;
});


function createMazeButton(){
    let mazeButton = document.createElement('button');
    mazeButton.id = "maze";
    mazeButton.innerHTML = "Сгенерировать лабиринт";
    mazeButton.addEventListener('click', function(){generateMaze()});

    document.getElementById("mapEditorContainer").appendChild(mazeButton);
}


function activateButtons(){
    const buttons = [wallButton, startfinishButton, findPathButton, generateMazeButton];
    for(let i = 0; i < buttons.length; i++){
        buttons[i].classList.remove("deactiveButton");
        buttons[i].classList.add("button");
    }
}


//                         ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ ПУТИ В ТАБЛИЧКЕ                             //
//                                            ||                                               //
//                                            \/                                               //


function createClearPathButton(startNode, finishNode){
    const clearPathButton = document.createElement('button');
    clearPathButton.id = "clearPath";
    clearPathButton.addEventListener('click', function(){
        hidePath(startNode, finishNode);
    });

    const image = new Image();
    image.src = "images/trash_30px.png"

    clearPathButton.appendChild(image);
    const text = document.createElement('p');
    text.textContent = "Очистить путь";
    clearPathButton.appendChild(text);

    clearPathButton.classList.add("button");
    document.getElementById("editorContainer").appendChild(clearPathButton);
}


function createShowPathButton(){
    const findPathButton = document.createElement('button');
    findPathButton.id = "findPath";
    findPathButton.addEventListener('click', function(){
        aStar();
        this.classList.remove("button");
        this.classList.add("deactiveButton");
    });

    const image = new Image();
    image.src = "../design_Images/Astar 30px.png"

    findPathButton.appendChild(image);
    const text = document.createElement('p');
    text.textContent = "Проложить путь";
    findPathButton.appendChild(text);

    findPathButton.classList.add("button");
    document.getElementById("editorContainer").appendChild(findPathButton);
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

    for(let i = 0; i < n*n; i++){
        const cell = document.getElementById(i);
        if (cell.classList.contains('current')) cell.classList.remove('current');
    }

    document.getElementById("editorContainer").removeChild(document.getElementById("clearPath"));
    createShowPathButton();
}