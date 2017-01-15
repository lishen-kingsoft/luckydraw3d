'use strict';
'ngInject';

import { Meteor } from 'meteor/meteor';

import { Events } from '/imports/api/events';

import * as THREE from 'three/build/three';
import * as TWEEN from 'tween.js/src/Tween';

export default function($scope, $meteor, $reactive, $timeout, $interval) {
  
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
    
    vm.animate();
  };

  vm.animate = function() {
    requestAnimationFrame( vm.animate );
    TWEEN.update();
  };

  vm.startDraw = function(rawDraw, rawCandidates) {
    vm.cleanScreen().then(function() {
      return vm.initCandidates(rawDraw, rawCandidates);
    }).then(function() {
      return vm.pullcloseCandidates(500);
    }).then(function() {
      vm.wanderCandidates();
    });
  };

  vm.stopDraw = function(rawDraw) {
    vm.removeCandidates();
    vm.sortCandidates(rawDraw);
  };

  vm.cleanScreen = function() {
    var promise = new Promise(function(resolve, reject) {
      TWEEN.removeAll();

      if (_.isEmpty(vm.candidates)) {
        resolve();
      } else {
        var positionX = -100000;
        var positionY = vm.css3dTitle.position.y;
        var positionZ = vm.css3dTitle.position.z;
        new TWEEN.Tween( vm.css3dTitle.position )
          .to( { x: positionX, y: positionY, z: positionZ }, 500 )
          .easing( TWEEN.Easing.Exponential.In )
          .start();
        _.each(vm.candidates, function(candidate) {
          var positionX = -100000;
          var positionY = candidate.position.y;
          var positionZ = candidate.position.z;
          new TWEEN.Tween( candidate.position )
            .to( { x: positionX, y: positionY, z: positionZ }, 500 )
            .easing( TWEEN.Easing.Exponential.In )
            .start();
        });
        new TWEEN.Tween( {} )
          .to( {}, 500 )
          .onUpdate( vm.render )
          .start()
          .onComplete(function() {
            _.each(vm.candidates, function(item) {
              vm.scene.remove(item);
              vm.scene.remove(vm.css3dTitle);
            });
            resolve();
          });
      }
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
        candidateEle.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';

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
        css3dCandidate.position.x = ( ( i % 7 ) * 400 ) - 1200;
        css3dCandidate.position.y = ( - ( Math.floor( i / 7 ) % 5 ) * 400 ) + 800;
        css3dCandidate.position.z = ( - ( Math.floor(i / 35) * 500 ) ) + 8500;
        css3dCandidate.rawId = rawCandidate._id;
        css3dCandidate.lucky = (rawCandidate.laId == rawDraw._id || rawCandidate.gaId == rawDraw._id);
        vm.scene.add( css3dCandidate );

        vm.candidates.push(css3dCandidate);
      });

      vm.render();

      resolve();
    });
    return promise;
  };

  vm.pullcloseCandidates = function(duration) {
    var promise = new Promise(function(resolve, reject) {
      TWEEN.removeAll();
      _.each(vm.candidates, function(candidate) {
        new TWEEN.Tween( candidate.position )
          .to( { x: candidate.position.x, y: candidate.position.y, z: candidate.position.z - 8000 }, Math.random() * duration + duration )
          .easing( TWEEN.Easing.Circular.Out )
          .start();
      });
      new TWEEN.Tween( {} )
        .to( {}, duration * 2 )
        .onUpdate( vm.render )
        .start()
        .onComplete(function() {
          resolve();
      });
    });

    return promise;
  };

  vm.wanderCandidates = function() {
    var getRandom = function(number) {
        var r = number + ((Math.random() - 0.5) * 5000);
        if(r < -2000) {
          r = -2000;
        } else if(r > 2000) {
          r = 2000;
        }
        return r;
    }

    var moveFirst = function(duration, cb) {
      TWEEN.removeAll();
      _.each(vm.candidates, function(candidate) {
        var positionX = getRandom(candidate.position.x);
        var positionY = getRandom(candidate.position.y);
        var positionZ = getRandom(candidate.position.z);
        new TWEEN.Tween( candidate.position )
          .to( { x: positionX, y: positionY, z: positionZ }, duration )
          .easing( TWEEN.Easing.Exponential.In )
          .start();
      });
      new TWEEN.Tween( {} )
        .to( {}, duration )
        .onUpdate( vm.render )
        .start()
        .onComplete(cb);
    }

    var moveStep = function(duration) {
      TWEEN.removeAll();
      _.each(vm.candidates, function(candidate) {
        var positionX = getRandom(candidate.position.x);
        var positionY = getRandom(candidate.position.y);
        var positionZ = getRandom(candidate.position.z);
        new TWEEN.Tween( candidate.position )
          .to( { x: positionX, y: positionY, z: positionZ }, duration )
          .easing( TWEEN.Easing.Linear.None )
          .start();
      });
      new TWEEN.Tween( {} )
        .to( {}, duration )
        .onUpdate( vm.render )
        .start();
    }

    moveFirst(1000, function() {
      var duration = 1000;
      moveStep(duration);
      vm.wanderInterval = $interval(function() {
        moveStep(duration);
      }, duration);
    });
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
        .to( { x: 0, y: 120, z: 2500 }, 500 )
        .easing( TWEEN.Easing.Linear.None )
        .start();

    _.each(vm.candidates, function(candidate, index) {
      var positionX = ( ( index % 10 ) * 200 ) - 900;
      var positionY = ( - ( Math.floor( index / 10 ) * 220 ) ) + 80;
      var positionZ = 1400;
      new TWEEN.Tween( candidate.position )
        .to( { x: positionX, y: positionY, z: positionZ }, 500 )
        .easing( TWEEN.Easing.Linear.None )
        .start();
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