var myModule = angular.module("myApp");
myModule.factory('GraphConfigService', function($http, RESTService) {

    var service = {};

    service.tabNames = { main: "main", neighbour: "neighbour" };
    service.tabs = { main: {}, neighbour: {} };

    service.dataModel = {
        elemCopy: null,
        styleCopy: null,
        cy: null,
        selfLoops: [],
        selfLoopsCount: 0
    };

    service.tabs.main.data = angular.copy(service.dataModel);
    service.tabs.neighbour.data = angular.copy(service.dataModel);

    service.neighbourConfigs = { firstDropdownConfig: null, secondDropdownConfig: null };
    service.firstSelectedGene = null;

    service.getSelfLoops = function(tab, pValue, scope) {
        RESTService.get('self-loops', { params: { pValue: pValue } })
            .then(function(data) {
                /*service.tabs[tab].data.selfLoops = data.geneNames;
                service.tabs[tab].data.selfLoopsCount = data.numberOfLoops;*/

                scope.selfLoops = data.geneNames;
                scope.selfLoopsCount = data.numberOfLoops;
            });
    };

    service.applyConfig = function(config) {
        service.data.main.elemCopy = angular.copy(config.elements);
        config.container = document.getElementById('cy');
        service.data.main.cy = cytoscape(config);
        service.data.main.cy.fit(service.data.main.cy.$("*"), 10);

        /*
        service.cy.on("zoom", function() {
            service.$evalAsync(function() {
                if service.cy.zoom() < 0.25) {
                    service.cy.elements = topLevelElements;
                } else {

                }
                service.zoom = service.cy.zoom();
            });
        });
    

        service.data.main.cy.on("select", function(evt) {
            var node = evt.cyTarget;
            var id = node.id();
            console.log('tapped ' + id);


            service.data.main.cy.edges().forEach(function(edge) {
                if (edge.source().id() == id) {
                    edge.addClass('highlighted');
                    edge.removeClass('faded');
                    edge.css({ 'line-color': 'red' });
                } else {
                    edge.addClass('faded');
                    edge.removeClass('highlighted');
                    edge.css({ 'opacity': '0' });
                }
            });

            service.selectedItem = null;
            console.log(node);
        });

        /*
        service.data.main.cy.on("unselect", function(evt) {
            var node = evt.cyTarget;
            var id = node.id();

            service.resetEdges();
            console.log('tapped ' + id);
            console.log(node);
        });*/
    };

    service.findGeneInGraph = function(cy, gene) {
        var node = cy.$("#" + gene.toUpperCase());
        var x = node.renderedPosition('x');
        var y = node.renderedPosition('y');
        
        cy.fit(cy.$("#" + gene.toUpperCase()));
        cy.zoom({ level: 1.5, renderedPosition: { x: x, y: y } });
    };

    service.resetEdges = function(cy) {
        cy.edges().forEach(function(edge) {
            edge.css({ 'line-color': 'white' });
            edge.css({ 'opacity': '1' });
        });
    };

    service.resetZoom = function(cy) {
        service.resetNodes(cy);
        cy.fit(cy.$("*"), 10);
    };

    service.resetNodes = function(cy, originalElements) {
        cy.json({ elements: originalElements });
    };

    service.createLargeWeaveGraph = function() {
        var elements = [];

        for (var i = 0; i < totalNumNodes; i++) {
            elements.push({
                data: {
                    id: 'nodeA' + i,
                    parent: 'epi'
                },
                position: {
                    x: i < (totalNumNodes / 2) ? 100 + (i * 10) : 100 + ((
                        totalNumNodes - i) * 10),
                    y: 100 + (i * 15)
                },
                style: {
                    'shape': 'triangle'
                }

            });
            elements.push({
                data: {
                    id: 'nodeB' + i,
                    parent: 'stroma'
                },
                position: {
                    x: i < (totalNumNodes / 2) ? 15000 - (i * 10) : 1500 - ((
                        totalNumNodes - i) * 10),
                    y: 100 + (i * 15)
                }
            });
            elements.push({
                data: {
                    id: 'edgeAB' + i,
                    source: 'nodeA' + i,
                    target: 'nodeB' + i
                }
            });
        }

        elements.push({
            data: {
                id: 'epi'
            },
            shape: 'TRIANGLE',
            selected: true,
            selectable: true
        })
        elements.push({
            data: {
                id: 'stroma'
            },
            shape: 'TRIANGLE'
        })
    };

    service.create10By10EpiStroma = function() {
        var elements = [];
        totalNumNodes = 10;

        for (var i = 0; i < totalNumNodes; i++) {
            elements.push({
                data: {
                    id: 'nodeA' + i,
                    parent: 'epi'
                },
                position: {
                    x: 100,
                    y: 100 + (i * 15)
                },
                style: {
                    'width': '10px',
                    'height': '10px'
                }

            });
            elements.push({
                data: {
                    id: 'nodeB' + i,
                    parent: 'stroma'
                },
                position: {
                    x: 400,
                    y: 100 + (i * 15)
                }
            });
            elements.push({
                data: {
                    id: 'edgeAB' + i,
                    source: 'nodeA' + i,
                    target: 'nodeB' + i
                }
            });
        }

        elements.push({
            data: {
                id: 'epi'
            },
            shape: 'TRIANGLE',
            selected: true,
            selectable: true
        })
        elements.push({
            data: {
                id: 'stroma'
            },
            shape: 'TRIANGLE'
        })
    };



    return service;
});