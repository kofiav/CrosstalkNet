'use strict';
/**
 * Controller for the QUERY sub-tab COMMUNITY EXPLORER tab.
 * @namespace controllers
 */
(function() {
    angular.module('myApp.controllers').controller('CEQueryController', [
        '$scope',
        '$rootScope',
        'GlobalSharedData', 'QueryService', 'CESharedData', 'GraphConfigService', 'FileUploadService',
        '$mdSelect', '$mdDialog', '$timeout', 'GlobalControls',
        CEQueryController
    ]);

    /**
     * @namespace CEQueryController
     *
     * @desc Controller for the QUERY sub-tab in the COMMUNITY EXPLORER tab.
     *
     * @memberOf controllers
     */
    function CEQueryController($scope, $rootScope, GlobalSharedData, QueryService, CESharedData, GraphConfigService,
        FileUploadService, $mdSelect, $mdDialog, $timeout, GlobalControls) {
        var vm = this;

        vm.sharedData = GlobalSharedData.data;
        vm.changeDisplay = GlobalControls.changeDisplay;

        vm.displayModes = angular.copy(GlobalControls.displayModes);

        vm.getCommunities = getCommunities;
        vm.initializeController = initializeController;
        vm.uploadFile = uploadFile;
        vm.deleteConfirm = deleteConfirm;

        vm.resize = GraphConfigService.resetZoom;
        vm.needsRedraw = false;

        vm.goToTable = goToTable;

        function goToTable(com) {
            //alert("Go to table");
            console.log(com);
            vm.sdWithinTab.display = vm.displayModes.table;
            vm.sdWithinTab.selectedCom = com;
        }

        /**
         * @summary Assigns the ctrl property of the controller and sets the appropriate within 
         * tab model based on the ctrl property.
         *
         * @param {String} ctrl A name to associate this controller with.
         *
         * @memberOf controllers.CEQueryController
         */
        function initializeController(ctrl) {
            vm.ctrl = ctrl;
            vm.sdWithinTab = CESharedData.data;
            initializeVariables();
        }

        /**
         * @summary Initializes variables used within the tab for binding to the controls.
         *
         * @memberOf controllers.CEQueryController
         */
        function initializeVariables() {
            vm.communityFile = null;
            vm.communityUpload = null;
        }

        /**
         * @summary Obtains a cytoscape.js config from the server for 
         * the given communities file.
         *
         * @memberOf controllers.CEQueryController
         */
        function getCommunities(filterType) {
            var file = JSON.parse(vm.communityFile);
            $rootScope.state = $rootScope.states.loadingGraph;

            GraphConfigService.destroyGraph(CESharedData);
            CESharedData.resetWTM();
            QueryService.getCommunities(file).then(function(result) {
                $rootScope.state = $rootScope.states.finishedGettingCommunities;

                if (result.config == null) {
                    return;
                }

                $rootScope.state = $rootScope.states.loadingConfig;

                vm.sdWithinTab.cy = GraphConfigService.applyConfigCommunities(vm, result.config, "cyCommunityExplorer");
                vm.sdWithinTab.config = result.config;

                $rootScope.state = $rootScope.states.showingGraph;

                vm.sdWithinTab.communities = result.communities;
                vm.sdWithinTab.communityNumbers = Object.keys(vm.sdWithinTab.communities);
                vm.sdWithinTab.dataLoaded = true;
            });
        }

        /**
         * @summary Loads the list of available communities files 
         * from the server.
         *
         * @memberOf controllers.CEQueryController
         */
        function loadFileList() {
            QueryService.getCommunityFileList().then(function(result) {
                vm.fileList = result.fileList;
            });
        }

        /**
         * @summary Uploads a communitiy file to the server. The file
         * should be attached to vm.communityUpload. 
         *
         * @memberOf controllers.CEQueryController
         */
        function uploadFile() {
            $rootScope.state = $rootScope.states.uploadingFile;
            FileUploadService.uploadCommunityFile(vm.communityUpload).then(function() {
                $rootScope.state = $rootScope.states.initial;
                vm.clearAllData = true;
                loadFileList();
            });
        }

        /**
         * @summary Spawns a confirm dialog asking the user if they really want to 
         * delete the file they clicked on.
         *
         * @param {Event} ev The event associated with the click. This is used to prevent
         * propogation.
         * @param {Object} file The file that is to be deleted.
         *
         * @memberOf controllers.CEQueryController
         */
        function deleteConfirm(ev, file) {
            var toDelete = {};

            for (var prop in file) {
                if (prop.indexOf("$") < 0) {
                    toDelete[prop] = file[prop];
                }
            }

            ev.stopPropagation();
            $mdSelect.hide();

            var confirm = $mdDialog.confirm()
                .title('Confirm Delete?')
                .textContent('Are you sure you want to delete the file: ' + file.name + '?')
                .ariaLabel('Lucky day')
                .targetEvent(ev)
                .clickOutsideToClose(false)
                .escapeToClose(false)
                .ok('Yes')
                .cancel('No');
            $mdDialog.show(confirm).then(function() {
                console.log(JSON.parse(vm.communityFile));
                console.log(toDelete.name);
                if (vm.communityFile != null && JSON.parse(vm.communityFile).name == toDelete.name) {
                    GraphConfigService.destroyGraph(CESharedData);
                    CESharedData.resetWTM();
                }

                QueryService.deleteCommunityFile(toDelete);
            }, function() {});

            GlobalControls.focusElement("md-dialog button.ng-enter-active");
        }


        /**
         * @summary Wacthes for changes in the reloadCommunityFileList variable and reloads the available
         * file dropdowns as well as the user permission level when reloadCommunityFileList becomes true.
         * @memberOf controllers.CEQueryController
         */
        $scope.$watch(function() {
            return vm.sharedData.reloadCommunityFileList;
        }, function(newValue, oldValue) {
            if (newValue == true) {
                loadFileList();
                vm.sharedData.reloadCommunityFileList = false;
            }
        });

        /**
         * @summary Watches the clearAllData variable and clears the data within the tab when 
         * it changes to true.
         *
         * @memberOf controllers.CEQueryController
         */
        $scope.$watch(function() {
            return vm.clearAllData;
        }, function(newValue, oldValue) {
            if (newValue == true && newValue != oldValue) {
                GraphConfigService.destroyGraph(CESharedData);
                CESharedData.resetWTM(vm);
                initializeVariables();
                vm.clearAllData = false;
            }
        });


        /** 
         * @summary Watches the display variable and redraws the graph when switching
         * from the Tables view to the Graph view.
         *
         * @memberOf controllers.CEQueryController
         */
        $scope.$watch(function() {
            if (vm.sdWithinTab) {
                return vm.sdWithinTab.display;
            }
            return null;
        }, function(newValue, oldValue) {
            if (newValue == vm.displayModes.graph && newValue != oldValue && vm.needsRedraw) {
                $timeout(function() {
                    if (vm.sdWithinTab.config != null && vm.sdWithinTab.cy != null) {
                        GraphConfigService.destroyGraph(vm);
                        vm.needsRedraw = false;
                        vm.sdWithinTab.cy = GraphConfigService.applyConfig(vm, vm.sdWithinTab.config, "cyInteractionExplorer");
                    }
                }, 250);
            } else if (newValue == vm.displayModes.graph && newValue != oldValue && !vm.needsRedraw) {
                $timeout(function() {
                    if (vm.sdWithinTab.config != null && vm.sdWithinTab.cy != null) {
                        vm.resize(vm);
                    }
                }, 250);
            }
        });
    }
})();
