let inputCanvas = document.getElementById('inputCanvas');
let inputCtx = inputCanvas.getContext('2d');
inputCanvas.width = 500;
inputCanvas.height = 500;

let clusterButton = document.getElementById('clusterButton');
let clearButton = document.getElementById('clearButton');
let clusterInfo = document.getElementById('clusterInfo');
let kInput = document.getElementById('kInput');

let kmeansButton = document.getElementById('kmeansButton');
let kmeansPlusPlusButton = document.getElementById('kmeansPlusPlusButton');
let hierarchicalButton = document.getElementById('hierarchicalButton');
let euclideanButton = document.getElementById('euclideanButton');
let manhattanButton = document.getElementById('manhattanButton');
let chebyshevButton = document.getElementById('chebyshevButton');

let inputPoints = [];
let colours = [];
let selectedAlgorithm = 'kmeans';
let selectedMetric = 'euclidean';



// Генерация цветов по цветовому кругу HSL
function generateColors(k) {
    colours = [];
    const hueStep = 360 / k;
    for (let i = 0; i < k; i++) {
        colours.push(`hsl(${i * hueStep}, 70%, 60%)`);
    }
}

// Рисование точек
function draw(points, centers = []) {
    inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);

    points.forEach(point => {
        inputCtx.beginPath();
        inputCtx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        inputCtx.fillStyle = point.cluster !== undefined ? colours[point.cluster] : 'black';
        inputCtx.fill();
    });

    centers.forEach(center => {
        inputCtx.beginPath();
        inputCtx.arc(center.x, center.y, 5, 0, Math.PI * 2);
        inputCtx.fillStyle = colours[center.cluster];
        inputCtx.fill();
        inputCtx.lineWidth = 2;
        inputCtx.strokeStyle = 'black';
        inputCtx.stroke();
    });

}

// Обработчик клика по canvas
inputCanvas.addEventListener('click', (event) => {
    let rect = inputCanvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let cluster = undefined;
    
    inputPoints.push({ x, y, cluster });
    draw(inputPoints);
});


// Евклидово расстояние
function euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Манхэттенское расстояние
function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Расстояние Чебышёва
function chebyshevDistance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}


//Реализация k-means
function kMeans(k, distanceFunction) {
    let resultPoints = JSON.parse(JSON.stringify(inputPoints));
    
    // Выбираю центроиды случайным образом
    let centers = [];
    for (let i = 0; i < k; i++) {
        let randomIndex = Math.floor(Math.random() * resultPoints.length);
        centers.push({
            x: resultPoints[randomIndex].x,
            y: resultPoints[randomIndex].y
        });
    }
    
    let clusters = centers.map(center => ({
        points: [],
        center: {x: center.x, y: center.y}
    }));
    
    // Основной цикл
    let changed = true;
    
    while (changed) {
        changed = false;
        
        // Назначаю точки ближайшим центроидам
        for (let point of resultPoints) {
            let minDistance = Infinity;
            let newCluster = -1;
            
            for (let i = 0; i < clusters.length; i++) {
                let distance = distanceFunction(point, clusters[i].center);
                if (distance < minDistance) {
                    minDistance = distance;
                    newCluster = i;
                }
            }
            
            if (point.cluster !== newCluster) {
                point.cluster = newCluster;
                clusters[newCluster].points.push(point);
                changed = true;
            }
        }


        // Пересчитываю центроиды
        // Каждый центроид перемещается в среднюю точку всех точек, принадлежащих его кластеру
        
        for (let cluster of clusters) {
            let sumX = 0;
            let sumY = 0;
            cluster.points.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            })

            cluster.center.x = sumX / cluster.points.length;
            cluster.center.y = sumY / cluster.points.length;
        }
        
    }
    
    // Назначаем кластеры точкам
    let resultCenters = [];

    clusters.forEach((cluster, clusterIndex) => {
        let center = {
            x: cluster.center.x,
            y: cluster.center.y,
            cluster: clusterIndex
        }

        resultCenters.push(center);
    });

    
    let resultClusters = {
        points: resultPoints,
        centers: resultCenters
    }

    return resultClusters;
}



