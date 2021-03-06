/**
 * DS (DataService) Service
 *
 * Provides simple API for managing data services
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('DSSelectionService', DSSelectionService);

    DSSelectionService.$inject = ['SYNTAX', 'RepoRestService', 'DownloadService', '$rootScope'];

    function DSSelectionService(SYNTAX, RepoRestService, DownloadService, $rootScope) {

        var ds = {};
        ds.loading = false;
        ds.dataservices = [];
        ds.dataservice = null;
        ds.deploymentInProgress = false;
        ds.deploymentServiceName = null;
        ds.deploymentSuccess = false;
        ds.deploymentMessage = null;
        ds.editServiceSourceSelection = null;
        ds.editServiceSourceTableSelection = null;

        /*
         * Service instance to be returned
         */
        var service = {};

        function setLoading(loading) {
            ds.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingDataServicesChanged", ds.loading);
        }

        /**
         * Fetch the data services for the repository
         */
        function initDataServices(pageId) {
            setLoading(true);

            try {
                RepoRestService.getDataServices( ).then(
                    function (newDataServices) {
                        RepoRestService.copy(newDataServices, ds.dataservices);
                        ds.dataservice = null;
                        setLoading(false);
                        if(pageId) {
                            // Broadcast the pageChange
                            $rootScope.$broadcast("dataServicePageChanged", pageId);
                        }
                    },
                    function (response) {
                        // Some kind of error has occurred
                        ds.dataservices = [];
                        ds.dataservice = null;
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load data services from the host services.\n" + response.message);
                    });
            } catch (error) {
                ds.dataservices = [];
                ds.dataservice = null;
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }
        }

        /*
         * Are the data services currently loading
         */
        service.isLoading = function() {
            return ds.loading;
        };

        /*
         * Is the service's deployment flag set
         */
        service.isDeploying = function() {
            return ds.deploymentInProgress;
        };
        
        /*
         * Returns deployment service name
         */
        service.deploymentServiceName = function() {
            return ds.deploymentServiceName;
        };
        
        /*
         * Returns service deployment success state
         */
        service.deploymentSuccess = function() {
            return ds.deploymentSuccess;
        };
        
        /*
         * Returns service deployment message
         */
        service.deploymentMessage = function() {
            return ds.deploymentMessage;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying, serviceName, deploymentSuccess, message) {
            ds.deploymentInProgress = deploying;
            ds.deploymentServiceName = serviceName;
            ds.deploymentSuccess = deploymentSuccess;
            ds.deploymentMessage = message;

            $rootScope.$broadcast("deployDataServiceChanged", ds.deploymentInProgress);
        };

        /*
         * Select the given dataservice
         */
        service.getDataServices = function() {
            return ds.dataservices;
        };

        service.setEditSourceSelection = function(sourceName) {
            ds.editServiceSourceSelection = sourceName;
        };

        service.getEditSourceSelection = function() {
            return ds.editServiceSourceSelection;
        };

        service.setEditSourceTableSelection = function(tableName) {
            ds.editServiceSourceTableSelection = tableName;
        };

        service.getEditSourceTableSelection = function() {
            return ds.editServiceSourceTableSelection;
        };

        /**
         * Get the names of the Dataservices that use the provided source name
         */
        service.getDataservicesUsingSource = function( sourceName ) {
            var dataserviceNames = [];

            for (var i = 0; i < ds.dataservices.length; ++i) {
                if(ds.dataservices[i].serviceViewTables) {
                    var viewTables = ds.dataservices[i].serviceViewTables;
                    for (var j = 0; j < viewTables.length; ++j) {
                        var viewTable = viewTables[j];
                        if(viewTable.startsWith(sourceName+'.')) {
                            dataserviceNames.push(ds.dataservices[i].keng__id);
                            break;
                        }
                    }
                }
            }

            return dataserviceNames;
        };

        /*
         * Select the given dataservice
         */
        service.selectDataService = function(dataservice) {
            //
            // Set the selected dataservice
            //
            ds.dataservice = dataservice;

            // Useful for broadcasting the selected data service has been updated
            $rootScope.$broadcast("selectedDataServiceChanged", ds.dataservice);
        };

        /*
         * return selected dataservice
         */
        service.selectedDataService = function() {
            return ds.dataservice;
        };

        /*
         * return selected dataservice
         */
        service.hasSelectedDataService = function() {
            if (! angular.isDefined(ds.dataservice))
                return false;

            if (_.isEmpty(ds.dataservice))
                return false;

            if (ds.dataservice === null)
                return false;

            return true;
        };

        /*
         * return selected dataservice
         */
        service.selectedDataServiceVdbName = function() {
            if ( !angular.isDefined(ds.dataservice) || _.isEmpty(ds.dataservice) || ds.dataservice === null )
                return SYNTAX.UNKNOWN;

            if ( !angular.isDefined(ds.dataservice.serviceVdbName) || _.isEmpty(ds.dataservice.serviceVdbName) || ds.dataservice.serviceVdbName === null )
                return SYNTAX.UNKNOWN;
            
            return ds.dataservice.serviceVdbName;
        };

        /*
         * return selected dataservice
         */
        service.selectedDataServiceVdbVersion = function() {
            if ( !angular.isDefined(ds.dataservice) || _.isEmpty(ds.dataservice) || ds.dataservice === null )
                return 1;

            if ( !angular.isDefined(ds.dataservice.serviceVdbVersion) || _.isEmpty(ds.dataservice.serviceVdbVersion) || ds.dataservice.serviceVdbVersion === null )
                return 1;
            
            return ds.dataservice.serviceVdbVersion;
        };
        
        /*
         * return selected dataservice view model
         */
        service.selectedDataServiceViewModel = function() {
            if ( !angular.isDefined(ds.dataservice) || _.isEmpty(ds.dataservice) || ds.dataservice === null )
                return SYNTAX.UNKNOWN;

            if ( !angular.isDefined(ds.dataservice.serviceViewModel) || _.isEmpty(ds.dataservice.serviceViewModel) || ds.dataservice.serviceViewModel === null )
                return SYNTAX.UNKNOWN;
            
            return ds.dataservice.serviceViewModel;
        };
        
        /*
         * return selected dataservice view
         */
        service.selectedDataServiceView = function() {
            if ( !angular.isDefined(ds.dataservice) || _.isEmpty(ds.dataservice) || ds.dataservice === null )
                return SYNTAX.UNKNOWN;

            if ( !angular.isDefined(ds.dataservice.serviceView) || _.isEmpty(ds.dataservice.serviceView) || ds.dataservice.serviceView === null )
                return SYNTAX.UNKNOWN;
            
            return ds.dataservice.serviceView;
        };

        /*
         * deploy the currently selected dataservice
         *   - loading notifications are broadcast when the loading state changes.
         */
        service.deploySelectedDataService = function() {
            var selDS = service.selectedDataService();
            var selDSName = selDS.keng__id;
            var dsVdbName = service.selectedDataServiceVdbName();

            service.setDeploying(true, selDSName, false, null);
            try {
                RepoRestService.deployDataService( selDSName ).then(
                    function ( result ) {
                        if(result.Information.deploymentSuccess == "true") {
                            var successCallback = function() {
                                service.setDeploying(false, selDSName, true, null);
                            };
                            var failCallback = function(failMessage) {
                                service.setDeploying(false, selDSName, false, failMessage);
                            };

                            //
                            // Monitor the service vdb of the dataservice to determine when its active
                            //
                            var pollDurationSec = 120;
                            var pollIntervalSec = 2;
                            RepoRestService.pollForActiveVdb(dsVdbName, pollDurationSec, pollIntervalSec, successCallback, failCallback);
                        } else {
                            service.setDeploying(false, selDSName, false, result.Information.ErrorMessage1);
                        }
                   },
                    function (response) {
                        service.setDeploying(false, selDSName, false, RepoRestService.responseMessage(response));
                        throw RepoRestService.newRestException($translate.instant('DSSelectionService.deployFailedMsg', 
                                                                                  {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {
                service.setDeploying(false);
                alert("An exception occurred:\n" + error.message);
            }
        };

        /*
         * Refresh the collection of data services.  If a pageId is supplied, the redirect is broadcast
         */
        service.refresh = function(pageId) {
            initDataServices(pageId);
        };

        // Initialise dataservice collection on loading
        service.refresh(null);

        return service;
    }

})();
