// D3.js visualization for the mending guide decision tree
// This script expects a global variable `guideTree` and a container with id 'mending-guide-viz'.

function treeifyGuide(node, label = '', path = []) {
  // Recursively convert the guideTree to a d3-friendly structure
  const thisLabel = node.question ? (label || node.question) : label;
  const children = node.options
    ? node.options.map(opt => treeifyGuide(opt.next, opt.label, path.concat(opt.label)))
    : [];
  return {
    name: thisLabel,
    label: label,
    path: path,
    isResult: !!node.result,
    result: node.result,
    children: children
  };
}

function renderMendingGuideTree(guideTree, currentPath) {
  const data = treeifyGuide(guideTree);
  // Responsive width
  const container = document.getElementById('mending-guide-viz');
  const width = Math.min(container.offsetWidth || 350, 700);
  const isMobile = width < 500;
  const dx = isMobile ? 40 : 48;
  const dy = isMobile ? 80 : 180;
  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkVertical().x(d => d.x).y(d => d.y);

  d3.select('#mending-guide-viz').selectAll('*').remove();
  const svg = d3.select('#mending-guide-viz')
    .append('svg')
    .attr('viewBox', [0, 0, width, isMobile ? 400 : 400])
    .style('width', '100%')
    .style('height', isMobile ? '400px' : '400px');

  const root = d3.hierarchy(data);
  tree(root);

  // Center the tree horizontally
  let minX = d3.min(root.descendants(), d => d.x);
  let maxX = d3.max(root.descendants(), d => d.x);
  let xOffset = (width - (maxX - minX)) / 2 - minX;

  // Collapse all except current path
  root.descendants().forEach(d => {
    d._children = d.children;
    if (d.depth > 0 && !isPathActive(d, currentPath)) {
      d.children = null;
    }
  });

  // Draw links
  svg.append('g')
    .attr('fill', 'none')
    .attr('stroke', '#bbb')
    .attr('stroke-width', 2)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', d => {
      // Adjust for horizontal centering
      const source = {x: d.source.x + xOffset, y: d.source.y};
      const target = {x: d.target.x + xOffset, y: d.target.y};
      return diagonal({source, target});
    });

  // Draw nodes
  const node = svg.append('g')
    .selectAll('g')
    .data(root.descendants())
    .join('g')
    .attr('transform', d => `translate(${d.x + xOffset},${d.y})`);

  node.append('circle')
    .attr('r', isMobile ? 14 : 12)
    .attr('fill', d => isPathActive(d, currentPath) ? '#E5C649' : '#0A305C')
    .attr('stroke', d => isPathActive(d, currentPath) ? '#000' : '#88D4F7')
    .attr('stroke-width', 3)
    .style('cursor', d => d.data.isResult ? 'default' : 'pointer')
    .on('click', function(event, d) {
      if (!d.data.isResult && d.data.children.length > 0) {
        d.children = d.children ? null : d._children;
        renderMendingGuideTree(guideTree, d.data.path);
      }
    });

  // Stagger text: alternate left/right for children, center for root
  node.append('text')
    .attr('dy', isMobile ? '0.32em' : '0.32em')
    .attr('x', function(d) {
      if (d.depth === 0) return 0;
      // Alternate left/right
      return d.parent && d.parent.children && d.parent.children.indexOf(d) % 2 === 0
        ? -(isMobile ? 60 : 90)
        : (isMobile ? 60 : 90);
    })
    .attr('text-anchor', function(d) {
      if (d.depth === 0) return 'middle';
      return d.parent && d.parent.children && d.parent.children.indexOf(d) % 2 === 0 ? 'end' : 'start';
    })
    .text(d => d.data.label || d.data.name)
    .attr('fill', d => isPathActive(d, currentPath) ? '#000' : '#88D4F7')
    .style('font-weight', d => isPathActive(d, currentPath) ? 'bold' : 'normal')
    .style('font-size', isMobile ? '0.95rem' : '1rem')
    .style('cursor', d => d.data.isResult ? 'default' : 'pointer')
    .on('click', function(event, d) {
      if (!d.data.isResult && d.data.children.length > 0) {
        d.children = d.children ? null : d._children;
        renderMendingGuideTree(guideTree, d.data.path);
      }
    });
}

function isPathActive(d, currentPath) {
  if (!currentPath || currentPath.length === 0) return d.depth === 0;
  return d.data.path.slice(0, currentPath.length).join('|') === currentPath.join('|');
}

// Expose for use in HTML
window.renderMendingGuideTree = renderMendingGuideTree;