// Реализация k-means++
function kmeansPlusPlus(k, distanceFunction) {
    let resultPoints = JSON.parse(JSON.stringify(inputPoints));

    let centers = [];
    
    // Выбираю первый центроид случайно
    let firstIndex = Math.floor(Math.random() * resultPoints.length);
    centers.push({x: resultPoints[firstIndex].x, y: resultPoints[firstIndex].y});
    
    // Выбираем остальные центроиды
    for (let i = 1; i < k; i++) {
        let distances = [];
        let totalSum = 0;
        
        // Вычисляю значение квадрата расстояния до ближайшего центроида для каждой точки
        for (let point of resultPoints) {
            let minDistance = Infinity;
            for (let center of centers) {
                let distance = distanceFunction(point, center);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            distances.push(minDistance * minDistance); 
            totalSum += minDistance * minDistance;
        }
        
        // Выбираю следующий центроид с вероятностью пропорциональной квадрату расстояния
        let rand = Math.random() * totalSum;
        let sum = 0;
        let selectedIndex = 0;
        
        for (let j = 0; j < distances.length; j++) {
            sum += distances[j];
            if (sum > rand) {
                selectedIndex = j;
                break;
            }
        }
        
        centers.push({x: resultPoints[selectedIndex].x, y: resultPoints[selectedIndex].y});
    }

    let clusters = centers.map(center => ({
        points: [],
        center: {x: center.x, y: center.y}
    }));
    
    // Основной цикл k-means
    let changed = true;
    
    while (changed) {
        changed = false;
        
        // Назначаю точки ближайшим центроидам
        for (let point of resultPoints) {
            let minDistance = Infinity;
            let newCluster = -1;
            
            for (let i = 0; i < clusters.length; i++) {
                let distance = distanceFunction(point, clusters[i].center);
                if (distance < minDistance) {
                    minDistance = distance;
                    newCluster = i;
                }
            }
            
            if (point.cluster !== newCluster) {
                point.cluster = newCluster;
                clusters[newCluster].points.push(point);
                changed = true;
            }
        }


        // Пересчитываю центроиды
        // Каждый центроид перемещается в среднюю точку всех точек, принадлежащих его кластеру

        for (let cluster of clusters) {
            let sumX = 0;
            let sumY = 0;
            cluster.points.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            })

            cluster.center.x = sumX / cluster.points.length;
            cluster.center.y = sumY / cluster.points.length;
        }
        
    }
    
    // Назначаем кластеры точкам
    let resultCenters = [];

    clusters.forEach((cluster, clusterIndex) => {
        let center = {
            x: cluster.center.x,
            y: cluster.center.y,
            cluster: clusterIndex
        }

        resultCenters.push(center);
    });

    
    let resultClusters = {
        points: resultPoints,
        centers: resultCenters
    }

    return resultClusters;
}


// Реализация иерархической кластеризации
function hierarchicalClustering(k, distanceFunction) {
    let clusters = inputPoints.map(point => ({
        points: [point],
        center: {x: point.x, y: point.y}
    }));
    
    while (clusters.length > k) {
        let minDistance = Infinity;
        let cluster1 = -1, cluster2 = -1;
        
        // Находим два ближайших кластера
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                let distance = distanceFunction(clusters[i].center, clusters[j].center);
                if (distance < minDistance) {
                    minDistance = distance;
                    cluster1 = i;
                    cluster2 = j;
                }
            }
        }
        
        if (cluster1 !== -1 && cluster2 !== -1) {
            // Объединяем кластеры
            let mergedPoints = [...clusters[cluster1].points, ...clusters[cluster2].points];
            
            // Вычисляем новый центроид (средняя точка всех точек)
            let sumX = 0, sumY = 0;
            mergedPoints.forEach(point => {
                sumX += point.x;
                sumY += point.y;
            });
            
            let mergedcenter = {
                x: sumX / mergedPoints.length,
                y: sumY / mergedPoints.length
            };
            
            // Удаляем старые кластеры и добавляем объединенный
            clusters.splice(cluster2, 1);
            clusters.splice(cluster1, 1);
            clusters.push({
                points: mergedPoints,
                center: mergedcenter
            });
        }
    }
    
    // Назначаем кластеры точкам
    let resultPoints = JSON.parse(JSON.stringify(inputPoints));
    let resultCenters = [];

    clusters.forEach((cluster, clusterIndex) => {
        cluster.points.forEach(clusterPoint => {
            resultPoints.forEach(point => {
                if (point.x === clusterPoint.x && point.y === clusterPoint.y) {
                    point.cluster = clusterIndex;
                }
            })
        });
        let center = {
            x: cluster.center.x,
            y: cluster.center.y,
            cluster: clusterIndex
        }

        resultCenters.push(center);
    });

    let resultClusters = {
        points: resultPoints,
        centers: resultCenters
    }

    return resultClusters;
}

