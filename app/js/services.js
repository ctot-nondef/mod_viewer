'use strict';

/* Adlib API Query Services Module */

var Config = {
    "baseURL":"http://opacikm.w07adlib1.arz.oeaw.ac.at/wwwopac.ashx?",
    "pagesize": 40,
    "sortField":"title",
    "sortOrder":"ascending",
    "currentView":"list",
    "localStorage":"GlaserStorage",
    "geoNamesID":"oeaw_adlib"
}


var AdlibServices = angular.module('AdlibServices', ['ngStorage']);

AdlibServices.service('opacsearch', ['$http', '$localStorage' ,function($http,$localStorage){
	if(!$localStorage[Config.localStorage]) $localStorage[Config.localStorage] = {};
	if($localStorage[Config.localStorage]['history']) this.history = $localStorage[Config.localStorage]['history'];
	else {
		var obj = {"history":{"querystring":[],"query":[],"result":[]}}
		$localStorage[Config.localStorage] = obj;
		this.history = $localStorage[Config.localStorage]['history'];
	}
	this.pagesize = Config.pagesize;
	this.sortField = Config.sortField;
	this.sortOrder = Config.sortOrder;
	//////////Parameter Parsers///////////////////////////////
		this.parseFields = function(fields){
			var fieldstring = "";
			if(fields && fields != []) {
				fieldstring +="&fields=";
				fields.forEach(function(field){
					fieldstring += field+",%20"
				})
			}
			return fieldstring;
		}
		this.parseLimit = function(limit,page){
			var limitstring = "";
			if (!limit) var limit = this.pagesize;
			if (!page) var page = 1;
			var skip = (page-1) * limit + 1;
			limitstring = "&limit="+limit+"&startfrom="+skip;
			return limitstring;
		}
		this.parseDB = function(database){
			var dbString = "";
			if(database && database != "") dbString += "&database="+database;
			return dbString;
		}
		this.parseSorting = function(){
			var sortString = "";
			return "%20sort%20"+this.sortField+"%20"+this.sortOrder;
		}
	//////////Callable retrieval functions///////////////////////////////
		this.getFullListbyDB = function(database, fields, page, limit){console.log('getFullList Query: ', database, fields, page, limit);
			return $http.get(Config.baseURL+"&action=search&search=all"+this.parseSorting()+"&output=JSON"+this.parseLimit(limit,page)+this.parseDB(database)+this.parseFields(fields));
		}
		this.getPointerList = function(database, pointerfile ){console.log('getPointerList Query: ', database, pointerfile );
			if(pointerfile) return $http.get(Config.baseURL+"&command=getpointerfile&number="+pointerfile+"&output=JSON"+this.parseDB(database));
			else console.log('Parameters Missing');
		}
		this.getRecordsbyPointer = function(database, pointerfile, fields, page, limit){console.log('getRecordsbyPointer Query: ', database, pointerfile, fields, page, limit);
			if(pointerfile) return $http.get(Config.baseURL+"&action=search&search=pointer "+pointerfile+"&output=JSON"+this.parseLimit(limit,page)+this.parseDB(database)+this.parseFields(fields));
			else console.log('Parameters Missing');
		}
		this.getSingleRecordbyRef = function(database, reference, fields){console.log('getSingleRecord Query: ', database, reference, fields);
			if(reference) return $http.get(Config.baseURL+"&action=search&search=priref="+reference+"&output=JSON"+this.parseDB(database)+this.parseFields(fields));
			else console.log('Parameters Missing');
		}
		this.getRecordsbyIndex = function(database, index, logic, pointer, fields, page, limit){console.log('getRecordsbyIndex Query: ', database, index, logic, pointer, page, fields, limit);
			if(!logic) logic = "OR";
			if(index) {
				var searchstring = "";
				index.forEach(function(query){
					for(var key in query) {
						if(searchstring != "") searchstring += "%20"+logic+"%20";
						searchstring += key+"=%27"+query[key]+"%27";
					}
				});
				if(pointer) {
					searchstring = "(pointer%20"+pointer+")%20AND%20("+searchstring +")";
				}
				return $http.get(Config.baseURL+"&action=search&search="+searchstring+this.parseSorting()+"&output=JSON"+this.parseLimit(limit,page)+this.parseDB(database)+this.parseFields(fields));
			}
			else console.log('Parameters Missing');
		}
	//////////// Parameter getters / setters ///////////////////////////////
		this.updateHistory = function(string, query, page, result){console.log('addtoHistory: ', query, result);
			this.history.querystring.unshift(string);
			this.history.query.unshift(query);
			if(page && result) {
				var obj = {};
				obj[page] = result;
				this.history.result.unshift(obj);
			}
			else this.history.result.unshift({});
		}
		this.clearHistory = function(){console.log('clearing History upon user request.');
			$localStorage[Config.localStorage]['history'] = {"querystring":[],"query":[],"result":[]};
			this.history = $localStorage[Config.localStorage]['history'];
		}
		this.updatePage = function(queryno, page, result){console.log('updatePage: ', queryno, page, result);
			if(this.history.result[queryno]) {
				this.history.result[queryno][page] = result;
			}
			else {
				var obj = {};
				obj[page] = result;
				this.history.result[queryno] = obj;
			}
		}
		this.updateSize = function(newsize){console.log('updateSize: ', newsize);
			this.pagesize = newsize;
			$localStorage[Config.localStorage]['history']['result'] = [];
			this.history = $localStorage[Config.localStorage]['history'];
		};
		this.updateSorting = function(sort, field){console.log('updateSorting: ', sort, field);
			this.sortOrder = sort;
			this.sortField = field;
			this.history.result = [];
		}
}]);

