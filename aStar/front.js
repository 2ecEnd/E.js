let brushMode = 'wall';
let startIsSet = false;
let finishIsSet = false;

let buttonsAreActive = false;
let findingThePath = false;


//                         ФУНКЦИИ ДЛЯ СОЗДАНИЯ И ОТОБРАЖЕНИЯ ВЫЗУАЛЬНЫХ ЧАСТЕЙ: КНОПОК И КОНТЕЙНЕРОВ                             //
//                                                          ||                                                                    //
//                                                          \/                                                                    //


const wallButton = document.getElementById("wallBrush");
const startfinishButton = document.getElementById("start-finishBrush");
let findPathButton = document.getElementById("findPath");
const generateMazeButton = document.getElementById("generateMaze");
const slider = document.getElementById("speedSlider");
const animSwitch = document.getElementById("toggle-input");
const eraserButton = document.getElementById("eraserBrush");
const changeSizeButton = document.getElementById("changeSize");
const clearAllButton = document.getElementById("clearAll");


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
    if (buttonsAreActive && !findingThePath) generateMaze();
});

wallButton.addEventListener('click', function(){
    if (buttonsAreActive){
        brushMode = "wall";

        map.classList.add("mapWall");
        map.classList.remove("mapStartFinish");
        map.classList.remove("mapEraser");

        this.classList.add("active");
        startfinishButton.classList.remove("active");
        eraserButton.classList.remove("active");
    }
});

eraserButton.addEventListener('click', function(){
    if (buttonsAreActive){
        brushMode = "eraser";

        map.classList.add("mapEraser");
        map.classList.remove("mapStartFinish");
        map.classList.remove("mapWall");

        this.classList.add("active");
        startfinishButton.classList.remove("active");
        wallButton.classList.remove("active");
    }
});

startfinishButton.addEventListener('click', function(){
    if (buttonsAreActive && !findingThePath){
        brushMode = "start-finish";

        map.classList.remove("mapWall");
        map.classList.add("mapStartFinish");
        map.classList.remove("mapEraser");

        this.classList.add("active");
        wallButton.classList.remove("active");
        eraserButton.classList.remove("active");
    }
});

findPathButton.addEventListener('click', function(){
    if (buttonsAreActive && !findingThePath){
        aStar();
        deactivateButtons();
    }
});

changeSizeButton.addEventListener('click', function(){
    if (buttonsAreActive && !findingThePath){
        
    }
});

clearAllButton.addEventListener('click', function(){
    if (buttonsAreActive && !findingThePath){
        clearAll();
    }
});

const form = document.getElementById('sizeForm'); 
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Перехват информации из формы

    let size = document.getElementById('size').value;
    n = parseInt(size);

    if (isNaN(n)){
        showError('Пожалуйста, введите число');
        return;
    }
    else if(n > 110){
        showError('Это слишком большой размер, максимум 110');
        return;
    }
    else if(n < 2){
        showError('Слишком маленькое число');
        return;
    }

    document.getElementById('tableContainer').removeChild(form);
    createMap();
    activateButtons();
    wallButton.classList.add("active");
    buttonsAreActive = true;
});


function clearAll(){
    for (let i = 0; i < n*n; i++){
        graphNodes[i].isWall = false;

        const cell = document.getElementById(i);
        cell.classList.add('free');
        cell.classList.remove('wall');
        cell.classList.remove('start');
        cell.classList.remove('finish');
    }
    startIsSet = false;
    finishIsSet = false;
}


function createSizeForm(){

}


function createMazeButton(){
    let mazeButton = document.createElement('button');
    mazeButton.id = "maze";
    mazeButton.innerHTML = "Сгенерировать лабиринт";
    mazeButton.addEventListener('click', function(){generateMaze()});

    document.getElementById("mapEditorContainer").appendChild(mazeButton);
}


function activateButtons(){
    const buttons = [wallButton, startfinishButton, findPathButton, generateMazeButton, eraserButton, changeSizeButton, clearAllButton];
    for(let i = 0; i < buttons.length; i++){
        buttons[i].classList.remove("deactiveButton");
        buttons[i].classList.add("button");
    }
    buttonsAreActive = true;
    findingThePath = false;
}

function deactivateButtons(){
    const buttons = [startfinishButton, findPathButton, generateMazeButton, changeSizeButton, clearAllButton];
    for(let i = 0; i < buttons.length; i++){
        buttons[i].classList.add("deactiveButton");
        buttons[i].classList.remove("button");
    }
    findingThePath = true;
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
    const localfindPathButton = document.createElement('button');
    localfindPathButton.id = "findPath";
    localfindPathButton.addEventListener('click', function(){
        aStar();
        deactivateButtons();
    });

    const image = new Image();
    image.src = "../design_Images/Astar 30px.png"

    localfindPathButton.appendChild(image);
    const text = document.createElement('p');
    text.textContent = "Проложить путь";
    localfindPathButton.appendChild(text);

    localfindPathButton.classList.add("button");
    document.getElementById("editorContainer").appendChild(localfindPathButton);
    findPathButton = localfindPathButton;
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
    activateButtons();
}