function performClustering() {
    let k = parseInt(kInput.value);

    if (isNaN(k) || k < 1 || k > 10) {
        clusterInfo.textContent = "Введите число кластеров от 1 до 10";
        return;
    }
    
    if (inputPoints.length < k) {
        clusterInfo.textContent = `Нужно как минимум ${k} точек для кластеризации`;
        return;
    }
    
    generateColors(k);
    let distanceFunction = getDistanceFunction();

    let result;
    if (selectedAlgorithm === 'kmeans') {
        result = kMeans(k, distanceFunction);
    }

    else if (selectedAlgorithm === 'kmeansPlusPlus') {
        result = kmeansPlusPlus(k, distanceFunction);
    }

    else if (selectedAlgorithm === 'hierarchical') {
        result = hierarchicalClustering(k, distanceFunction);
    }
    
    draw(result.points, result.centers);
    clusterInfo.textContent = `Кластеризация выполнена (${selectedAlgorithm}, ${selectedMetric}) с ${k} кластерами`;
}

function clearAll() {
    inputPoints = [];
    draw(inputPoints);
    clusterInfo.textContent = 'Поставьте точки на плоскости для кластеризации';
}


function getDistanceFunction() {
    if (selectedMetric === 'euclidean') {
        return euclideanDistance;
    }

    else if (selectedMetric === 'manhattan') {
        return manhattanDistance;
    }

    else if (selectedMetric === 'chebyshev') {
        return chebyshevDistance;
    }

}

// Обработчики кнопок
kmeansButton.addEventListener('click', () => {
    selectedAlgorithm = 'kmeans';
    kmeansButton.classList.add('active');
    kmeansPlusPlusButton.classList.remove('active');
    hierarchicalButton.classList.remove('active');
});

kmeansPlusPlusButton.addEventListener('click', () => {
    selectedAlgorithm = 'kmeansPlusPlus';
    kmeansPlusPlusButton.classList.add('active');
    kmeansButton.classList.remove('active');
    hierarchicalButton.classList.remove('active');
});

hierarchicalButton.addEventListener('click', () => {
    selectedAlgorithm = 'hierarchical';
    hierarchicalButton.classList.add('active');
    kmeansButton.classList.remove('active');
    kmeansPlusPlusButton.classList.remove('active');
});

euclideanButton.addEventListener('click', () => {
    selectedMetric = 'euclidean';
    euclideanButton.classList.add('active');
    manhattanButton.classList.remove('active');
    chebyshevButton.classList.remove('active');
});

manhattanButton.addEventListener('click', () => {
    selectedMetric = 'manhattan';
    manhattanButton.classList.add('active');
    euclideanButton.classList.remove('active');
    chebyshevButton.classList.remove('active');
});

chebyshevButton.addEventListener('click', () => {
    selectedMetric = 'chebyshev';
    chebyshevButton.classList.add('active');
    euclideanButton.classList.remove('active');
    manhattanButton.classList.remove('active');
});

clusterButton.addEventListener('click', performClustering);
clearButton.addEventListener('click', clearAll);