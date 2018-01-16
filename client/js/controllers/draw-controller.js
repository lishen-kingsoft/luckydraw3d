'use strict';
'ngInject';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { Events } from '/imports/api/events';

import { Boid } from '../three/Boid';

import * as THREE from 'three/build/three';
import * as TWEEN from 'tween.js/src/Tween';

export default function($scope, $meteor, $reactive, $timeout, $interval) {

  const cleanDuration = 500;
  const cleanPositionZ = 3000;

  $reactive(this).attach($scope);

  var vm = this;

  Meteor.autorun(function() {
    var initTs = new Date().getTime();
    Events.find().observe({
      added: function(event){
        if(!event.ts || (initTs > event.ts)) {
          return;
        }
        if (event.name == 'draw.start') {
          vm.startDraw(event.draw, event.candidates);
        } else if (event.name == 'draw.stop') {
          vm.stopDraw(event.draw);
        }
      }
    });
  });

  vm.initDraw = function() {
    vm.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    vm.camera.position.z = 3000;
    vm.scene = new THREE.Scene();
    vm.renderer = new THREE.CSS3DRenderer();
    vm.renderer.setSize( window.innerWidth, window.innerHeight );
    vm.renderer.domElement.style.position = 'absolute';
    document.getElementById( 'container' ).appendChild( vm.renderer.domElement );

    vm.initHome();
    vm.animate();
  };

  vm.initHome = function() {
    var home = document.createElement( 'div' );
    home.className = 'home';
    var t1 = document.createElement( 'div' );
    t1.className = 't1';
    t1.textContent = '2018西山居年夜饭';
    home.appendChild( t1 );
    var t2 = document.createElement( 'div' );
    t2.className = 't2';
    t2.textContent = '幸运大抽奖';
    home.appendChild( t2 );
    var poweredby = document.createElement( 'div' );
    poweredby.className = 'poweredby';
    poweredby.textContent = 'Powered By 西山居技术中心';
    home.appendChild( poweredby );
    var github = document.createElement( 'div' );
    github.className = 'github';
    github.textContent = 'https://github.com/lishen-kingsoft/luckydraw3d';
    home.appendChild( github );

    vm.css3dHome = new THREE.CSS3DObject( home );
    vm.css3dHome.position.x = 0;
    vm.css3dHome.position.y = 0;
    vm.css3dHome.position.z = 1500;

    vm.scene.add(vm.css3dHome);

    vm.render();
  };

  vm.animate = function() {
    requestAnimationFrame( vm.animate );
    TWEEN.update();
  };

  vm.startDraw = function(rawDraw, rawCandidates) {
    vm.cleanScreen().then(function() {
      return vm.initCandidates(rawDraw, rawCandidates);
    }).then(function() {
      vm.wanderCandidates();
    });
    $('#bgm')[0].currentTime = 0;
    $('#bgm')[0].play();
    $('#video-bg')[0].play();
  };

  vm.stopDraw = function(rawDraw) {
    vm.removeCandidates();
    vm.sortCandidates(rawDraw);
    vm.noticeResults(rawDraw);
    $('#bgm')[0].pause();
    $('#video-bg')[0].pause();
    $timeout(function() {
      $('#done')[0].play();
    }, 100);
  };

  vm.noticeResults = function(rawDraw) {
    // var classes = ['三等奖', '二等奖', '一等奖', '特等奖', '神秘大奖'];
    // _.each(vm.candidates, function(candidate) {
    //   if(candidate.rawRtx && candidate.rawName && classes.indexOf(rawDraw.class) > -1) {
    //     HTTP.call('POST', 'http://it.xishanju.com:8081/apis/annualparty/sendLuckyDrawResult', {data: {
    //       userAccount: candidate.rawRtx,
    //       userName: candidate.rawName,
    //       roundName: rawDraw.class
    //     }}, function(result) {
    //       console.log(result);
    //     });
    //   }
    // });
  }

  vm.cleanScreen = function() {
    var promise = new Promise(function(resolve, reject) {
      TWEEN.removeAll();

      if (_.isEmpty(vm.candidates) && !vm.css3dTitle && !vm.css3dHome) {
        resolve();
      }

      if (vm.css3dHome) {
        var positionX = vm.css3dHome.position.x;
        var positionY = vm.css3dHome.position.y;
        var positionZ = cleanPositionZ;
        new TWEEN.Tween( vm.css3dHome.position )
          .to( { x: positionX, y: positionY, z: positionZ }, cleanDuration )
          .easing( TWEEN.Easing.Exponential.In )
          .onComplete(function() {
            vm.scene.remove(vm.css3dHome);
          })
          .start();
      }

      if (vm.css3dTitle) {
        var positionX = vm.css3dTitle.position.x;
        var positionY = vm.css3dTitle.position.y;
        var positionZ = cleanPositionZ;
        new TWEEN.Tween( vm.css3dTitle.position )
          .to( { x: positionX, y: positionY, z: positionZ }, cleanDuration )
          .easing( TWEEN.Easing.Exponential.In )
          .onComplete(function() {
            vm.scene.remove(vm.css3dTitle);
          })
          .start();
      }
      if (!_.isEmpty(vm.candidates)) {
        _.each(vm.candidates, function(candidate) {
          var positionX = candidate.position.x;
          var positionY = candidate.position.y;
          var positionZ = cleanPositionZ;
          new TWEEN.Tween( candidate.position )
            .to( { x: positionX, y: positionY, z: positionZ }, cleanDuration )
            .easing( TWEEN.Easing.Exponential.In )
            .onComplete(function() {
              _.each(vm.candidates, function(item) {
                vm.scene.remove(item);
              });
            })
            .start();
        });
      }
      new TWEEN.Tween( {} )
        .to( {}, cleanDuration )
        .onUpdate( vm.render )
        .start()
        .onComplete(function() {
          resolve();
        });
    });

    return promise;
  };

  vm.initCandidates = function(rawDraw, rawCandidates) {
    var promise = new Promise(function(resolve, reject) {
      vm.candidates = [];

      _.each(rawCandidates, function(rawCandidate, i) {
        var candidateEle = document.createElement( 'div' );
        candidateEle.id = rawCandidate._id;
        candidateEle.className = 'candidate';
        candidateEle.style.backgroundColor = 'rgba(10,174,235,' + ( Math.random() * 0.2 + 0.1 ) + ')';

        var sn = document.createElement( 'div' );
        sn.className = 'sn';
        sn.textContent = rawCandidate.sn;
        candidateEle.appendChild( sn );

        var name = document.createElement( 'div' );
        name.className = 'name';
        name.textContent = rawCandidate.name;
        if(rawCandidate.name.length > 10) {
          name.style = 'font-size: 24px;top: 55px;';
        }
        candidateEle.appendChild( name );

        var loc = document.createElement( 'div' );
        loc.className = 'loc';
        loc.textContent = rawCandidate.loc;
        candidateEle.appendChild( loc );

        var css3dCandidate = new THREE.CSS3DObject( candidateEle );
        vm.prepareCandidateWander(css3dCandidate);
        css3dCandidate.rawId = rawCandidate._id;
        css3dCandidate.rawRtx = rawCandidate.rtx;
        css3dCandidate.rawName = rawCandidate.name;
        css3dCandidate.lucky = (rawCandidate.laId == rawDraw._id || rawCandidate.gaId == rawDraw._id);

        vm.scene.add( css3dCandidate );

        vm.candidates.push(css3dCandidate);
      });

      vm.render();

      resolve();
    });
    return promise;
  };

  vm.prepareCandidateWander = function(candidate) {
    candidate.wander = {
      current : 0,
      times : Math.floor(Math.random() * 10) + 10,
      startX : (Math.random() * 1000 - 500),
      startY : (Math.random() * 1000 - 500),
      startZ : - (Math.random() * 15000 + 20000),
      endX : (Math.random() * 1000 - 500),
      endY : (Math.random() * 1000 - 500),
      endZ : Math.random() * 2000 + 2000
    };
    candidate.position.x = candidate.startX;
    candidate.position.y = candidate.startY;
    candidate.position.z = candidate.startZ;
    vm.render();
    return candidate.wander;
  };

  vm.wanderCandidates = function() {
    var moveStep = function(duration) {
      TWEEN.removeAll();
      _.each(vm.candidates, function(candidate, index) {
        if (candidate.wander.current >= candidate.wander.times) {
          vm.prepareCandidateWander(candidate);
        }
        candidate.wander.current += 1;

        var nextX = candidate.wander.startX + ((candidate.wander.endX - candidate.wander.startX) / candidate.wander.times * candidate.wander.current);
        var nextY = candidate.wander.startY + ((candidate.wander.endY - candidate.wander.startY) / candidate.wander.times * candidate.wander.current);
        var nextZ = candidate.wander.startZ + ((candidate.wander.endZ - candidate.wander.startZ) / candidate.wander.times * candidate.wander.current);

        new TWEEN.Tween( candidate.position )
          .to( { x: nextX, y: nextY, z: nextZ }, duration )
          .easing( TWEEN.Easing.Linear.None )
          .start();
      });
      new TWEEN.Tween( {} )
        .to( {}, duration )
        .onUpdate( vm.render )
        .start();
    }

      var duration = 200;
      moveStep(duration);
      vm.wanderInterval = $interval(function() {
        moveStep(duration);
      }, duration);
  };

  vm.removeCandidates = function() {
    _.each(vm.candidates, function(candidate) {
      if(!candidate.lucky) {
        vm.scene.remove( candidate );
      }
    });
    vm.candidates = _.filter(vm.candidates, function(candidate) {
      return candidate.lucky;
    });
  };

  vm.sortCandidates = function(rawDraw) {
    $interval.cancel(vm.wanderInterval);
    TWEEN.removeAll();

    var title = document.createElement( 'div' );
    title.className = 'title';
    var clazz = document.createElement( 'div' );
    clazz.className = 'clazz';
    clazz.textContent = rawDraw.class;
    title.appendChild( clazz );
    var round = document.createElement( 'div' );
    round.className = 'round';
    round.textContent = rawDraw.round;
    title.appendChild( round );
    vm.css3dTitle = new THREE.CSS3DObject( title );
    vm.css3dTitle.position.x = 0;
    vm.css3dTitle.position.y = 0;
    vm.css3dTitle.position.z = -9999;
    vm.scene.add(vm.css3dTitle);
    new TWEEN.Tween( vm.css3dTitle.position )
        .to( { x: 0, y: 120, z: 0 }, 500 )
        .easing( TWEEN.Easing.Linear.None )
        .start();

    _.each(vm.candidates, function(candidate, index) {
      var positionX = ( ( index % 10 ) * 200 ) - 900;
      var positionY = ( - ( Math.floor( index / 10 ) * 220 ) ) + 80;
      var positionZ = 1300;
      new TWEEN.Tween( candidate.position )
        .to( { x: positionX, y: positionY, z: positionZ }, 500 )
        .easing( TWEEN.Easing.Linear.None )
        .start();
      document.getElementById(candidate.rawId).style.backgroundColor = 'rgba(10,174,235,0.15)';
    });
    new TWEEN.Tween( {} )
      .to( {}, 500 )
      .onUpdate( vm.render )
      .start();
  };

  vm.render = function() {
    vm.renderer.render( vm.scene, vm.camera );
  };

  vm.initDraw();
}
