import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { Configs } from '/imports/api/configs';

import { defaultPpls } from '/imports/mock/default-ppls';

export const Ppls = new Mongo.Collection('ppls');

Ppls.const = {
  DRAW_PPL_COUNT: 350
};

Meteor.methods({
  'removeAllPpls' : function () {
    Ppls.remove({});
  },
  'resetAllPpls': function() {
    Ppls.remove({});
    Ppls.batchInsert(defaultPpls);
  }
});

if (Meteor.isServer) {
  const RawPpls = Ppls.rawCollection();

  Meteor.methods({
    'drawPpls': function(config) {
      RawPpls.aggregateSync = Meteor.wrapAsync(RawPpls.aggregate);
      var candidates = [];
      if (config.scope == Configs.const.SCOPE_LOCAL) {
        candidates = RawPpls.aggregateSync([{$match: {laId: '', forLa: 'true'}}]);
      } else if(config.scope == Configs.const.SCOPE_GLOBAL) {
        candidates = RawPpls.aggregateSync([{$match: {gaId: '', forGa: 'true'}}]);
      }

      if (candidates.length) {
        var luckyGroup = _.sample(candidates, Ppls.const.DRAW_PPL_COUNT);
        var luckyGuys = _.sample(luckyGroup, config.ppl);

        _.each(luckyGuys, function(luckyGuy) {
          if (config.scope == Configs.const.SCOPE_LOCAL) {
            luckyGuy.laId = config._id;
            Ppls.update({_id: luckyGuy._id}, {$set:{laId: config._id}});
          } else if(config.scope == Configs.const.SCOPE_GLOBAL) {
            luckyGuy.gaId = config._id;
            Ppls.update({_id: luckyGuy._id}, {$set:{gaId: config._id}});
          }
        });
      }

      return luckyGroup;
    }
  });
}
