class mazeCell{ // Так как мой лабиринт генерируется с шагом 2, мне нужна не только клетка в которую я попадаю, но и клетка перед ней - path cell
    constructor(targetCell, pathCell){
        this.targetCell = targetCell;
        this.pathCell = pathCell;
    }
}

function generateMaze(){
    toggleAllCellsIntoWalls(); // Преобразование все клетки в стены
    let randomCell = chooseRandomCell();
    let startCell = new mazeCell(randomCell, randomCell);
    let reachable = [startCell]; // Очередь доступных клеток

    while(reachable.length > 0){
        
        let currentCellIndex = Math.floor(Math.random() * reachable.length); // получаю случайную клетки
        let currentCellNumber = reachable[currentCellIndex].targetCell; // это именно та клетка которую выбирает алгоритм

        if (graphNodes[currentCellNumber].isWall == false){ // проверяем не стена ли она
            reachable.splice(currentCellIndex, 1);
            continue;
        }
        let pathCell = reachable[currentCellIndex].pathCell; // это клетка перед нужной, её тоже нужно превратить в свободную
        reachable.splice(currentCellIndex, 1);


        toggleCellIntoFree(currentCellNumber);
        toggleCellIntoFree(pathCell);


        // далее идут проверки на доступность соседних клеток, если они являются стенами и не выходят за границы карты, то они добвляются в очередь
        if ((currentCellNumber%n - (currentCellNumber-2)%n == 2) && (currentCellNumber-2 >= 0) && (graphNodes[currentCellNumber-2].isWall == true)){
            const turn = new mazeCell(currentCellNumber-2, currentCellNumber-1);
            reachable.push(turn);
        }
        if (((currentCellNumber+2)%n - currentCellNumber%n == 2) && (currentCellNumber+2 < n*n) && (graphNodes[currentCellNumber+2].isWall == true)){
            const turn = new mazeCell(currentCellNumber+2, currentCellNumber+1);
            reachable.push(turn);
        }
        if((currentCellNumber-2*n >= 0) && (graphNodes[currentCellNumber-2*n].isWall == true)){
            const turn = new mazeCell(currentCellNumber-2*n, currentCellNumber-n);
            reachable.push(turn);
        }
        if((currentCellNumber+2*n < n*n) && (graphNodes[currentCellNumber+2*n].isWall == true)){
            const turn = new mazeCell(currentCellNumber+2*n, currentCellNumber+n);
            reachable.push(turn);
        }
    }
}


function toggleCellIntoFree(CellNumber){
    graphNodes[CellNumber].isWall = false;
    const cell = document.getElementById(CellNumber);
    cell.classList.remove('wall');
    cell.classList.add('free');
}


function toggleAllCellsIntoWalls(){
    for (let i = 0; i < n*n; i++){
        graphNodes[i].isWall = true;

        const cell = document.getElementById(i);
        cell.classList.add('wall');
        cell.classList.remove('free');
        cell.classList.remove('start');
        cell.classList.remove('finish');
    }
    startIsSet = false;
    finishIsSet = false;
}


function chooseRandomCell(){ // Тут клетка выбирается таким способом, чтобы по результату генерации лабиринт был огорожен стенами
    if (n%2 != 0){
        let randomNum = Math.floor(Math.random() * (n-1) * (n-1));
        while((randomNum % 2 == 1) || (Math.floor(randomNum/n) % 2 == 0)) randomNum = Math.floor(Math.random() * (n-1) * (n-1));
        return randomNum
    }
    else{
        let randomNum = Math.floor(Math.random() * n * n);
        while(randomNum % 2 == 0) randomNum = Math.floor(Math.random() * n * n);
        return randomNum
    }
}