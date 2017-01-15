import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';

import routes from './routes';
import controllers from './controllers';

import 'bootstrap/dist/css/bootstrap.css';
 
angular.module('luckydraw3', [
  angularMeteor,
  uiRouter,

  routes.name,
  controllers.name
]);