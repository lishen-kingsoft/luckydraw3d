import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { defaultConfigs } from '/imports/mock/default-configs';
 
export const Configs = new Mongo.Collection('configs');

Configs.const = {
  STATUS_NOTSTARTED: '未开始',
  STATUS_RUNNING: '进行中',
  STATUS_FINISHED: '已完成',
  SCOPE_LOCAL: '小西山居',
  SCOPE_GLOBAL: '大西山居'
}

Meteor.methods({
  'removeAllConfigs' : function () {
    Configs.remove({});
  },
  'resetAllConfigs': function() {
    Configs.remove({});
    Configs.batchInsert(defaultConfigs);
  }
});