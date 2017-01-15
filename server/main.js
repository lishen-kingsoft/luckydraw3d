import { Meteor } from 'meteor/meteor';

import { Configs } from '/imports/api/configs';
import { Ppls } from '/imports/api/ppls';
import { Events } from '/imports/api/events';

Meteor.startup(() => {
  if (Configs.find().count() === 0) {
    Meteor.call('resetAllConfigs');
  }

  if (Ppls.find().count() === 0) {
    Meteor.call('resetAllPpls');
  }

  Meteor.call('resetAllEvents');
});