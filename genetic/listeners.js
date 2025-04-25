canvas.addEventListener('click', function(e)
{
    // Преобразование координат курсора, чтобы точки отрисовывались корректно
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    const currX = (e.clientX - rect.left) * scaleX;
    const currY = (e.clientY - rect.top) * scaleY;

    // Добавлям точку в список точек
    vertexes.push([currX, currY]);

    // Обновляем матрицу смежности
    {
        for(let i = 0; i < adj.length; i++)
        {
            let dist = ((vertexes[i][0] - vertexes.at(-1)[0]) ** 2 + (vertexes[i][1] - vertexes.at(-1)[1]) ** 2) ** 0.5;
            adj[i].push(dist);
        }
        let newRow = [];
        for(let i = 0; i < vertexes.length; i++)
        {
            let dist = ((vertexes[i][0] - vertexes.at(-1)[0]) ** 2 + (vertexes[i][1] - vertexes.at(-1)[1]) ** 2) ** 0.5;
            newRow.push(dist);
        }
        adj.push(newRow);
    }

    // Отрисовка точки в месте клика  
    drawVertexes(false);

    
    if(isWorking)
    {   
        controller.abort();
        setTimeout(() =>
        {
            controller = new AbortController();
            genetic();
        }, 50);
    }
});

let controlButton = document.getElementById('control_button');
controlButton.addEventListener('click', () =>
{
    if (!isWorking)
    {
        // Валидация ввода
        if (isNaN(parseInt(document.getElementById('popilation_size').value)) || 
            isNaN(parseFloat(document.getElementById('mutation_rate').value)) || 
            isNaN(parseInt(document.getElementById('tournament_size').value)) || 
            isNaN(parseInt(document.getElementById('update_rate').value)) || 
            isNaN(parseInt(document.getElementById('stagnation_treshold').value)))
            {
                showError("Неккоректный ввод данных! Пожалуйста, введите числа!");
                return;
            }

        controlButton.textContent = "ОСТАНОВИТЬ";

        controller = new AbortController();
        isWorking = true;
    
        // Берём пользовательские значения констант алгоритма
        {
            POPULATION_SIZE     = parseInt(document.getElementById('popilation_size').value);
            MUTATION_RATE       = parseFloat(document.getElementById('mutation_rate').value);
            TOURNAMENT_SIZE     = parseInt(document.getElementById('tournament_size').value);
            UPDATE_RATE         = parseInt(document.getElementById('update_rate').value);
            STAGNATION_TRESHOLD = parseInt(document.getElementById('stagnation_treshold').value);
        }
    
        genetic(); 
    }
    else
    {
        controlButton.textContent = "НАЧАТЬ";
        controller.abort();
        isWorking = false;
    }
});

document.getElementById('clear_button').addEventListener('click', () =>
{
    controlButton.textContent = "НАЧАТЬ";
    controller.abort();
    isWorking = false;

    // Подчищаем за собой
    clearCanvas();
    vertexes = [];
    adj = [];
    console.clear();
});