function checkLoginStatus() {
    const jwtCookie = localStorage.getItem("jwt");
    if (!jwtCookie) {
      window.location.href = "index.html";
    }
  }
  document.addEventListener("DOMContentLoaded", checkLoginStatus);

function logout() {
    localStorage.removeItem("jwt");
    window.location.href = "index.html";
  } 


const fetchData = async (query) => {
  const jwt = localStorage.getItem("jwt");

  const graphqlEndpoint = "https://01.kood.tech/api/graphql-engine/v1/graphql";
  try {
    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ query: query })
    });

    const data = await response.json();
    return data;
} catch (error) {
    console.error("Error:", error);
    throw error;
}
};

async function getId(){
  const resultElement = document.getElementById("result");
  let value = 0;
  query = `{user {id login}}`;
  try {
    const data = await fetchData(query);
    value = data.data.user[0].id;
    resultElement.innerHTML = `Hello ${data.data.user[0].login}<br>ID:${value}`;
    return value; 
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

async function getAudits(){
  const auditratio = document.getElementById("ratio");
  let id = 0;
  let up = 0;
  let down = 0;
  try {
    id = await getId();
  } catch (error) {
    console.error("Error:", error);
  }
  query = `{transaction(where: {userId: {_eq: ${id}}, type: {_neq: "xp"}, path: {_regex: "div-01"}}) {amount type}}`
  try {   
    const data = await fetchData(query);
    data.data.transaction.forEach(transaction => {
      if (transaction.type === "up") {
        up += transaction.amount;
      }
      if (transaction.type === "down") {
        down += transaction.amount;
      }
    });
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
  auditratio.textContent = (Math.round((up/down)*10) / 10);
  drawAudit(up,down);
}

async function getGraph(type){
  let total_xp = 0;
  let dateXP = [];
  let id = 0;
  try {
    id = await getId();
  } catch (error) {
    console.error("Error:", error);
  }
  query = `{transaction(where:{userId: {_eq: ${id}},type: {_eq: "xp"},},order_by: {createdAt: asc},){amount path createdAt type}}`
  try {   
    const data = await fetchData(query);
    data.data.transaction.forEach(transaction => {
      if (type === "piscine-go") {
        if (transaction.path.includes(type)) {
          total_xp += transaction.amount;
          dateXP.push({date: transaction.createdAt, score: total_xp, path: transaction.path})
        }
    }
    if (type === "piscine-js") {
      if (transaction.path.includes(type) && transaction.path != "/johvi/div-01/piscine-js-old") {
        total_xp += transaction.amount;
          dateXP.push({date: transaction.createdAt, score: total_xp, path: transaction.path})
      }
    }
    if (type === "div-01") {
      if (transaction.path.replace(/[^/]/g, "").length === 3 && (transaction.path.includes("piscine-go") == false)) {
        if (transaction.amount >= 5000) {
          total_xp += transaction.amount;
            dateXP.push({date: transaction.createdAt, score: total_xp, path: transaction.path})
        }
      }
    }
    });
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
  console.log(dateXP);
  drawGraph(dateXP);
}





 function drawAudit(up,down){
    const svgContainer = document.getElementById("svg-container");
    let valup = 0;
    let valdown = 0;
    let upmb = Math.round(up/1000000*100) / 100;
    let downmb = Math.round(down/1000000*100) / 100; 
  if (valup >= valdown) {
    valup = 200;
    valdown = (downmb / upmb) * 200;
  }
  if (valup < valdown) {
    valdown = 200;
    valup = (upmb / downmb) * 200;
  }

    const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect1.setAttribute("x", 150);
    rect1.setAttribute("y", 10);
    rect1.setAttribute("width", valup);
    rect1.setAttribute("height", 50);
    rect1.setAttribute("fill", "green");
    svgContainer.appendChild(rect1);

    const text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text1.setAttribute("x", 10);
    text1.setAttribute("y", 30);
    text1.setAttribute("fill", "white");
    text1.textContent = `Done: ${upmb} MB`;
    svgContainer.appendChild(text1);

    const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect2.setAttribute("x", 150);
    rect2.setAttribute("y", 70);
    rect2.setAttribute("width", valdown);
    rect2.setAttribute("height", 50);
    rect2.setAttribute("fill", "red");
    svgContainer.appendChild(rect2);

    const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text2.setAttribute("x", 10);
    text2.setAttribute("y", 95);
    text2.setAttribute("fill", "white");
    text2.textContent = `Received: ${downmb} MB`;
    svgContainer.appendChild(text2);
} 

function drawGraph(data) {
  const graphContainer = document.getElementById("graph-container");
  while (graphContainer.firstChild) {
    graphContainer.removeChild(graphContainer.firstChild);
  }
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 100 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const graph = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


  // Create scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.date)))
    .range([0, graphWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.score)])
    .range([graphHeight, 0]);

  const xAxis = d3.axisBottom(xScale);
  graph.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${graphHeight})`)
    .call(xAxis);

  const yAxis = d3.axisLeft(yScale);
  graph.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // Create line generator
  const line = d3.line()
    .x(d => xScale(new Date(d.date)))
    .y(d => yScale(d.score));

  // Append the line path to the graph
  graph.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

  // Append circles for data points
  graph.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(new Date(d.date)))
    .attr("cy", d => yScale(d.score))
    .attr("r", 5);
}

window.onload = getId();
window.onload = getAudits();