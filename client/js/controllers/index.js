'use strict';

import DrawController from './draw-controller';
import ManagementController from './management-controller';

export default angular
  .module('luckydraw3.controllers', [])
  .controller('DrawController', DrawController)
  .controller('ManagementController', ManagementController);