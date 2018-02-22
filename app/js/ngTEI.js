var ngTEI = angular.module('ngTEI', [
  'ngSanitize', 'ngMaterial'
]);


/**
 * Service providing a set convenience Methods to transform a TEI document
 * into a compilable template
 * init() needs to be called from router before use!
 */
ngTEI.service('TEI', function($http, $localStorage, $q, $log){
	this.CONFIG = {
    load:{
      CharReplaceTable:'static/coderep.json',
      TEIConfigObject:'static/TEIconfig.json',
      TEISpecObject:'http://www.tei-c.org/Vault/P5/3.1.0/xml/tei/odd/p5subset.json'
    }
  }
  //init function, should be called before controller initialisation (resolve param in router!!)
  //loads all nec configurations
  this.init = function(){
    return $q(function(resolve, reject){
      var promises = {};
      for (var url in this.CONFIG.load) {
        promises[url] = $http.get(this.CONFIG.load[url]);
      }
      $q.all(promises).then((values) => {
        for (var v in values) {
          this.CONFIG[v] = values[v].data;
        }
        var idx = this.CONFIG.TEISpecObject.members.length;
        var spec = this.CONFIG.TEISpecObject.members;
        var s = {};
        while(idx--){
          if(spec[idx].type == "elementSpec") s[spec[idx].ident] = spec[idx];
        }
        this.CONFIG.elements = s;
        resolve(values);
      })
    }.bind(this));
  }
  //convenience method accepts and xml doc and returns markup acc to the config object
  //in CONFIG.TEIConfigObject
  this.makeMarkup = function(doc){
    var oParser = new DOMParser();
    var oSerializer = new XMLSerializer();
    //removing namespaces
    doc = doc.replace(/<([a-zA-Z0-9 ]+)(?:xml)ns=\".*\"(.*)>/g, "<$1$2>");
    let xml = oParser.parseFromString(doc, "text/xml").querySelector("TEI");
    let ti = this.CONFIG.TEIConfigObject.length;
    let tidx = this.CONFIG.TEIConfigObject.length;
    while(tidx--) {
      let s = this.CONFIG.TEIConfigObject[ti-tidx-1];
      let ai = s.actions.length;
      let aidx = s.actions.length;
      while(aidx--) {
        let tr = s.actions[ai-aidx-1];
        let nl = xml.querySelectorAll(s.selector);
        let els = [];
        for(var i = nl.length; i--; els.unshift(nl[i]));
        let idx = els.length;
        while(idx--){
          //DELETE ATTRIBUTES FROM CONFIG
          if(tr.removeAttribute){
            let ida = tr.removeAttribute.length;
            while(ida--){
              els[idx].removeAttribute(removeAttribute[ida]);
            }
          }
          //SETTING ATTRIBUTES FROM CONFIG
          if(tr.setAttribute){
            for (var a in tr.setAttribute) {
              els[idx].setAttribute(a, tr.setAttribute[a]);
            }
          }
          //WRAP CONTENT IN A SPECIFIED ELEMENT
          if(tr.wrapContent){
            let newElement = document.createElementNS('http://www.w3.org/1999/xhtml',tr.wrapContent.tag);
            for (var a in tr.wrapContent.attributes) {
              newElement.setAttribute(a, tr.wrapContent.attributes[a]);
            }
            newElement.innerHTML = els[idx].innerHTML;
            els[idx].innerHTML = newElement.outerHTML;
          }
          //INSERTS A DIV WITH SPECIFIED MARKUP AT SPECIFIED POSITION
          //SEE LIST OF AVAILABLE POSITIONS AT https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
          if(tr.insertElement){
            let el = document.createElement('div');
            el.innerHTML = tr.insertElement.markup;
            els[idx].insertAdjacentElement(tr.insertElement.position, el);
          }
          //THESE MUST BE DONE LAST, AS REPLACEMENT OF THE ELEMENT IN QUESTION RENDERS THE LOOP UNUSABLE
          //WRAP IN A SPECIFIED ELEMENT
          if(tr.wrapElement){
            let newElement = document.createElementNS('http://www.w3.org/1999/xhtml',tr.wrapElement.tag);
            for (var a in tr.wrapElement.attributes) {
              newElement.setAttribute(a, tr.wrapElement.attributes[a]);
              newElement.setAttribute('wrapper', '');
            }
            newElement.innerHTML = els[idx].outerHTML;
            els[idx].replaceWith(newElement);
            els[idx] = xml.querySelector('[wrapper]').firstElementChild;
            els[idx].removeAttribute('wrapper');
          }
          //REPLACE DEFINED ELEMENTS
          if(tr.replaceElement){
            let newElement = document.createElementNS('http://www.w3.org/1999/xhtml',tr.replaceElement);
            newElement.innerHTML = els[idx].innerHTML;
            let ac = els[idx].attributes.length;
            while(ac--){
              newElement.setAttribute(els[idx].attributes[ac].nodeName, els[idx].attributes[ac].nodeValue);
            }
            els[idx].parentElement.replaceChild(newElement, els[idx]);
          }
        }
      }
      //reparse object for every config entry
      xml = oParser.parseFromString(oSerializer.serializeToString(xml), "text/xml");
    }
    return oSerializer.serializeToString(xml);
  }
  //preconfigurable convenience method to clean special characters from strings
  this.cleanString = function(s) {
    var n = angular.copy(s);
    for (var a in this.CONFIG.CharReplaceTable) {
      n = n.replace(a, this.CONFIG.CharReplaceTable[a]);
    }
    return n;
  }
});

ngTEI.directive('teidoc', ['$compile', '$http', '$q', 'TEI', function ($compile, $http, $q, TEI) {
    function link(scope, element, attrs){
      attrs.$observe('source', function(val){
        if(val){
          var doc = TEI.makeMarkup(val);
          element.html($compile(doc)(scope)).show();
        }
      }.bind(this));
    };
    return {
        link: link
    };
}]);

// ngTEI.directive('ab', ['$compile', '$http', '$q', 'TEI', function ($compile, $http, $q, TEI) {
//     function link(scope, element, attrs){
//       attrs.$observe('source', function(val){
//         if(val){
//           var doc = TEI.makeMarkup(val);
//           element.html($compile(doc)(scope)).show();
//         }
//       }.bind(this));
//     };
//     return {
//         link: link
//     };
// }]);
