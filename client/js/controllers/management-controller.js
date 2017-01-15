'use strict';
'ngInject';

import { Meteor } from 'meteor/meteor';

import { Configs } from '/imports/api/configs';
import { Ppls } from '/imports/api/ppls';
import { Events } from '/imports/api/events';

export default function($scope, $meteor, $reactive) {

  $reactive(this).attach($scope);

  var vm = this;

  vm.helpers({
    dbConfigs() {
      return Configs.find({}, {sort: [['classSeq', 'asc'],['roundSeq', 'asc']]}, {reactive: false});
    },
    dbSelectedPpls() {
      return Ppls.find({$or: [{laId: {$ne: ''}},{gaId: {$ne: ''}}]}, {}, {reactive: false});
    }
  });

  vm.resetAddedConfig = function() {
    vm.addedConfig = {
        class: '',
        classSeq: 0,
        round: '',
        roundSeq: 0,
        ppl: 0,
        scope: '',
        status: Configs.const.STATUS_NOTSTARTED
    }
  };

  vm.resetAll = function() {
    Meteor.call('resetAllConfigs');
    Meteor.call('resetAllPpls');
    Meteor.call('resetAllEvents');
  };

  vm.deleteConfig = function(config) {
    Configs.remove(config._id);
  };

  vm.addConfig = function() {
    if(!vm.addedConfig.class) {
      alert('请输入正确奖品级别！');
      return;
    }
    if(!vm.addedConfig.classSeq) {
      alert('请输入正确级别序列！');
      return;
    }
    if(!vm.addedConfig.round) {
      alert('请输入正确奖品轮数！');
      return;
    }
    if(!vm.addedConfig.roundSeq) {
      alert('请输入正确轮数序列！');
      return;
    }
    if(!vm.addedConfig.ppl) {
      alert('请输入正确中奖人数！');
      return;
    }
    if(!vm.addedConfig.scope || (vm.addedConfig.scope != Configs.const.SCOPE_LOCAL && vm.addedConfig.scope != Configs.const.SCOPE_GLOBAL)) {
      alert('请输入正确中奖范围！');
      return;
    }
    Configs.insert(vm.addedConfig);
  };

  vm.start = function() {
    if (!vm.currentDraw) {
      alert('已完成抽奖');
      return;
    }

    if (vm.currentDraw.status != Configs.const.STATUS_NOTSTARTED) {
      alert('该状态不能开始!');
      return;
    }

    vm.apply('drawPpls', [vm.currentDraw], (err, result) => {
      if (err) {
        alert(err);
      }
      Configs.update({_id: vm.currentDraw._id}, {$set:{status: Configs.const.STATUS_RUNNING}});
      Events.insert({name: 'draw.start', draw: {
        _id: vm.currentDraw._id,
        class: vm.currentDraw.class,
        round: vm.currentDraw.round
      }, candidates: result, ts: new Date().getTime()});
    });
  };

  vm.stop = function() {
    if (!vm.currentDraw) {
      alert('已完成抽奖');
      return;
    }

    if (vm.currentDraw.status != Configs.const.STATUS_RUNNING) {
      alert('该状态不能结束!');
      return;
    }

    Configs.update({_id: vm.currentDraw._id}, {$set:{status: Configs.const.STATUS_FINISHED}});
    Events.insert({name: 'draw.stop', draw: {
      _id: vm.currentDraw._id,
      class: vm.currentDraw.class,
      round: vm.currentDraw.round
    }, ts: new Date().getTime()});
  };

  vm.enhanceDbConfigs = function() {
    vm.enhancedConfigs = angular.copy(vm.dbConfigs);
    var groupedConfigs = _.values(_.groupBy(vm.enhancedConfigs, 'classSeq'));
    _.each(groupedConfigs, function(configs) {
      _.each(configs, function(config, index, group){
        config.classLength = group.length;
        if(index == 0) {
          config.firstOfClass = true;
        }
      });
    });
    
    vm.currentDraw = _.find(vm.enhancedConfigs, (config) => {
      return config.status != Configs.const.STATUS_FINISHED;
    });
    if (vm.currentDraw) {
      vm.currentDraw.isCurrent = true;
    }
  };

  vm.getClasses = function() {
    if (!vm.selectedClass) {
      vm.selectedClass = '三等奖';
    }

    return _.keys(_.groupBy(vm.enhancedConfigs, 'class'));
  };

  vm.selectClass = function(classStr) {
    vm.selectedClass = classStr;
  };

  vm.getRounds = function() {
    return _.keys(_.groupBy(_.filter(vm.enhancedConfigs, (config) => {
      return config.class == vm.selectedClass;
    }), 'round'));
  };

  vm.getPpls = function(round) {
    var config = _.find(vm.enhancedConfigs, (config) => {
      return config.class == vm.selectedClass && config.round == round;
    });
    if (config) {
      var configId = config._id;
      return _.filter(vm.dbSelectedPpls, (ppl) => {
        return ppl.laId == configId || ppl.gaId == configId;
      });
    }
  };

  vm.updateDone = function(ppl) {
    Ppls.update({_id: ppl._id},  {$set:{done: ppl.done}});
  };

  vm.init = function() {
    vm.tab = 'config';
    vm.resetAddedConfig();
    $scope.$watch('vm.dbConfigs', function() {
      vm.enhanceDbConfigs();
    }, true);
  };

  vm.init();
}