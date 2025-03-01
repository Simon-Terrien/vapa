// Script for WebView visualization
(function() {
    // Get VS Code webview API
    const vscode = acquireVsCodeApi();
    
    // Initialize visualization state
    let state = {
        data: null,
        title: 'Repository Visualization'
    };
    
    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'update':
                updateVisualization(message.data, message.title);
                break;
        }
    });
    
    // Function to update visualization
    function updateVisualization(data, title) {
        state.data = data;
        state.title = title;
        
        // Update the title
        document.getElementById('visualization-title').textContent = title;
        
        // Clear previous visualization
        const container = document.getElementById('visualization-container');
        container.innerHTML = '';
        
        // Determine visualization type based on data
        if (data.type === 'dependencyGraph') {
            renderDependencyGraph(data, container);
        } else if (data.type === 'codeQuality') {
            renderCodeQualityMetrics(data, container);
        } else if (data.type === 'fileDistribution') {
            renderFileDistribution(data, container);
        }
    }
    
    // Render dependency graph visualization
    function renderDependencyGraph(data, container) {
        const width = container.clientWidth;
        const height = 600;
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
            
        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));
            
        // Draw links
        const link = svg.append('g')
            .selectAll('line')
            .data(data.links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.sqrt(d.value));
            
        // Draw nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(data.nodes)
            .enter()
            .append('circle')
            .attr('r', d => 5 + (d.value || 1) * 3)
            .attr('fill', d => d.group ? colorScale(d.group) : '#69b3a2')
            .call(drag(simulation));
            
        // Add node labels
        const label = svg.append('g')
            .selectAll('text')
            .data(data.nodes)
            .enter()
            .append('text')
            .text(d => d.id)
            .attr('font-size', 12)
            .attr('dx', 12)
            .attr('dy', 4);
            
        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
                
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
                
            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
    }
    
    // Render code quality metrics
    function renderCodeQualityMetrics(data, container) {
        const margin = {top: 30, right: 30, bottom: 70, left: 60};
        const width = container.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
            
        // X axis
        const x = d3.scaleBand()
            .range([0, width])
            .domain(data.metrics.map(d => d.name))
            .padding(0.2);
        
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'translate(-10,0)rotate(-45)')
            .style('text-anchor', 'end');
            
        // Y axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(data.metrics, d => d.value) * 1.2])
            .range([height, 0]);
            
        svg.append('g')
            .call(d3.axisLeft(y));
            
        // Bars
        svg.selectAll('rect')
            .data(data.metrics)
            .enter()
            .append('rect')
            .attr('x', d => x(d.name))
            .attr('y', d => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.value))
            .attr('fill', '#69b3a2');
    }
    
    // Render file distribution
    function renderFileDistribution(data, container) {
        const width = container.clientWidth;
        const height = 400;
        const radius = Math.min(width, height) / 2;
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);
            
        // Color scale
        const color = d3.scaleOrdinal()
            .domain(data.files.map(d => d.type))
            .range(d3.schemeCategory10);
            
        // Compute pie layout
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);
            
        const pieData = pie(data.files);
        
        // Arc generator
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius * 0.8);
            
        // Outer arc for labels
        const outerArc = d3.arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);
            
        // Draw pie segments
        svg.selectAll('path')
            .data(pieData)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.type))
            .attr('stroke', 'white')
            .style('stroke-width', '2px');
            
        // Add labels
        svg.selectAll('text')
            .data(pieData)
            .enter()
            .append('text')
            .text(d => `${d.data.type}: ${d.data.count}`)
            .attr('transform', d => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .style('text-anchor', d => {
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return midAngle < Math.PI ? 'start' : 'end';
            });
    }
    
    // Helper function for drag behavior
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
    
    // Color scale for nodes
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Log initialization
    console.log('Visualization WebView initialized');
})();