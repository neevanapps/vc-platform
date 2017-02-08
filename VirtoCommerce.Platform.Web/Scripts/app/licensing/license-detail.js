﻿angular.module('platformWebApp')
.controller('platformWebApp.licenseDetailController', ['$scope', '$window', 'FileUploader', '$http', 'platformWebApp.bladeNavigationService', function ($scope, $window, FileUploader, $http, bladeNavigationService) {
    var blade = $scope.blade;

    $scope.activate = function (activationCode) {
        blade.isLoading = true;
        $scope.activationError = null;
        blade.licenseContent = null;
        $scope.filename = null;

        $http.post('api/platform/licensing/activateByCode', JSON.stringify(activationCode)).then(function (response) {
            activationCallback(response.data, true);
        }, function (error) {
            $scope.activationError = error.data.message;
        });
    };

    function activationCallback(licenseResponse, isActivationByCode) {
        blade.isLoading = false;
        if (licenseResponse) {
            $scope.currentEntity = licenseResponse.license;
            blade.licenseContent = licenseResponse.content;;
            if ($scope.currentEntity.expirationDate && new Date($scope.currentEntity.expirationDate) < new Date()) {
                $scope.activationError = 'Activation failed. This license has expired.';
            }
        } else {
            $scope.activationError = isActivationByCode ? 'Activation failed. Check the activation code.' : 'Activation failed. Check the license file.';
        }
    }

    $scope.activateLicense = function () {
        // confirmed. Activate the license
        blade.isLoading = true;
        $http.post('api/platform/licensing/activateLicense', JSON.stringify(blade.licenseContent)).then(function () {
            $window.location.reload();
        });
    };

    if (blade.isNew) {
        // create the uploader
        var uploader = $scope.uploader = new FileUploader({
            scope: $scope,
            headers: {
                Accept: 'application/json'
            },
            url: 'api/platform/licensing/activateByFile',
            method: 'POST',
            autoUpload: true,
            removeAfterUpload: true
        });

        // ADDING FILTERS
        // lic only
        uploader.filters.push({
            name: 'licFilter',
            fn: function (i /*{File|FileLikeObject}*/, options) {
                return i.name.toLowerCase().endsWith('.lic');
            }
        });

        uploader.onAfterAddingFile = function (fileItem) {
            $scope.filename = fileItem.file.name;
            $scope.activationError = null;
        };

        uploader.onSuccessItem = function (item, response) {
            activationCallback(response, false);
        };

        uploader.onErrorItem = function (item, response, status) {
            blade.isLoading = false;
            $scope.activationError = response.message ? response.message : status;
        };
        blade.title = 'platform.blades.license.title-new';
    } else {
        $scope.currentEntity = $scope.license || {
            "type": "Community", "customerName": "N/A", "expirationDate": "N/A"
        };

        blade.toolbarCommands = [
              {
                  name: "platform.commands.new-license", icon: 'fa fa-check',
                  executeMethod: function () {
                      var newBlade = {
                          id: 'license-activate',
                          isNew: true,
                          controller: blade.controller,
                          template: blade.template
                      };
                      bladeNavigationService.showBlade(newBlade, blade);
                  },
                  canExecuteMethod: function () {
                      return true;
                  },
                  permission: 'platform:module:manage'
              }];

        blade.title = 'platform.blades.license.title';
        blade.headIcon = 'fa-id-card';
    }

    blade.isLoading = false;
}])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider
        .state('workspace.appLicense', {
            url: '/appLicense',
            templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
            controller: ['platformWebApp.bladeNavigationService', function (bladeNavigationService) {
                var blade = {
                    id: 'appLicense',
                    controller: 'platformWebApp.licenseDetailController',
                    template: '$(Platform)/Scripts/app/licensing/license-detail.tpl.html',
                    isClosingDisabled: true
                };
                bladeNavigationService.showBlade(blade);
            }]
        });
}]);