'use strict';
'ngInject';

export default angular.module('luckydraw3.routes', [])

  .config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('draw', { url: '/', templateUrl: '/client/view/draw.ng.html', controller: 'DrawController as vm' });

    $stateProvider
      .state('management', { url: '/management/:type', templateUrl: '/client/view/management.ng.html', controller: 'ManagementController as vm' });
  });
