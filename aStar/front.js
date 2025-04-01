let brushMode = 'wall';
let startIsSet = false;
let finishIsSet = false;


//                         ФУНКЦИИ ДЛЯ СОЗДАНИЯ И ОТОБРАЖЕНИЯ ВЫЗУАЛЬНЫХ ЧАСТЕЙ: КНОПОК И КОНТЕЙНЕРОВ                             //
//                                                          ||                                                                    //
//                                                          \/                                                                    //


function openTub(button){ // Выдвигающееся меню с картой
    let div = document.getElementById("modelsContainer");
    button.classList.toggle('active');
    div.classList.toggle('open');
}


const form = document.getElementById('sizeForm'); 
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Перехват информации из формы

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


function createMapEditorContainer(){ 
    let container = document.createElement('div');
    container.id = "mapEditorContainer";
    container.classList.add('mapEditor');

    document.getElementById("modelsContainer").appendChild(container);

    createGenerateButton();
    createBrushes();
}


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



//                         ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ ПУТИ В ТАБЛИЧКЕ                             //
//                                            ||                                               //
//                                            \/                                               //


function createClearPathButton(startNode, finishNode){
    let generateButton = document.createElement('button');
    generateButton.id = "clearPath";
    generateButton.innerHTML = "Очистить путь";
    generateButton.addEventListener('click', function(){hidePath(startNode, finishNode)});

    document.getElementById("modelsContainer").appendChild(generateButton);
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