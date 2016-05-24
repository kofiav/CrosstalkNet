var myModule = angular.module("myApp");
myModule.factory('BasicDataService', function($http) {
    var service = {};

    service.states = {
        initial: 0,
        firstDropdown: 1,
        secondDropdown: 2,
        loadingFirst: 3,
        loadingSecond: 4,
        loading: 5,
        loadingConfig: 6
    };

    service.pValues = [{ display: "0.001", value: "001" }, { display: "0.01", value: "01" },
        { display: "0.05", value: "05" }, { display: "0.1", value: "1" }
    ];

    service.layouts = [{ display: "Bipartite", value: "preset" }, {
        display: "Concentric",
        value: "clustered"
    }, { display: "Hierarchical", value: "hierarchical" }, { display: "Random", value: "random" }];

    service.loadDropdownOptions = loadDropdownOptions;
    service.loadGeneListDropdownOptions = loadGeneListDropdownOptions;
    service.querySearch = querySearch;
    service.getNodesWithMinDegree = getNodesWithMinDegree;
    service.getSelfLoops = getSelfLoops;
    service.flattenNeighbours = flattenNeighbours;
    service.createEdgeDictionary = createEdgeDictionary;

    function loadDropdownOptions(cy, selectedGenes = null) {
        var genes = [];
        var selectedGenesStr = "";
        var parentContainers = "#par0";
        var parents = "";

        for (var i = 0; i < selectedGenes.length; i++) {
            selectedGenesStr += ', #' + selectedGenes[i].value;
            parentContainers += ", #par" + (i + 1);
            parents += ", [parent='par" + i + "']"
        }

        cy.nodes().not(parentContainers + parents + selectedGenesStr).forEach(function(
            node) {
            genes.push(node.data());
        });

        return genes.map(function(gene) {
            return {
                value: gene.id,
                display: gene.id + ' ' + gene.degree,
                object: gene
            };
        });
    }

    function loadGeneListDropdownOptions(geneList) {
        return geneList.map(function(gene) {
            return {
                value: gene.name,
                display: gene.name + ' ' + gene.degree,
                object: gene
            };
        });
    }

    function querySearch(query, source, scope) {
        if (source == "first") {
            var results = query ? scope.firstNeighbourDropdownOptions.filter(createFilterFor(query)) :
                scope.firstNeighbourDropdownOptions,
                deferred;
        } else if (source == "geneList") {
            var results = query ? scope.geneList.filter(createFilterFor(query)) :
                scope.geneList,
                deferred;
        } else {
            var results = query ? scope.genesSecond.filter(createFilterFor(query)) :
                scope.genesSecond,
                deferred;
        }

        if (self.simulateQuery) {
            deferred = $q.defer();
            $timeout(function() { deferred.resolve(results); }, Math.random() *
                1000, false);
            return deferred.promise;
        } else {
            return results;
        }
    }

    function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);
        return function filterFn(gene) {
            return (angular.lowercase(gene.value).indexOf(lowercaseQuery) === 0);
        };
    }

    function getNodesWithMinDegree(scope) {
        var nodes = scope.cy.nodes();
        var result = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].data('degree') > scope.minDegree.first) {
                result.push(nodes[i]);
            }
        }

        return result;
    }

    function getSelfLoops(scope) {
        var edges = scope.cy.edges();
        var result = [];

        for (var i = 0; i < edges.length; i++) {
            var source = edges[i].source().id().substr(0, edges[i].source().id().length - 2);
            var target = edges[i].target().id().substr(0, edges[i].target().id().length - 2);

            if (source == target) {
                result.push(source);
                /*
                if (result.indexOf(source) < 0) {
                   
                }*/
            }
        }

        return result;
    }

    function createEdgeDictionary(edges) {
        var dictionary = {};

        for (var i = 0; i < edges.length; i++) {
            var id = edges[i].source().id(); 
            if (id.endsWith('-E')) {
                if (dictionary[id] == null) {
                    dictionary[id] = {};
                }

                dictionary[id][edges[i].target().id()] = edges[i].data('weight');
            } else {
                id = edges[i].target().id();
                
                if (dictionary[id] == null) {
                    dictionary[id] = {};
                }

                dictionary[id][edges[i].source().id()] = edges[i].data('weight');
            }
        }

        return dictionary;
    }

    function flattenNeighbours(neighbours) {
        var flattened = [];

        for (var i = 0; i < neighbours.length; i++) {
            flattened = flattened.concat(neighbours[i]);
        }

        return flattened;
    }

    return service;
});
