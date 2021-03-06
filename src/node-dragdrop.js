import { select, event, linkHorizontal, drag } from "d3";
import "./index.css";

let lineShape;
let nodes;
let data;
let deltaX, deltaY;
let svg = select("svg")
  .attr("width", 1200)
  .attr("height", 1000);

const dragHandler = drag()
  .on("start", function() {
    var cord = this.getCTM();
    deltaX = cord.e - event.x;
    deltaY = cord.f - event.y;
  })
  .on("drag", function(n) {
    lineShape = null;
    // Move the node:
    select(this).attr(
      "transform",
      d =>
        "translate(" +
        (d.x = event.x + deltaX) +
        "," +
        (d.y = event.y + deltaY) +
        ")"
    );

    // Move the link:
    svg
      .selectAll(".links")
      .filter(l => l.source == n.id || l.target == n.id)
      .attr("d", pathString);
  });

const connector = {
  link: {},

  gcMouseEvent: function() {
    if (lineShape) {
      lineShape.remove();
    }
    connector.link = {};
    svg.on("mousemove", null);
    return;
  },

  mousedown: function(node, d) {
    if (!node) {
      connector.gcMouseEvent();
      return;
    }
    connector.link.source = d.id;
    var m = [event.pageX, event.pageY];
    lineShape = svg
      .append("line")
      .attr("class", "connector_bg")
      .attr("x1", m[0])
      .attr("y1", m[1])
      .attr("x2", m[0])
      .attr("y2", m[1]);

    svg.on("mousemove", connector.mousemove);
  },

  mousemove: function() {
    var m = [event.pageX, event.pageY];
    if (lineShape) {
      lineShape.attr("x2", m[0]).attr("y2", m[1]);
    }
  },

  mouseup: function(node, d) {
    if (!node) {
      connector.gcMouseEvent();
      return;
    }
    connector.link.target = d.id;
    if (
      connector.link.source &&
      connector.link.target &&
      connector.link.source !== connector.link.target
    ) {
      data.links = [...data.links, { ...connector.link, id: Math.random() }];
      renderLinks(data.links);
    }
    connector.gcMouseEvent();
  }
};

function createPathMarker() {
  var pathMarker = svg
    .append("marker")
    .attr("id", "pathMarkerHead")
    .attr("orient", "auto")
    .attr("markerWidth", "8")
    .attr("markerHeight", "12")
    .attr("refX", "7")
    .attr("refY", "2");

  pathMarker
    .append("path")
    .attr("d", "M0,0 V4 L7,2 Z")
    .attr("stroke-width", "1px")
    .attr("fill", "navy");
}

function renderNodes(_nodes) {
  nodes = svg
    .selectAll(".node")
    .data(_nodes)
    .enter()
    .append("g")
    .attr("id", d => d.id)
    .attr("class", "node")
    .on("dblclick", function(d) {
      nodes.on(".drag", null);
    })
    .call(dragHandler);

  let leftNodes = nodes.filter(d => d.left);

  let rightNodes = nodes.filter(d => !d.left);

  leftNodes
    .attr(
      "transform",
      (d, i) => "translate(" + 200 + "," + (300 * i + 100) + ")"
    )
    .append("rect")
    .attr("width", 50)
    .attr("height", 50);

  rightNodes
    .attr(
      "transform",
      (d, i) => "translate(" + 500 + "," + (300 * i + 100) + ")"
    )
    .append("rect")
    .attr("width", 50)
    .attr("height", 50);

  nodes
    .on("mousedown", function(d) {
      connector.mousedown("node", d);
    })
    .on("mouseup", function(d) {
      connector.mouseup("node", d);
    });
}

function pathString(l) {
  let nsid = data.nodes.filter(n => n.id == l.source)[0].id;
  let ndid = data.nodes.filter(n => n.id == l.target)[0].id;

  let source = select("#" + nsid);
  let dest = select("#" + ndid);

  let sCord = source.node().getBoundingClientRect();
  let dCord = dest.node().getBoundingClientRect();

  let sCTM = source.node().getCTM();
  let dCTML = dest.node().getCTM();

  let sData = source.datum();
  let dData = dest.datum();

  var lineFunction = linkHorizontal()
    .x(d => d.x)
    .y(d => d.y);

  sCord = {
    x: sCTM.e + (sData.left ? sCord.width : 0),
    y: sCTM.f + sCord.height / 2
  };

  dCord = {
    x: dCTML.e + (dData.left ? dCord.width : 0),
    y: dCTML.f + dCord.height / 2
  };

  return lineFunction({
    source: { x: sCord.x, y: sCord.y },
    target: { x: dCord.x, y: dCord.y }
  });
}

function renderLinks(links) {
  createPathMarker();

  svg
    .selectAll(".links")
    .data(links)
    .enter()
    .append("path")
    .attr("d", pathString)
    .attr("id", d => d.id)
    .attr("class", "links")
    .attr("stroke-width", "1.5px")
    .attr("marker-end", "url(#pathMarkerHead)")
    .on("mouseenter", function() {
      select(this).attr("stroke-width", "3px");
    })
    .on("mouseleave", function() {
      select(this).attr("stroke-width", "1.5px");
    })
    .on("click", function(d) {
      select(this).remove();
      data.links = data.links.filter(l => l.id !== d.id);
      renderLinks(data.links);
    });
}

export default function renderChat(_data) {
  data = _data;
  svg.on("mouseup", connector.mouseup).on("click", function() {
    nodes.call(dragHandler);
  });
  renderNodes(data.nodes);
  renderLinks(data.links);
}
