var canvas = document.getElementsByTagName('canvas')[0];
canvas.width  = 1024;
canvas.height = 768;
var ctx = canvas.getContext('2d');

let vertexColor = "rgb(0, 0, 0)";
let edgeColor   = "rgba(160, 160, 160, 0.1)";
let pathColor   = "rgba(0, 200, 0, 0.8)";

// Очистка холста
function clearCanvas() 
{
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Отрисовка вершин графа
function drawVertexes(all = true)
{
    ctx.fillStyle = vertexColor;
    if (all)
    {
        for(let i in vertexes)
        {
            ctx.beginPath();
            ctx.arc(vertexes[i][0], vertexes[i][1], 5, 0, 2 * Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }
    }
    else
    {
        ctx.beginPath();
        ctx.arc(vertexes.at(-1)[0], vertexes.at(-1)[1], 5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();
    }
}

// Отрисовка рёбер графа
function drawEdges()
{
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i = 0; i < vertexes.length; i++)
        for(let j = i + 1; j < vertexes.length; j++)
        {
            ctx.moveTo(vertexes[i][0], vertexes[i][1]);
            ctx.lineTo(vertexes[j][0], vertexes[j][1]);
        }
    ctx.stroke();
    ctx.closePath();
}

// Отрисовка найденного пути
async function drawPath(path) 
{
    clearCanvas();

    // Отрисовка найденного пути 
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let v = 0; v < path.length - 1; v++)
    {
        ctx.moveTo(vertexes[path[v]][0], vertexes[path[v]][1]);
        ctx.lineTo(vertexes[path[v + 1]][0], vertexes[path[v + 1]][1]);
    }   
    ctx.moveTo(vertexes[path.at(-1)][0], vertexes[path.at(-1)][1]);
    ctx.lineTo(vertexes[path[0]][0], vertexes[path[0]][1]);
    ctx.stroke(); 
    ctx.closePath();

    drawVertexes();
}
