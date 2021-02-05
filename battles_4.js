'use strict';

console.log("Console is working");

(function () {
    $(document).ready(function () {
        tableau.extensions.initializeAsync().then(function () {
            //var currentSheetName = "Sheet 1";
            //var currentSheet = getSheetByName(currentSheetName);
            //console.log("current sheet: ", currentSheet);
            
            //$('#reset_filters_button').click(resetFilters);
            //loadSelectedMarks(currentSheet);


            var currentSheetName = "Sheet 2";
            var currentSheet = getSheetByName(currentSheetName);
            //console.log("current sheet: ", currentSheet);

            discuss(currentSheet)

        })
    }, function (err) {
        // Something went wrong in initialization.
        console.log('Error while Initializing: ' + err.toString());
    });

    let unregisterEventHandlerFunction;

    function discuss(worksheet){
        console.log("discussing: ", worksheet.name)
        // Remove any existing event listeners
        if (unregisterEventHandlerFunction) {
            unregisterEventHandlerFunction();
        }
        // Set our title to an appropriate value
        $('#selected_marks_title').text('Sheet 1');
        d3.select("#filter").remove();
        worksheet.getSelectedMarksAsync().then(function(marks) {
            console.log("marks: ", marks);
            const worksheetData = marks.data[0];
            console.log(worksheetData)
            const rows = worksheetData.data.map(function(row, index) {
                const rowData = row.map(function(cell) {
                    return cell.formattedValue;
                });
                return rowData;
            });
            console.log("rows: ", rows);
            console.log("rows[0][1]: ", rows[0][1]);

            filterByField("Attacker King",  [rows[0][1]]);
            loadSelectedMarks(getSheetByName("Sheet 1"));


            //return ;
            
            // get columns
            const columns = worksheetData.columns.map(function(column) {
                //return {
                //    title: column.fieldName
                //};
                return column.fieldName;
            });
            console.log("columns: ", columns);
        })
        unregisterEventHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, function(selectionEvent) {
            // When the selection changes, reload the data
            discuss(worksheet);
        });
    }

    function getSheetByName(name){
        return tableau.extensions.dashboardContent.dashboard.worksheets.find(function(sheet) {
            return sheet.name === name;
        });
    }


    function loadSelectedMarks(worksheet){
        // Remove any existing event listeners
        if (unregisterEventHandlerFunction) {
            unregisterEventHandlerFunction();
        }
        // Set our title to an appropriate value
        $('#selected_marks_title').text(worksheet.name);
        // Call to get the selected marks for our sheet
        worksheet.getSelectedMarksAsync().then(function(marks) {
            const worksheetData = marks.data[0];

            //console.log("workseetData", worksheetData)
            //console.log("worksheetData.length", worksheetData.length)

            // get rows
            const rows = worksheetData.data.map(function(row, index) {
                const rowData = row.map(function(cell) {
                    return cell.formattedValue;
                });
                return rowData;
            });
            //console.log("rows")
            //return ;
            
            // get columns
            const columns = worksheetData.columns.map(function(column) {
                //return {
                //    title: column.fieldName
                //};
                return column.fieldName;
            });

            //console.log("columns", columns);
            //console.log(columns[1], columns[2], columns[3]);
            if(rows.length != 0){
                //console.log("rows.length: ", rows.length);
                d3.select("#message").text("");
                convertToNetworkData(rows, 1, 2, 3);
            } else{
                d3.select("svg").remove();
                console.log("rows.length: ", rows.length);
                d3.select("#message").text("No marks selected");
            }

        });
        unregisterEventHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, function(selectionEvent) {
            // When the selection changes, reload the data
            loadSelectedMarks(worksheet);
        });
    }

    function convertToNetworkData(rows, source_ind, target_ind, group_ind){
        //console.log("rows:", rows);
        //console.log("columns", columns);

        var data = { "nodes":[] , "links":[] };
        // nodes = [ { "id":  , "group": }, ...]
        // links = [ {"source": , "target": , "value"}]

        // create nodes:
        // add all the sources to nodes
        // add all the sinks to nodes
        data.nodes = getNodesList(rows, source_ind, target_ind, group_ind);
        data.links = getLinksList(rows, source_ind, target_ind, group_ind) ;
        createNetwork(data);

    }

    function createNetwork(data){
        //https://bl.ocks.org/puzzler10/4efcb280a23c2f9b824879771ae41592
        //https://bl.ocks.org/heybignick/3faf257bbbbc7743bb72310d03b86ee8
        //http://bl.ocks.org/fancellu/2c782394602a93921faff74e594d1bb1
        //https://observablehq.com/@musixnotmusic/force-directed-graph-network-graph-with-arrowheads-and-lab
        //https://bl.ocks.org/mattkohl/146d301c0fc20d89d85880df537de7b0#index.html
        //https://observablehq.com/@d3/mobile-patent-suits



        //console.log("data: ", data);

        d3.select("svg").remove();
        
        var width = 750, height = 350;

        var svg = d3.select("#my_network")
        .append("svg")
        .style("border", "solid grey")
        .attr("width", width)
        .attr("height", height);

        //console.log("data.nodes: ", data.nodes);
        //console.log("data.links: ", data.links);

        var simulation = d3.forceSimulation()
        .nodes(data.nodes);
        
        simulation
        .force("charge_force", d3.forceManyBody())
        .force("center_force", d3.forceCenter(width / 2, height / 2));

        svg.append('defs').append('marker')
        .attrs({'id':'arrowhead',
            'viewBox':'-0 -5 10 10',
            'refX':13,
            'refY':0,
            'orient':'auto',
            'markerWidth': 5,
            'markerHeight': 5,
            'xoverflow':'visible'})
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke','none');
        
        var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter()
        .append("g");

        var color = d3.scaleOrdinal(d3.schemeCategory20);

        var circles = node.append("circle")
        .on("click", function(d) {handlefilterClick(d.id);})
        .attr("r", 7.5)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        //.on("click", function() {console.log("clicked"); })
        //.on("mouseover", function(){ console.log("*")})
        //.attr("fill", "red")
        .attr("fill", function(d) { return color(d.id); })
        .attr("stroke", "grey")
        .attr("stroke-width", "1.5px");

        var lables = node.append("text")
        .text(function(d) {
          return d.id;
        })
        .attr('x', 6)
        .attr('y', 3);
  
        node.append("title")
        .text(function(d) { return d.id; });

        simulation.on("tick", tickActions );
        
        var link_force =  d3.forceLink(data.links)
        .id(function(d) {return d.id; }).distance(200).strength(1);

        node.append("title").text(function(d) { return d.id; });

        simulation.force("links", link_force);

        //console.log("data.links: ", data.links)

        var link = svg
        //.append("g")
        //.attr("class", "links")
        .selectAll(".links")
        .data(data.links)
        //.enter().append("line") //straight edges
        .enter().append("path") //straight edges
        .attr("class", "links")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "#999")
        .attr("stroke-opacity", "0.6")
        .attr('marker-end','url(#arrowhead)')
        .on("click", function(d) {filterByEdge("Name", [d.name]); });

        link.append("title")
        .text(function (d) {return d.name;});

        var edgepaths = svg.selectAll(".edgepath")
        .data(data.links)
        .enter()
        .append('path')
        .attrs({
            'class': 'edgepath',
            'fill-opacity': 0,
            'stroke-opacity': 0,
            'id': function (d, i) {return 'edgepath' + i}
        })
        .style("pointer-events", "none");

        var edgelabels = svg.selectAll(".edgelabel")
        .data(data.links)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attrs({
            'class': 'edgelabel',
            'id': function (d, i) {return 'edgelabel' + i},
            'font-size': 12,
            //'fill': '#aaa'
            'fill': 'black'
        });

        
        edgelabels.append('textPath')
        .attr('xlink:href', function (d, i) {return '#edgepath' + i})
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("startOffset", "50%")
        .text(function (d) {return d.name});
        
        function tickActions() {
            //update circle positions each tick of the simulation 
            node
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            
            edgepaths.attr("d", positionLink);
            //edgepaths.attr('d', function (d) {
            //    return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
            //});

            //node
            //    .attr("cx", function(d) { return d.x; })
            //    .attr("cy", function(d) { return d.y; });
                
            //update link positions 
            //simply tells one end of the line to follow one node around
            //and the other end of the line to follow the other node around
            //link
            //    .attr("x1", function(d) { return d.source.x; })
            //    .attr("y1", function(d) { return d.source.y; })
            //    .attr("x2", function(d) { return d.target.x; })
            //    .attr("y2", function(d) { return d.target.y; });

            link.attr("d", positionLink);
        }

        function dragstarted(d) {
            console.log("dragstarted(d)");
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          }
          
          function dragged(d) {
            console.log("dragged(d)");
            d.fx = d3.event.x;
            d.fy = d3.event.y;
          }
          
          function dragended(d) {
            console.log("dragended(d)")
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }

          function handlefilterClick(domain){
              console.log("clicked");
              //console.log("domain: ", domain);
              if(document.getElementById("attackerKing").checked == true){
                filterByField("Attacker King",  [domain]);
              } else{
                filterByField("Defender King",  [domain]);
              }
              //filterByField(["Attacker King", "Defender King"]);
          }
    }
    
    function filterByField(fieldName, domain){
        const worksheet = getSheetByName("Sheet 1");
        //worksheet.applyFilterAsync(fieldName, domain, tableau.FilterUpdateType.Replace);
        //worksheet.applyFilterAsync("Defender King", domain, tableau.FilterUpdateType.Replace);

        //https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_filtering.htm
        //https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#filterupdatetype_enum

        //worksheet.applyFilterAsync("Defender King", domain, tableau.FilterUpdateType.Add);
        worksheet.applyFilterAsync(fieldName, domain, tableau.FilterUpdateType.Replace);

        filteredColumns.push(fieldName);
        //filteredColumns.push("Defender King");
        return false;
    }

    function filterByEdge(fieldName, domain){
        const worksheet = getSheetByName("Sheet 1");
        //worksheet.applyFilterAsync(fieldName, domain, tableau.FilterUpdateType.Replace);
        //worksheet.applyFilterAsync("Defender King", domain, tableau.FilterUpdateType.Replace);

        //https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_concepts_filtering.htm
        //https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_ref.htm#filterupdatetype_enum

        //worksheet.applyFilterAsync("Defender King", domain, tableau.FilterUpdateType.Add);
        worksheet.applyFilterAsync(fieldName, domain, tableau.FilterUpdateType.Replace);

        filteredColumns.push(fieldName);
        //filteredColumns.push("Defender King");
        return false;
    }

    let filteredColumns = [];
  
    function resetFilters() {
        console.log("resetFilters");
        const worksheet = getSheetByName("Sheet 1");
        filteredColumns.forEach(function(columnName) {
            worksheet.clearFilterAsync(columnName);
        });
        filteredColumns = [];
    }

    function positionLink(d) {
        
        //console.log(d);
        //console.log("*d: ", d);
        var offset = 30;

        var midpoint_x = (d.source.x + d.target.x) / 2;
        var midpoint_y = (d.source.y + d.target.y) / 2;

        var dx = (d.target.x - d.source.x);
        var dy = (d.target.y - d.source.y);
        var dr = 200/d.linknum;  //linknum is defined above

        var normalise = Math.sqrt((dx * dx) + (dy * dy));
        //var normalise = 100 + Math.floor(Math.random() * 50); ;
        //console.log("normalise: ", normalise)

        var offSetX = midpoint_x + offset*(dy/normalise);
        var offSetY = midpoint_y - offset*(dx/normalise);

//        return "M" + d.source.x + "," + d.source.y +
//               "S" + offSetX + "," + offSetY +
//               " " + d.target.x + "," + d.target.y;

        return "M" + d.source.x + "," + d.source.y +
               "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;


            
        //return "M" + d.source.x + "," + d.source.y
        //     + "S" + d.target.x + "," + d.target.x
        //     + " " + d.target.x/3 + "," + d.target.x/3;
    }

    function getNodesList(rows, source_ind, target_ind, group_ind){
        var nodes = [];
        nodes = rows.map(function(row, index) {
            //console.log("row: ", row);
            //console.log({'id': row[source_ind], 'group': row[group_ind], });
            //return {'id': row[source_ind], 'group': row[group_ind]};
            return {'id': row[source_ind]};
        });
        nodes = nodes.concat(rows.map(function(row, index) {
            //console.log("row: ", row);
            //console.log({'id': row[target_ind], 'group': row[group_ind], });
            //return {'id': row[target_ind], 'group': row[group_ind] };
            return {'id': row[target_ind]};
        }));
        //console.log("nodes: ", nodes);

        var flags = [], uniqueNodes = [], l = nodes.length, i;
        for( i=0; i<l; i++) {
            if( flags[nodes[i].id]) continue;
            flags[nodes[i].id] = true;
            uniqueNodes.push(nodes[i]);
        }
        //console.log("uniqueNodes", uniqueNodes);
        return  uniqueNodes;
    }

    function getLinksList(rows, source_ind, target_ind, group_ind){
        var links = [];
        links = rows.map(function(row, index) {
            //console.log("row: ", row);
            //console.log({'id': row[source_ind], 'group': row[group_ind], });
            //return {'id': row[source_ind], 'group': row[group_ind]};
            return {'source': row[source_ind], 'target': row[target_ind], 'name': row[4]};
        });
        //console.log("links: ", links);

        links[0].linknum = 1;
        var flag;
        for (var i=1; i<links.length; i++) {
            flag = 0;
            for(var j=0; j<i ; j++)
            if (links[i].source == links[j].source && links[i].target == links[j].target) {
                    links[i].linknum = links[j].linknum + 1;
                    //break;
                    flag =1 ;
            } 
            if(flag == 0) {
                links[i].linknum = 1; 
            };
            //console.log("links[", i , "].linknum: ", links[i].linknum)
        };
        console.log("links_ updated", links);
        return links;
    }

})();