AdlibServices.service('contentrtrvl', ['$http', '$q', function($http, $q){
	var getImage = function(id,width,height,scalemode,fillmode){console.log('getFullList Query: ', database);
		if(database) var promise = $http.get(Config.baseURL+"database="+database+"&search=all&output=JSON&limit=1000");
		else var promise = $http.get(Config.baseURL+"search=all&output=JSON&limit=1000");
		return promise;
	};
	return {
	  	FullList: getFullList,
	  	PointerList: getPointerList,
	  	SingleRecord: getSingleRecord
  	};
}]);


///////////////// GeoNames Service Module
//TODO: move to separate file
var GeoNamesServices = angular.module('GeoNamesServices', ['ngStorage']);

GeoNamesServices.service('GeoNamesServices', ['$http', '$localStorage', '$q', function($http, $localStorage, $q){
	if(!$localStorage[Config.localStorage]) $localStorage[Config.localStorage] = {};
	if($localStorage[Config.localStorage]['geocache']) var geocache = $localStorage[Config.localStorage]['geocache'];
	else {
		$localStorage[Config.localStorage]['geocache'] = {};
		var geocache = $localStorage[Config.localStorage]['cache'];
	}
	var getByID = function(id){console.log('GeoNames getByID: ', id);
		if(Number.isInteger(parseInt(id)) && (!this.geocache[id] || !this.geocache[id]['$$status'])) {
			var promise = $http.get("http://api.geonames.org/getJSON?formatted=true&geonameId="+id+"&username="+Config.geoNamesID);
			return promise;
		}
		if(id && this.geocache.id) return this.geocache.id;
		if(!Number.isInteger(id)) return $q.reject("invalid Parameters");
	}
	var addtoCache = function(ID, promise){console.log('addtoCache', promise);
		if(ID && promise ){
			this.geocache[ID] = promise;
		}
	}
	var clearCache = function(){console.log('clearing geocache upon user request');
		if($localStorage[Config.localStorage]['geocache']) $localStorage[Config.localStorage]['geocache'] = {};
		this.geocache = $localStorage[Config.localStorage]['geocache'];
	}
	return {
	  	getByID: getByID,
	  	addtoCache: addtoCache,
	  	geocache: geocache,
	  	clearCache: clearCache
  	};
}]);

/**
 * Service providing convenience Methods and Cacheing for the zotero webservices API
 */
var ZoteroService = angular.module('ZoteroService', ['ngStorage']);
ZoteroService.service('ZoteroService', function($http, $localStorage, $q, $log){
	this.ZoteroConfig = {
		BASEURL : "https://api.zotero.org/",
		BASEPARAMS : {
      "format":"json",
      "sort":"title",
      "limit":10,
      "direction":"asc",
      "start":0,
      "defaultlib":"3808523"
		}
	}
	this.initStorage = function(){$log.debug('initializing local storage');
		if(!$localStorage[Config.LOCALSTORAGE]) $localStorage[Config.LOCALSTORAGE] = {};
		if($localStorage[Config.LOCALSTORAGE]['zoterocache']) this.zoterocache = $localStorage[Config.LOCALSTORAGE]['zoterocache'];
		else {
			$localStorage[Config.LOCALSTORAGE]['zoterocache'] = {};
			this.zoterocache = $localStorage[Config.LOCALSTORAGE]['zoterocache'];
		}
	}
  this.getList = function(inputparams){$log.debug('GeoNames getList: ', inputparams);
		var params = JSON.parse(JSON.stringify(this.ZoteroConfig.BASEPARAMS));
		Object.assign(params, inputparams);
		return $q(function(resolve, reject){
			$http.get(
				this.ZoteroConfig.BASEURL+params.path,
				{
					params: params
				}
			).then(
			function(res){
        resolve(res);
			}.bind(this),
			function(err){
				reject(err);
			});
		}.bind(this));
	}
	this.getItem = function(path){$log.debug('GeoNames getByID: ', path);
		return $q(function(resolve, reject){
			if(this.zoterocache[path]) resolve(this.zoterocache[path]);
			else if(!this.zoterocache[path]) {
				$http.get(
					this.ZoteroConfig.BASEURL+path,
					{
					}
				).then(
				function(res){
            console.log(res);
            resolve(res.data);
            //this.zoterocache[params.geonameId] = res.data;
				}.bind(this),
				function(err){
					reject(err);
				});
			}
		}.bind(this));
	}
  this.updateSize = function(newsize){
    this.ZoteroConfig.BASEPARAMS.limit = newsize;
    return this.ZoteroConfig.BASEPARAMS.limit;
  }
  this.updateSorting = function(direction,param){
    this.ZoteroConfig.BASEPARAMS.direction = direction;
    this.ZoteroConfig.BASEPARAMS.sort = param;
    return {direction:this.ZoteroConfig.BASEPARAMS.direction, sort:this.ZoteroConfig.BASEPARAMS.sort  }
  }
  this.updateStart = function(start){
    this.ZoteroConfig.BASEPARAMS.start = start;
    return this.ZoteroConfig.BASEPARAMS.start;
  }
  this.initStorage();
});

