function createGraph(graphData) {
  const { nodes, links } = graphData;
  const width = 1500;
  const height = 900;

  const svg = d3
    .select("#network-visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Create links
  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", 1)
    .attr("stroke", "#999");

  // // Create nodes
  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 6)
    .attr("fill", (d) => {
      switch (d.type) {
        case "gene":
          return "red"; // Color for genes
        case "molecule":
          return "blue"; // Color for molecules
        case "proteinClass":
          return "green"; // Color for protein classifications
        default:
          return "gray"; // Default color
      }
    })
    .call(drag(simulation));

  node.append("title").text((d) => d.id);

  // Update positions
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  const legendData = [
    { color: "red", description: "Gene" },
    { color: "blue", description: "Molecule" },
    { color: "green", description: "Protein Class" },
  ];

  // Append a 'g' element for the legend
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 200) + ", 40)"); // Adjust the position as needed

  // Draw legend rectangles
  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25) // Offset each legend item vertically
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", (d) => d.color);

  // Draw legend text
  legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 25 + 7.5) // Position text in the middle of the rectangles
    .attr("alignment-baseline", "middle") // Center-align the text vertically
    .attr("text-anchor", "start") // Ensure text starts right after the rectangle
    .text((d) => d.description);
}

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

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
