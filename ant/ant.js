class Ant
{
    path = [];
    distance = 0;
    visited = [];
    start = 0;
    curr = 0;
    canContinue = true;

    constructor(start = 0)
    {
        this.start = start;
        this.curr = start;
    }

    // Метод выбора следующей вершины
    makeChoice(adj, pheromoneMatrix, a, b)
    {
        if (this.path.length == 0)
        {
            this.path.push(this.curr);
            this.visited.push(this.curr); 
        }

        // Если соседей не оказалось = весь путь был пройден
        let neighborVertexes = this.getNeighborVertexes(adj);
        if (neighborVertexes.length == 0)
        {
            this.canContinue = false;
            this.path.push(this.start);
            this.distance += adj[this.curr][this.start];
            return;
        }

        let choosingProbabilities = [];
        // Подсчёт вероятности перехода муравья в соседние вершины
        let wishes = [];
        let probability = [];
        let summWishes = 0.0;
        for(let neighbor of neighborVertexes)
        {
            let pheromone = pheromoneMatrix[this.curr][neighbor];
            let proximity = 1 / adj[this.curr][neighbor];

            wishes.push(Math.pow(pheromone, a) * Math.pow(proximity, b));
            summWishes += wishes.at(-1);
        }
        for(let neighbor in neighborVertexes)
        {
            probability.push(wishes[neighbor] / summWishes);
            if (neighbor == 0)
            {
                choosingProbabilities[neighbor] = probability.at(-1);
            }
            else
            {
                choosingProbabilities[neighbor] = choosingProbabilities[neighbor - 1] + probability.at(-1);
            }
        }

        //Выбор следующей вершины
        let nextVertex;
        let choose = Math.random();
        for(let neighbor in neighborVertexes)
        {
            if (choose <= choosingProbabilities[neighbor])
            {
                nextVertex = neighborVertexes[neighbor];
                break;
            }
        }

        this.path.push(nextVertex);
        this.distance += adj[this.curr][nextVertex];
        this.visited.push(nextVertex);
        this.curr = nextVertex;
    }
    
    // Получение соседних ещё не посещённых вершин
    getNeighborVertexes(adj)
    {
        let neighbors = [];
        for(let vertex in adj)
        {
            if (adj[this.curr][vertex] != 0 && 
                this.visited.indexOf(vertex) == -1)
            {
                neighbors.push(vertex);
            }
        }
        return neighbors;
    }
}

class AntColonyOptimization
{
    kAlpha;
    kBeta;
    kPheromone = 1;
    kQ;
    kEvaporation;

    adj = [];
    pheromoneMatrix = [];

    ants = [];

    constructor(adj, alpha, beta, Q, evaporation)
    {
        this.adj = adj;
        this.kAlpha = alpha;
        this.kBeta = beta;
        this.kQ = Q;
        this.kEvaporation = evaporation;

        let graphWeight = 0.0;
        for(let i in adj)
        {
            let j = i + 1
            for(j in this.adj)
            {
                graphWeight += this.adj[i][j];
            }
        }
        this.kQ = 0.015 * graphWeight;

        for(let i in this.adj)
        {
            let row = [];
            for(let j in this.adj)
            {
                if (i == j)
                {
                    row.push(0.0);
                }
                else
                {
                    row.push(this.kQ);
                }
            }
            this.pheromoneMatrix.push(row);
        }
    }

    createAnts()
    {
        for(let i in this.adj)
        {
            this.ants.push(new Ant(i));
        }
    }

    updatePheromone(lup)
    {
        // lup - local update pheromone 
        for(let i in lup)
        {
            for(let j in lup)
            {
                this.pheromoneMatrix[i][j] = (1 - this.kEvaporation) * pheromoneMatrix[i][j] + lup[i][j];
                if(this.pheromoneMatrix[i][j] < 0.01 && i != j)
                {
                    this.pheromoneMatrix = 0.01;
                }
            }
        }
    }

    solveSalesmansProblem()
    {
        if (adj.length == 0)
            return;

        const maxIter = 100; // Через какое кол-во итераций прекратить после того, как путь перестал улучшаться
        let iter = 0;
        
        let path = [];
        let distance = 1000000000;

        while (iter != maxIter)
        {
            iter += 1;
            let lup = [];
            this.createAnts();

            for(let ant of this.ants)
            {
                while(ant.canContinue)
                {
                    ant.makeChoice(this.adj, this.pheromoneMatrix, this.kAlpha, this.kBeta);
                }

                if (ant.distance < distance)
                {
                    path = ant.path;
                    distance = ant.distance;
                    iter = 0;
                }

                for(let v in ant.path.length - 1)
                {
                    lup[v][v + 1] += this.kQ / ant.distance;
                }
            }
            this.updatePheromone(lup);
        }

        return path;
    }
}

//Работа с холстом
let points = [];

let canvas = document.getElementsByTagName('canvas')[0];
canvas.height = 480;
canvas.width  = 640;

let context = example.getContext('2d');
canvas.addEventListener('click', function(e)
{
    // Преобразование координат курсора, чтобы точки отрисовывались корректно
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Отрисовка точки в месте клика 
    context.fillStyle = "#5a5a5a";
    context.beginPath();
    context.arc(currX, currY, 5, 0, 2 * Math.PI, true);
    context.fill();
    context.closePath();

    // Пушим точку в массив
    points.push([currX, currY]);

    let index = 0;
    context.beginPath();
    context.strokeStyle = "rgba(120, 120, 120, 0.2)";
    while (index < points.length - 1)
    {
        context.moveTo(currX, currY);
        context.lineTo(points[index][0], points[index][1]);

        index++;
    }
    context.stroke();
    context.closePath();
});


// Активация алгоритма
document.getElementById('dataForm').addEventListener('submit', function(e)
{
    e.preventDefault(); // Отменяем перезагрузку страницы

    // Составление матрицы смежности
    adj = [];
    for(let i in points)
    {
        let row = []
        for(let j in points)
            row.push(((points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2) ** (0.5))
        adj.push(row);
    }

    let antColony = new AntColonyOptimization
    (
        adj, 
        parseInt(document.getElementById('alpha').value),
        parseInt(document.getElementById('beta').value),
        parseInt(document.getElementById('q').value),
        parseInt(document.getElementById('evaporation').value),
    );


    let path = antColony.solveSalesmansProblem();
    for(let v of path)
    {
        console.log(v);
    }
    context.strokeStyle = "rgba(255, 0, 0, 1)";
    
    context.beginPath();
    for(let point in path)
    {
        point = Number(point);
        //context.strokeStyle = colors[point];
        context.moveTo(points[path[point]][0], points[path[point]][1]);
        if(point == path.length - 1)
            context.lineTo(points[path[0]][0], points[path[0]][1]);
        else
            context.lineTo(points[path[point + 1]][0], points[path[point + 1]][1]);
        context.stroke(); 
    }   
    context.closePath();   
});