/**
 * Service providing convenience Methods and Cacheing for the ExistDB API
 */
var ExistService = angular.module('ExistService', ['ngStorage']);
ExistService.service('ExistService', function($http, $localStorage, $q, $log){
  this.Manifest = $q;
  this.Meta = {HITS:0}
  this.ExistConfig = {
		BASEURL : "https://glaser-tei.acdh.oeaw.ac.at/exist/restxq/glaser-tei/done/",
    PAGESIZE: 10
	}
	this.initStorage = function(){$log.debug('initializing local storage');
		if(!$localStorage[Config.LOCALSTORAGE]) $localStorage[Config.LOCALSTORAGE] = {};
		if($localStorage[Config.LOCALSTORAGE]['existcache']) this.existcache = $localStorage[Config.LOCALSTORAGE]['existcache'];
		else {
			$localStorage[Config.LOCALSTORAGE]['existcache'] = {};
			this.existcache = $localStorage[Config.LOCALSTORAGE]['existcache'];
		}
    //TODO: make TEI records queryable by ID
    //as the single record id_s are not trivial since they contain the ingest time/database
    //well have to fetch the entire manifest in the beginning to have the proper urls independent of the current page
    this.Manifest = $q(function(resolve, reject){
      $http.get(this.ExistConfig.BASEURL+'json?page[number]=1&page[size]=1000').then(function(res){
        var idx = res.data.data.length;
        var m = {};
        while(idx--){
          var key = res.data.data[idx].id.split('_')[0];
          m[key] = res.data.data[idx];
        }
        this.Meta.HITS = res.data.meta.hits;
        resolve(m);
      }.bind(this));
    }.bind(this));
	}
  this.getPage = function(pageno, pagesize){$log.debug('fetching Exist Page', pageno, pagesize);
    if(!pageno) pageno = 1;
    if(!pagesize) pagesize = this.ExistConfig.PAGESIZE;
		return $q(function(resolve, reject){
			$http.get(
				this.ExistConfig.BASEURL+'json'+'?page[number]='+pageno+'&page[size]='+pagesize,
				{
				}
			).then(
			function(res){
        this.Page = {};
        var idx = res.data.data.length;
        while(idx--){
          var key = res.data.data[idx].id.split('.')[0];
          this.Page[key] = res.data.data[idx];
        }
        this.Meta.HITS = res.data.meta.hits;
        resolve(this.Page);
			}.bind(this),
			function(err){
				reject(err);
			});
		}.bind(this));
	}
	this.getItem = function(id, format){console.log('Exist getByID: ', id, format);
    if(!format) var format = "xml";
		return $q(function(resolve, reject){
			if(this.existcache[id]) resolve(this.existcache[id]);
			else if(!this.existcache[id]) {
        this.Manifest.then(function(m){
          $http.get(
  					this.ExistConfig.BASEURL+id+'.xml/'+format,
  				).then(
  				function(res){
              resolve(res.data);
  				}.bind(this),
  				function(err){
  					reject(err);
  				});
        }.bind(this));
			}
		}.bind(this));
	}
  this.updatePage = function(queryno, page, result){console.log('updatePage: ', queryno, page, result);
    if(this.history.result[queryno]) {
      this.history.result[queryno][page] = result;
    }
    else {
      var obj = {};
      obj[page] = result;
      this.history.result[queryno] = obj;
    }
  }
  this.updateSize = function(newsize){console.log('updateSize: ', newsize);
    this.pagesize = newsize;
    $localStorage[Config.localStorage]['history']['result'] = [];
    this.history = $localStorage[Config.localStorage]['history'];
  };
  this.initStorage();
});
