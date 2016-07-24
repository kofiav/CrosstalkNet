'use strict';
/**
 * Exporting factory. Contains functions that are used to export tables to csv
 * files and graphs to png's.
 * @namespace services
 */
(function() {
    angular.module("myApp.services").factory('ExportService', ExportService);

    /**
     * @namespace ExportService
     * @desc Factory for exporting data to files.
     * @memberOf services
     */
    function ExportService($http, $filter) {
        var service = {};

        service.exportNeighboursToCSV = exportNeighboursToCSV;
        service.exportGraphToPNG = exportGraphToPNG;

        /**
         * @summary Exports a specified table of data to a csv file.
         *
         * @param {Object} vm A view model for a controller. This is used
         * to obtain the interactions for that controller.
         * @param {Number} index The level of neighbours that are desired.
         * @param {String} networkType A string indicating whether the network type is
         * weight, normal, or tumor. 
         */
        function exportNeighboursToCSV(vm, index, networkType) {
            var fileName = $filter("ordinal")(index + 1) + "neighbours" + Date.now() + ".csv";
            var neighbours = vm.sdWithinTab.neighbours[index];
            var rowDelim = "\r\n";
            var colDelim = ",";
            var csv = "";
            var header = colDelim + neighbours.stroma.map(function(s) {
                return s; //return $filter('suffixTrim')(s);
            }).join();
            csv += header;
            csv += rowDelim;

            for (var i = 0; i < neighbours.epi.length; i++) {
                var temp = [];
                //temp.push($filter('suffixTrim')(neighbours.epi[i]));
                temp.push(neighbours.epi[i]);
                for (var j = 0; j < neighbours.stroma.length; j++) {
                    temp.push(vm.getInteractionViaDictionary(vm, neighbours.epi[i], neighbours.stroma[j], networkType));
                }

                csv += temp.join();
                csv += rowDelim;
            }

            var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
            var link = document.createElement("a");
            link.setAttribute("href", csvData);
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        /** 
         * @summary Downloads the currently displayed graph as a png.
         *
         * @param {Object} vm A view model for the current controller
         * that has a cytoscape object in its within-tab shared data.
         */
        function exportGraphToPNG(vm) {
            if (vm.sdWithinTab.cy == null) {
                return;
            }

            var fileName = "graph" + Date.now() + ".png";
            var png64 = vm.sdWithinTab.cy.png({ full: true });
            png64 = png64.substring("data:image/png;base64,".length);

            var byteCharacters = atob(png64);

            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            var blob = new Blob([byteArray], { type: "image/png" });
            var dataURL = URL.createObjectURL(blob);

            var link = document.createElement("a");
            link.style.display = 'none';
            link.setAttribute("href", dataURL);
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        return service;
    }
})();
