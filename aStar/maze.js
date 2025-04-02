

function generateMaze(){
    toggleAllCellsIntoWalls();
    let randomCell = chooseRandomCell();
    let startCell = [randomCell, randomCell]
    let reachable = [startCell];

    while(reachable.length > 0){
        
        let currentCellIndex = Math.floor(Math.random() * reachable.length);
        let currentCellNumber = reachable[currentCellIndex][0];

        if (graphNodes[currentCellNumber].isWall == false){
            reachable.splice(currentCellIndex, 1);
            continue;
        }
        let pathCell = reachable[currentCellIndex][1];
        reachable.splice(currentCellIndex, 1);


        graphNodes[currentCellNumber].isWall = false;
        const cell = document.getElementById(currentCellNumber);
        cell.classList.remove('wall');
        cell.classList.add('free');

        graphNodes[pathCell].isWall = false;
        const prevCell = document.getElementById(pathCell);
        prevCell.classList.remove('wall');
        prevCell.classList.add('free');


        if ((currentCellNumber%n - (currentCellNumber-2)%n == 2) && (currentCellNumber-2 >= 0) && (graphNodes[currentCellNumber-2].isWall == true)){
            const turn = [currentCellNumber-2, currentCellNumber-1]
            reachable.push(turn);
        }
        if (((currentCellNumber+2)%n - currentCellNumber%n == 2) && (currentCellNumber+2 < n*n) && (graphNodes[currentCellNumber+2].isWall == true)){
            const turn = [currentCellNumber+2, currentCellNumber+1]
            reachable.push(turn);
        }
        if((currentCellNumber-2*n >= 0) && (graphNodes[currentCellNumber-2*n].isWall == true)){
            const turn = [currentCellNumber-2*n, currentCellNumber-n]
            reachable.push(turn);
        }
        if((currentCellNumber+2*n < n*n) && (graphNodes[currentCellNumber+2*n].isWall == true)){
            const turn = [currentCellNumber+2*n, currentCellNumber+n]
            reachable.push(turn);
        }
    }
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


function chooseRandomCell(){
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