'use strict';

var ssFields = {
  "Object Number":"object_number",
  "Translation Text":"inscription.translation",
  "Language":"inscription.language",
  "Archeological Site":"production.place"
}

/* Controllers */

GlaserApp
.controller('GlaserStartList',['$scope','$http', '$state', 'opacsearch','$rootScope', function($scope, $http, $state, opacsearch, $rootScope){
  $scope.Model = {};
  $rootScope.loading.progress = true;
  opacsearch.updateSize("40");
  opacsearch.getRecordsbyPointer('collect','14',[] ,'1','40').then(
    function(res){
      var tiles = res.data.adlibJSON.recordList.record;
      for (var tile in tiles) {
        console.log(tiles[tile]['reproduction.reference']);
        tiles[tile]['reproduction.reference'][0] = encodeURI(tiles[tile]['reproduction.reference'][0]);
      }
      $scope.Model.PointerList = tiles;
      $rootScope.loading.progress = false;
    },
    function(err){ console.log('err: ', err); }
  );
}])
.controller('GlaserSearch',['$scope','$http', '$state', 'opacsearch', function($scope, $http, $state, opacsearch){
  $scope.Model = {};

  $scope.Model.total,$scope.Model.totalURI  = "counting..."
  opacsearch.getPointerList('collect','14').then(function(res){
    $scope.Model.total = res.data.adlibJSON.recordList.record[0]['hits'][0];
  });
  $scope.Model.osData = opacsearch;
  //this needs to contain normalization routines, autocompleters....
  //current setup: parsing querying composite index s1 for all terms entered
  $scope.simpleSearch = function () {
    $scope.Model.Result = {};
    $scope.Model.Query  = [];
    if ($scope.Model.keyword) {
      $scope.Model.keywords = $scope.Model.keyword.split(" ");
      $scope.Model.keywords.forEach(function(entry){
        $scope.Model.Query.push(JSON.parse('{"title":"'+entry+'"}'));
      });
      $scope.Model.Query.push(JSON.parse('{"title":"Wien I, Hofburg,*"}'));
      opacsearch.updateHistory($scope.Model.keyword, $scope.Model.Query, undefined, undefined);
      $state.go('gl.results', {queryID: "1", pageNo: "1"});
    }
  }
  $scope.advancedSearch = function (argument) {
    // body...
  }
  $scope.clearHistory = function(){
    opacsearch.clearHistory();
  }
}])
.controller('GlaserResultList',['$scope','$http', '$state', '$stateParams', 'opacsearch', '$rootScope', function($scope, $http, $state, $stateParams, opacsearch, $rootScope){
  //********* DECLARATIVE PART *********************************************
    $scope.Model = {};
    $scope.uiview = {"menuOpen":false};
    $scope.selected = [];
    $scope.uiview.currentView = Config.currentView;
    $scope.uiview.list = true;
    $scope.uiview.grid = false;
    $scope.Model.Pagesize = opacsearch.pagesize;
    $scope.Model.Page = $stateParams.pageNo;
    //************************************************************************
    // when pageing
    $scope.getPage = function(a,b) {
      if (opacsearch.pagesize != b) {
        opacsearch.updateSize(b);
        $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', opacsearch.history.query[$stateParams.queryID-1],"AND",undefined,[],$stateParams.pageNo);
        opacsearch.updatePage($stateParams.queryID-1, $stateParams.pageNo, $scope.promise);
        $scope.promise.then($scope.update);
      }
      else $state.go('gl.results', {queryID: $stateParams.queryID, pageNo: a});
    };
    //************************************************************************
    // when sorting
    $scope.getNewOrder = function(a) {
      if(a.slice(0,1) == "-") opacsearch.updateSorting('descending',a.slice(1));
      else if(a.slice(0,1) != "-") opacsearch.updateSorting('ascending',a);
      $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', opacsearch.history.query[$stateParams.queryID-1],"AND",undefined,[],$stateParams.pageNo);
      opacsearch.updatePage($stateParams.queryID-1, $stateParams.pageNo, $scope.promise);
      $scope.promise.then($scope.update);
    };
    //************************************************************************
    // generic page update
    $scope.update = function(res) {
      console.log(res);
      $scope.Model.Total = res.data.adlibJSON.diagnostic.hits;
      $scope.Model.Page = $stateParams.pageNo;
      $scope.Model.Pagesize = opacsearch.pagesize;
      var idx = res.data.adlibJSON.recordList.record.length-1;
      while(idx--) {
        res.data.adlibJSON.recordList.record[idx+1].link = encodeURI(res.data.adlibJSON.recordList.record[idx+1].Reproduction[0]["reproduction.reference"][0]);
      }
      $scope.Model.Result = res.data.adlibJSON.recordList.record;
      console.log($scope.Model.Result);
    };
    //************************************************************************
    // UI-switching
    $scope.onList = function(){
      $scope.uiview.currentView = 'list';
      Config.currentView = 'list';
    };
    $scope.onGrid = function(){
      $scope.uiview.currentView = 'grid';
      Config.currentView = 'grid';
    };
    $scope.vmToggle = function(){
      console.log($scope.uiview.menuOpen);
      if($scope.uiview.menuOpen) $scope.uiview.menuOpen=false;
      else $scope.uiview.menuOpen=true;
    }
  //********* END OF DECLARATIVE PART **************************************
  //************************************************************************
  $rootScope.loading.progress = true;
  opacsearch.getRecordsbyPointer('collect','14',[] ,'1','440').then(
    function(res){
      var tiles = res.data.adlibJSON.recordList.record;
      for (var tile in tiles) {
        //console.log(tiles[tile]['reproduction.reference']);
        tiles[tile].link = encodeURI(tiles[tile]['reproduction.reference'][0]);
      }
      $scope.Model.PointerList = tiles;
      $rootScope.loading.progress = false;
    },
    function(err){ console.log('err: ', err); }
  );
}])
.controller('GlaserSingleRecord', ['$scope', '$stateParams', 'opacsearch','GeoNamesServices','leafletData', 'leafletBoundsHelpers','ExistService', function($scope, $stateParams, opacsearch, GeoNamesServices, leafletData, leafletBoundsHelpers, ExistService) {
  $scope.Model = {refID: $stateParams.refID};
  $scope.markers = [];
  $scope.Manifest = [];
  $scope.references = [];
  $scope.hasTEI = function(){
    if($scope.Manifest && $scope.Manifest[$stateParams.refID]) return true;
    else return false;
  }
  if($stateParams.refID) {
    opacsearch.getSingleRecordbyRef("archive", $stateParams.refID, []).then(function(res){
      //splitting translation/transliteration by line,
      //should be delivered by API this way in the next version
      //--> to be xferred to exist API
      var rec = res.data.adlibJSON.recordList.record[0];
      if(res.data.adlibJSON.recordList.record[0]['inscription.translation']) {
        rec['inscription.translation'] = rec['inscription.translation'][0].split(/\d\./);
        rec['inscription.transliteration'] = rec['inscription.transliteration'][0].split(/\d\./);
        if(rec['inscription.transliteration'].length > 1) {
          rec['inscription.transliteration'].shift();
          rec['inscription.translation'].shift();
        }
      }
      //filtering out Zotero citations from the interpretation field
      if(rec['inscription.interpretation'][0]){
        var re = /(bib:[A-Z0-9]*)/g;
        var matches = rec['inscription.interpretation'][0].match(re);
        if(matches){
          var i = 1;
          matches = matches.filter( onlyUnique );
          matches.forEach(function(r){
            $scope.references.push(r.split(':')[1]);
            rec['inscription.interpretation'][0] = rec['inscription.interpretation'][0].replace(r, '-> Reference '+i+'\n');
            i++;
          });
        }
      }
      $scope.Model.SingleRecord = rec;
      console.log(rec['production.place.uri']);
      if(rec['production.place.uri'].length > 0 && rec['production.place.uri'][0] != "") {
        var recID = rec['production.place.uri'][0];
        if(!GeoNamesServices.geocache[recID] || !GeoNamesServices.geocache[recID]['$$state'] ){
          var promise = GeoNamesServices.getByID(recID);
          GeoNamesServices.addtoCache(recID, promise);
        }
        GeoNamesServices.geocache[recID].then(function(c){
          $scope.markers[recID] = {"lat":parseFloat(c.data.lat), "lng":parseFloat(c.data.lng), "message":rec['production.place'][0], "id": recID};
          leafletData.getMap('singlemap').then(function(map) {
            map.invalidateSize();
            map.panTo({"lat":parseFloat(c.data.lat), "lng":parseFloat(c.data.lng)});
            map.setZoom(6);
            $scope.markers[recID].focus = true;
          });
        });
      }
    });
    ExistService.getPage(1,200).then(function(res){$scope.Manifest = res;});
  }
}])
.controller('GlaserMap', ['$scope', '$stateParams', 'opacsearch', 'leafletData', 'leafletBoundsHelpers', 'GeoNamesServices', '$mdMedia', '$mdSidenav', '$state', '$rootScope', function($scope, $stateParams, opacsearch,leafletData, leafletBoundsHelpers, GeoNamesServices, $mdMedia, $mdSidenav, $state, $rootScope) {
  $rootScope.loading.progress = true;
  angular.extend($scope, {
    center: {},
    Model: {},
    markers: {},
    ssite:"",
    activeTab:0
  });
  var m = "";
  $scope.Model.total = opacsearch.getPointerList('archive','7');
  $scope.Model.totalURI = opacsearch.getRecordsbyPointer('archive','10', ['priref','production.place','production.place.lref','production.place.context','production.place.uri'], 1, 1000);
  $scope.Model.totalURI.then(function(res){
    $rootScope.loading.progress = false;
    res.data.adlibJSON.recordList.record.forEach(function(record){
      var recID = record['production.place.uri'][0];
      if(!GeoNamesServices.geocache[recID] || !GeoNamesServices.geocache[recID]['$$state'] ){
        var promise = GeoNamesServices.getByID(recID);
        GeoNamesServices.addtoCache(recID, promise);
      }
      GeoNamesServices.geocache[recID].then(function(c){
        if(!$scope.markers[recID]){
          $scope.markers[recID] = {"lat":parseFloat(c.data.lat), "lng":parseFloat(c.data.lng), "message":record['production.place'][0], "id": recID};
        }
        if($stateParams.placeID && $scope.markers[$stateParams.placeID] && m == "") {
          m = leafletData.getMap('mainmap').then(function(map) {
            $scope.ssite = $stateParams.placeID;
            $scope.selSite($stateParams.placeID);
            map.invalidateSize();
            map.panTo({"lat":parseFloat('14.5'), "lng":parseFloat('45.5')});
            map.setZoom(8);
          });
          $scope.$on('leafletDirectiveMarker.mainmap.click', function(event, args){
            $scope.selSite(args.modelName);
          });
        }
        else if(!$stateParams.placeID && m == ""){
          m = leafletData.getMap('mainmap').then(function(map) {
            map.invalidateSize();
            map.panTo({"lat":parseFloat('14.5'), "lng":parseFloat('45.5')});
            map.setZoom(8);
          });
          $scope.$on('leafletDirectiveMarker.mainmap.click', function(event, args){
            $scope.selSite(args.modelName);
          });
        }
      });
    });
  });
  $scope.selSite = function(site){
    if($scope.ssite) $scope.markers[$scope.ssite].focus = false;
    $state.go('gl.map',{placeID: site},{notify:false});
    $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', [{"production.place":$scope.markers[site].message},{"part_of_reference":"*BA-3-27-A*"}],"AND",undefined,[],1,100).then($scope.update);
    $scope.markers[site].focus = true;
    $scope.activeTab = 1;
    $scope.ssite = site;
  }
  //************************************************************************
  //Squeeze list
  // when sorting
  $scope.getNewOrder = function(a) {
    if(a.slice(0,1) == "-") opacsearch.updateSorting('descending',a.slice(1));
    else if(a.slice(0,1) != "-") opacsearch.updateSorting('ascending',a);
    $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', [{"s1":"[bib:"+$stateParams.key+"]"},{"part_of_reference":"*BA-3-27-A*"}],"AND",undefined,[],1,100).then($scope.update);
  };
  //************************************************************************
  // generic page update
  $scope.update = function(res) {
    $scope.Model.Total = res.data.adlibJSON.diagnostic.hits;
    $scope.Model.Page = 1;
    $scope.Model.Pagesize = 100;
    $scope.Model.Result = res.data.adlibJSON.recordList.record;
  };
  // is-locked-open doesn't seem to work in
  $scope.$watch(function() { return $mdMedia('gt-sm'); }, function(big) {
    $scope.big = big;
  });
}])
.controller('GlaserNav', ['$scope', '$timeout', '$mdSidenav', '$http', '$log', '$rootScope', function ($scope, $timeout, $mdSidenav, $http, $log, $rootScope) {
    $scope.Model = {};
    $rootScope.loading = {progress:false}
    $http.get('static/menu.json').then(
      function(res){
        $scope.Model.Menu = res.data;
      },
      function(err){ console.log('err: ', err); }
    );
    $scope.toggleLeft = function () {
      if(!$mdSidenav('sidenav').isOpen()) {$('#sidebar').addClass('open');}
      else {$('#sidebar').removeClass('open');}
      $mdSidenav('sidenav').toggle();
    };
}])
.controller('GlaserImage', ['$scope', '$timeout', '$stateParams', '$http', '$log', function ($scope, $timeout, $stateParams, $http, $log) {
    $scope.Model = {};
    $scope.Model.imgID = $stateParams.imgID;
}])
.controller('GlaserAbout', ['$scope', '$timeout', '$stateParams', '$http', '$log', function ($scope, $timeout, $stateParams, $http, $log) {
    $scope.Model = {};
}])
.controller('GlaserBib', ['$scope', '$http', '$log', 'ZoteroService', function ($scope, $http, $log, ZoteroService) {
  //********* DECLARATIVE PART *********************************************
    $scope.Model = {Page:1};
    $scope.uiview = {"menuOpen":false};
    $scope.selected = [];
    $scope.uiview.currentView = Config.currentView;
    $scope.uiview.list = true;
    $scope.uiview.grid = false;
    $scope.Model.Pagesize = ZoteroService.ZoteroConfig.BASEPARAMS.limit;
    //************************************************************************
    // when pageing
    $scope.getPage = function(a,b) {
      console.log(a,b);
      if (ZoteroService.ZoteroConfig.BASEPARAMS.limit != b) {
        ZoteroService.updateSize(b);
      }
      if (ZoteroService.ZoteroConfig.BASEPARAMS.start != a*b) {
        ZoteroService.updateStart((a-1)*b);
      }
      $scope.Model.Page = a;
      $scope.promise = ZoteroService.getList({path:'users/3808523/items/'}).then($scope.update);
    };
    //************************************************************************
    // when sorting
    $scope.getNewOrder = function(a) {
      if(a.slice(0,1) == "-") ZoteroService.updateSorting('desc',a.slice(1));
      else if(a.slice(0,1) != "-") ZoteroService.updateSorting('asc',a);
      $scope.promise = ZoteroService.getList({path:'users/3808523/items/'}).then($scope.update);
    };
    //************************************************************************
    // generic page update
    $scope.update = function(res) {
      console.log(res);
      $scope.Model.Total = res.headers('Total-Results');
      $scope.Model.Pagesize = ZoteroService.ZoteroConfig.BASEPARAMS.limit;
      $scope.Model.Result = res.data;
      console.log($scope.Model.Result);
    };
  //********* END OF DECLARATIVE PART **************************************
  $scope.promise = ZoteroService.getList({path:'users/3808523/items/'}).then($scope.update);
}])
.controller('GlaserSingleBib', ['$scope', '$stateParams', 'ZoteroService','opacsearch', function($scope, $stateParams, ZoteroService, opacsearch) {
  $scope.Model = {};
  //************************************************************************
  // when sorting
  $scope.getNewOrder = function(a) {
    if(a.slice(0,1) == "-") opacsearch.updateSorting('descending',a.slice(1));
    else if(a.slice(0,1) != "-") opacsearch.updateSorting('ascending',a);
    $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', [{"s1":"[bib:"+$stateParams.key+"]"},{"part_of_reference":"*BA-3-27-A*"}],"AND",undefined,[],1,100).then($scope.update);
  };
  //************************************************************************
  // generic page update
  $scope.update = function(res) {
    console.log(res);
    $scope.Model.Total = res.data.adlibJSON.diagnostic.hits;
    $scope.Model.Page = 1;
    $scope.Model.Pagesize = 100;
    $scope.Model.Result = res.data.adlibJSON.recordList.record;
    console.log($scope.Model.Result);
  };
  if($stateParams.key && $stateParams.user) {
    ZoteroService.getItem('users/'+$stateParams.user+'/items/'+$stateParams.key).then(function(res){
      $scope.Model.SingleRecord = res;
      console.log($scope.Model.SingleRecord);
    });
    $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', [{"s1":"[bib:"+$stateParams.key+"]"},{"part_of_reference":"*BA-3-27-A*"}],"AND",undefined,[],1,100).then($scope.update);
  }
}])
.controller("BibByPath", function($scope, $attrs, ZoteroService) {
	$scope.entity = {};
	$attrs.$observe('path', function(val){
    try {
			var obj = JSON.parse(val);
		} catch (e) {
      console.log("template error:", e);
			return {};
		}
    if(!obj.users || obj.users=="") obj.users = ZoteroService.ZoteroConfig.BASEPARAMS.defaultlib;
    ZoteroService.getItem('users/'+obj.users+'/items/'+obj.items).then(function(res){
      $scope.bib = res;
    });
	});
})
.controller('GlaserScan', ['$scope', '$timeout', '$stateParams', '$http', '$log', function ($scope, $timeout, $stateParams, $http, $log) {
    $scope.Model = {};
    $scope.Model.scanID = $stateParams.scanID;
    var presenter = null;
    init3dhop();
    setup3dhop($scope.Model.scanID);
    resizeCanvas(window.innerWidth-100, window.innerHeight-4);
}])
.controller('GlaserTei', ['$scope', '$stateParams', 'opacsearch', 'leafletData', 'leafletBoundsHelpers', 'ExistService', '$mdMedia', '$mdSidenav', '$state', 'TEI', function($scope, $stateParams, opacsearch,leafletData, leafletBoundsHelpers, ExistService, $mdMedia, $mdSidenav, $state, TEI) {
  $scope.id = $stateParams.id;
  if(!$stateParams.id) $scope.currentLink = "";
  $scope.selSite = function(id){
    $scope.id = id;
    ExistService.getItem(id).then(function(res){
      $scope.currentLink = $state.href("gl.singleRecord", {refID: id});
      $state.go('gl.tei',{id: id},{notify:false});
      $scope.xmlstr = res;
    });
  }
  //********* DECLARATIVE PART *********************************************
    $scope.Model = {};
    $scope.Model.Pagesize = ExistService.ExistConfig.PAGESIZE;
    $scope.Model.Page = 1;
    //************************************************************************
    // when pageing
    $scope.getPage = function(a,b) {
      $scope.Model.Page = a;
      ExistService.ExistConfig.PAGESIZE = b;
      $scope.Model.Pagesize = b;
      $scope.promise = ExistService.getPage(a, b);
      $scope.promise.then($scope.update);
    };
    //************************************************************************
    // when sorting
    //TODO: awaiting peters implementation
    // $scope.getNewOrder = function(a) {
    //   if(a.slice(0,1) == "-") opacsearch.updateSorting('descending',a.slice(1));
    //   else if(a.slice(0,1) != "-") opacsearch.updateSorting('ascending',a);
    //   $scope.promise = opacsearch.getRecordsbyIndex('collect.inf', opacsearch.history.query[$stateParams.queryID-1],"AND",undefined,[],$stateParams.pageNo);
    //   opacsearch.updatePage($stateParams.queryID-1, $stateParams.pageNo, $scope.promise);
    //   $scope.promise.then($scope.update);
    // };
    //************************************************************************
    // generic page update
    $scope.update = function(res) {
      $scope.Model.Result = res;
      $scope.Model.Total = ExistService.Meta.HITS;
      if($stateParams.id) $scope.selSite($stateParams.id);
    };
    //************************************************************************
    // prelim markup from TEI function
    $scope.makeMarkup = function(tei){
      console.log(tei);
      var markup="";
      var idx = tei.children.length;
      var le = tei.children.length-1;
      while(idx--) {
        var a = tei.children[le-idx];
        //console.log(a);
        if(a.nodeName=="tei:lb") markup = markup + "<br><br>";
        else if (a.nodeName=="w") markup = markup + "<a target='_blank' href='http://www.ruzicka.net:8180/kalam/servlet/kalam?op=showhtml&dictionary=yes&word="+ encodeURIComponent(TEI.cleanString(a.innerHTML)) +"'>"+ a.innerHTML +"</a>"
        else if (a.nodeName=="w" && a.children.length==0) markup = markup + "<a target='_blank' href='http://www.ruzicka.net:8180/kalam/servlet/kalam?op=showhtml&dictionary=yes&word="+ encodeURIComponent(TEI.cleanString(a.innerHTML)) +"'>"+ a.innerHTML +"</a>"
      }
      return markup;
    }
  ////////////////////////////////////////////////////////////////////////////
  $scope.promise = ExistService.getPage();
  $scope.promise.then($scope.update);
  // $mdMedia quickfix
  //TODO: find out why mdMedia return values are garbled in subscopes
  $scope.$watch(function() { return $mdMedia('gt-sm'); }, function(big) {
    $scope.big = big;
  });

}])
.controller("SqueezeByAttr", function($scope, opacsearch, $attrs) {
	$scope.squeeze = {};
	$attrs.$observe('squeezeid', function(val){
    opacsearch.getSingleRecordbyRef("archive", val, []).then(function(res){
      //console.log(res);
      $scope.squeeze = res.data.adlibJSON.recordList.record[0];
    });
	});
})
//******************* helpers ***************************************************
//helper function for deduplication, this should go elsewhere, i smell scope soup
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
