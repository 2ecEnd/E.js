const controlButton = document.getElementById('control_button');
const clearButton = document.getElementById('clear_button');
const updateRateSlider = document.getElementById('update_rate');

canvas.addEventListener('click', async function(e)
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
            antAlgorithm();
        }, 50);
    }
});

controlButton.addEventListener('click', () =>
{
    if (adj.length < 2)
        return

    if (!isWorking)
    {
        // Валидация ввода
        if (isNaN(parseInt(document.getElementById('alpha').value)) || 
            isNaN(parseInt(document.getElementById('beta').value)) || 
            isNaN(parseInt(document.getElementById('q').value)) || 
            isNaN(parseFloat(document.getElementById('evaporation').value)) || 
            isNaN(parseInt(document.getElementById('update_rate').value)) || 
            isNaN(parseInt(document.getElementById('stagnation_treshold').value)))
            {
                showError("Неккоректный ввод данных! Пожалуйста, введите числа!");
                return;
            }

        controlButton.textContent = "ОСТАНОВИТЬ";
    
        // Берём пользовательские значения констант алгоритма
        {
            ALPHA               = parseInt(document.getElementById('alpha').value);
            BETA                = parseInt(document.getElementById('beta').value);
            Q                   = parseInt(document.getElementById('q').value);
            EVAPORATION         = parseFloat(document.getElementById('evaporation').value);
            BASE_EVAPORATION    = parseFloat(document.getElementById('evaporation').value);
            UPDATE_RATE         = parseInt(document.getElementById('update_rate').value);
            STAGNATION_TRESHOLD = parseInt(document.getElementById('stagnation_treshold').value);
        }

        antAlgorithm(); 
    }
    else
    {
        controlButton.textContent = "НАЧАТЬ";
        controller.abort();
        isWorking = false;
    }
});

clearButton.addEventListener('click', () =>
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

updateRateSlider.addEventListener('input', () =>
{
    UPDATE_RATE = parseInt(updateRateSlider.value);
});