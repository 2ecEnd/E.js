let nodeDataVisualization = new Map();

// Визуализация дерева решения
function visualizeTree() {
    let visualization = document.getElementById('treeVisualization');
    visualization.innerHTML = '';
    nodeDataVisualization.clear();


    let treeVisualization = d3.select(visualization).style('width', '1000px').style('height', '600px'); 


    // Создаю SVG холст 
    let svg = treeVisualization.append('svg').attr('width', 1000).attr('height', 1000);

    // Функция масштабирования
    let zoomFunction = d3.zoom().scaleExtent([0.5, 5]).on('zoom', (event) => {
        treeElements.attr('transform', event.transform);
    });

    svg.call(zoomFunction);

    // Все элементы дерева помещаю в одну группу
    let treeElements = svg.append('g');



 
    let treePosition = d3.tree().nodeSize([120, 200]).separation(() => 3);

  


    // Преобразую данные в формат иерархический формат для d3
    let treeHierarchy = d3.hierarchy(decisionTree.root, function(node) {

        if (node.type === 'node') {
            return [node.left, node.right]; 
        }
        return []; 
    });

    treePosition(treeHierarchy);

    

    // Рисую линии между узлами
    treeElements.selectAll('.line') 
        .data(treeHierarchy.links()) // Привязываю данные о связях
        .enter() // Для каждого нового элемента
        .append('path') // Создаю SVG-путь 
        .attr('class', 'line')
        .attr('d', d3.linkVertical() 
            .x(d => d.x) 
            .y(d => d.y) 
        );

    

    // Создаю узлы 
    let nodes = treeElements.selectAll('.node') 
        .data(treeHierarchy.descendants()) // Привязываю данные узлов
        .enter() // Для каждого нового узла
        .append('g') // Создаю группу для каждого узла

        .attr('class', 'node')
        .attr('type', d => `${d.data.type}`)

        .attr('transform', d => `translate(${d.x},${d.y})`)

        .each(function(d) {
            // Сохраняю связь между данными и DOM-элементом
            nodeDataVisualization.set(d.data, this);
        });


    

    // Рисую узлы
    nodes.append('rect')
        .attr('width', 150) 
        .attr('height', 50) 
        .attr('x', -75) 
        .attr('y', -25) 
    
    

    // Текст узла
    nodes.append('text')
        .attr('dy', 4) 
        .attr('text-anchor', 'middle') 
        .style('font-size', '14px') 
        .text(d => {

            if (d.data.type === 'leaf') {

                return `${d.data.value}`;
            }

            else {
                if (!isNaN(d.data.value)) {
                    return `${d.data.attribute} <= ${d.data.value}`;
                }

                else {
                    return `${d.data.attribute} = ${d.data.value}`;
                }
            }

        });
    
}


// Подсветка узлов на пути
function highlightPath(path) {
    d3.selectAll('.node').classed('active', false); // Сбрасываю подсветку
    
    // Подсвечиваю все узлы на пути
    path.forEach(node => {
        let elementHTML = nodeDataVisualization.get(node);
        d3.select(elementHTML).classed('active', true);
    });
}