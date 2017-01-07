/* global describe, beforeEach, afterEach, it, expect, spyOn, jasmine */
/* jshint unused: false */
describe('Restangular', function () {
  // API
  var Restangular, $httpBackend, testData,
    restangularAccounts, restangularAccount0, restangularAccount1;

  // Load required modules
  beforeEach(function () {
    // Load restangular module
    angular.mock.module('restangular');

    // Get references to modules from the injector
    angular.mock.inject(function ($injector) {
      $httpBackend = $injector.get('$httpBackend');
      Restangular = $injector.get('Restangular');
    });

    // Restangularize a few demo accounts
    restangularAccounts = Restangular.all('accounts');
    restangularAccount0 = Restangular.one('accounts', 0);
    restangularAccount1 = Restangular.one('accounts', 1);

    // Create testdata for our tests
    testData = {
      // Model
      accountsModel: [{
        id: 0,
        user: 'Martin ',
        amount: 42,
        transactions: []
      }, {
        id: 1,
        user: 'Paul',
        amount: 3.1416,
        transactions: [{
          from: 'Martin',
          amount: 3,
          id: 0
        }, {
          from: 'Anonymous',
          amount: 0.1416,
          id: 1
        }]
      }],

      nextAccountId: 22,

      // HAL model (http://stateless.co/hal_specification.html)
      accountsHalModel: [{
        id: 0,
        user: 'Martin',
        amount: 42,
        transaction: [],
        _links: {
          self: '/accountsHAL/martin'
        }
      }, {
        id: 1,
        user: 'Paul',
        amount: 3.1416,
        transaction: [{
          from: 'Martin',
          amount: 3,
          id: 0,
          _links: {
            self: '/accountsHAL/paul/transactions/0'
          }
        }, {
          from: 'Anonymous',
          amount: 0.1416,
          id: 1,
          _links: {
            self: '/accountsHAL/paul/transactions/1'
          }
        }],
        _links: {
          self: '/accountsHAL/paul'
        }
      }],

      infoModel: {
        id: 0,
        text: 'Some additional account information'
      },

      newAccount: {
        user: 'First User',
        amount: 45,
        transactions: []
      },

      messages: [{
        id: 23,
        name: 'Gonto'
      }, {
        id: 45,
        name: 'John'
      }],

      accountsDoSomethingModel: {
        result: 1
      },

      // Another API for testing
      customers: [{
        id: 0,
        name: 'Alice',
        status: 'active',
        credit: 4000.0
      }, {
        id: 1,
        name: 'Bob',
        status: 'active',
        credit: 4000.0
      }, {
        id: 2,
        name: 'Carl',
        status: 'active',
        credit: 4000.0
      }],
      publications: [{
        id: 1,
        title: 'Sample',
        content: 'Rich data',
        tags: [
          'science',
          'chemistry'
        ]
      }],
      newCustomer: {
        id: 3,
        name: 'New',
        status: 'active',
        credit: 4000.0
      }
    };


    // Set up backend responses
    $httpBackend.when('HEAD', '/accounts').respond();
    $httpBackend.when('TRACE', '/accounts').respond();
    $httpBackend.when('OPTIONS', '/accounts').respond();

    // CRUD /accounts
    $httpBackend.whenGET('/accounts').respond(testData.accountsModel);
    $httpBackend.whenJSONP('/accounts').respond(testData.accountsModel);
    $httpBackend.whenPOST('/accounts').respond(function (method, url, data, headers) {
      var newData = angular.fromJson(data);
      newData.fromServer = true;
      newData.id = testData.nextAccountId;
      return [201, JSON.stringify(newData), ''];
    });
    $httpBackend.whenGET('/accounts/do-something').respond(testData.accountsDoSomethingModel);
    $httpBackend.whenGET('/accounts/search/byOwner').respond(testData.accountsModel);

    // CRUD /accounts/{id}
    $httpBackend.whenGET('/accounts/0,1').respond(testData.accountsModel);
    $httpBackend.whenGET('/accounts/messages').respond(testData.messages);
    $httpBackend.whenGET('/accounts/1/message').respond(testData.messages[0]);
    $httpBackend.whenGET('/accounts/1/messages').respond(testData.messages);
    $httpBackend.whenGET('/accounts/0').respond(testData.accountsModel[0]);
    $httpBackend.whenGET('/accounts/1').respond(testData.accountsModel[1]);
    $httpBackend.whenJSONP('/accounts/1').respond(testData.accountsModel[1]);
    $httpBackend.whenGET('/accounts/1/transactions').respond(testData.accountsModel[1].transactions);
    $httpBackend.whenGET('/accounts/1/transactions/1').respond(testData.accountsModel[1].transactions[1]);
    $httpBackend.whenPOST('/accounts/1/transactions').respond(function (method, url, data, headers) {
      return [201, '', ''];
    });
    $httpBackend.whenDELETE('/accounts/1/transactions/1').respond(function (method, url, data, headers) {
      return [200, '', ''];
    });
    $httpBackend.whenDELETE('/accounts/1').respond(function (method, url, data, headers) {
      return [200, '', ''];
    });
    $httpBackend.whenPOST('/accounts/1').respond(function (method, url, data, headers) {
      return [200, '', ''];
    });
    $httpBackend.whenPUT('/accounts/1').respond(function (method, url, data, headers) {
      testData.accountsModel[1] = angular.fromJson(data);
      return [201, data, ''];
    });


    $httpBackend.whenGET('/info').respond(testData.infoModel);
    $httpBackend.whenGET('/accounts/1/info').respond(testData.infoModel);
    $httpBackend.whenPUT('/info').respond(function (method, url, data) {
      return [200, data, ''];
    });

    $httpBackend.whenGET('/accountsHAL').respond(testData.accountsHalModel);
    $httpBackend.whenPUT('/accountsHAL/martin').respond(function (method, url, data) {
      testData.accountsHalModel[0] = angular.fromJson(data);
      return [200, data, ''];
    });

    // Full URL
    $httpBackend.whenGET('http://accounts.com/all').respond(testData.accountsModel);

    $httpBackend.whenGET('/error').respond(function () {
      return [500, {}, ''];
    });

    $httpBackend.whenGET('/misc/zero').respond(function () {
      return [200, 0, ''];
    });

    $httpBackend.whenPOST('/customs').respond(function (method, url, data, headers) {
      if (JSON.parse(data).one) {
        return [201, '', ''];
      } else {
        return [400, '', ''];
      }
    });

    // return the status code given
    // e.g.: /error/404 returns 404 Not Found
    var urlRegex = /\/error\/(\d{3})/;
    $httpBackend.whenGET(urlRegex).respond(function (method, url, data, headers) {
      return [url.match(urlRegex)[1], {}, ''];
    });

    $httpBackend.whenGET('/customers/').respond(testData.customers);
    $httpBackend.whenGET('http://localhost:8080/customers/').respond(testData.customers);
    $httpBackend.whenGET('api.new.domain/customers/').respond(testData.customers);
    $httpBackend.whenGET('/customers/?active=true').respond(testData.customers);
    $httpBackend.whenGET('/customers/publications/?tags=chemistry').respond(testData.publications);
    $httpBackend.whenPUT('/customers/0').respond(function (method, url, data) {
      testData.customers[0] = angular.fromJson(data);
      return [200, data, ''];
    });
    $httpBackend.whenPOST('/customers/').respond(function (method, url, data, headers) {
      var newData = angular.fromJson(data);
      newData.fromServer = true;
      return [201, JSON.stringify(newData), ''];
    });

  }); // END OF BEFOREEACH

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('Interceptors', function () {
    it('Should add multiple request and response interceptors', function () {
      Restangular.addRequestInterceptor(function (elem) {
        var elemCopy = angular.copy(elem);
        elemCopy.firstRequestInterceptor = true;
        return elemCopy;
      });
      Restangular.addRequestInterceptor(function (elem) {
        expect(elem.firstRequestInterceptor).toBeDefined();
        var elemCopy = angular.copy(elem);
        elemCopy.secondRequestInterceptor = true;
        return elemCopy;
      });
      Restangular.addFullRequestInterceptor(function (elem) {
        expect(elem.firstRequestInterceptor).toBeDefined();
        expect(elem.secondRequestInterceptor).toBeDefined();
        var elemCopy = angular.copy(elem);
        elemCopy.thirdRequestInterceptor = true;
        return {
          element: elemCopy
        };
      });

      Restangular.addResponseInterceptor(function (elem) {
        var elemCopy = angular.copy(elem);
        elemCopy.firstResponseInterceptor = true;
        return elemCopy;
      });

      Restangular.addResponseInterceptor(function (elem) {
        expect(elem.firstResponseInterceptor).toBeDefined();
        var elemCopy = angular.copy(elem);
        elemCopy.secondResponseInterceptor = true;
        return elemCopy;
      });

      $httpBackend.whenPOST('/list').respond(function (method, url, data, headers) {
        var elem = angular.fromJson(data);
        expect(elem.firstRequestInterceptor).toBeDefined();
        expect(elem.secondRequestInterceptor).toBeDefined();
        expect(elem.thirdRequestInterceptor).toBeDefined();
        return [200, elem, ''];
      });

      $httpBackend.expectPOST('/list');

      Restangular.all('list').post({
        name: 'Gonto'
      }).then(function (elem) {
        expect(elem.firstResponseInterceptor).toBeDefined();
        expect(elem.secondResponseInterceptor).toBeDefined();
      });

      $httpBackend.flush();
    });

    it('Should add multiple error interceptors', function () {
      $httpBackend.expectGET('/error');

      var CallbackManager = function () {};
      CallbackManager.successCallback = function () {
        expect(CallbackManager.successCallback).not.toHaveBeenCalled();
      };
      CallbackManager.errorCallback = function () {
        expect(CallbackManager.firstErrorInterceptor).toHaveBeenCalled();
        expect(CallbackManager.secondErrorInterceptor).toHaveBeenCalled();
      };

      CallbackManager.firstErrorInterceptor = function () {};
      CallbackManager.secondErrorInterceptor = function () {};

      spyOn(CallbackManager, 'successCallback').and.callThrough();
      spyOn(CallbackManager, 'firstErrorInterceptor').and.callThrough();
      spyOn(CallbackManager, 'secondErrorInterceptor').and.callThrough();

      Restangular.addErrorInterceptor(CallbackManager.firstErrorInterceptor);
      Restangular.addErrorInterceptor(CallbackManager.secondErrorInterceptor);

      Restangular.all('error').getList()
        .then(CallbackManager.successCallback)
        .catch(CallbackManager.errorCallback);

      $httpBackend.flush();
    });

    it('Should add multiple error interceptors but don\'t reject the promise if one of them returns false', function () {
      $httpBackend.expectGET('/error');

      var CallbackManager = function () {};
      CallbackManager.successCallback = function () {
        expect(CallbackManager.successCallback).not.toHaveBeenCalled();
      };
      CallbackManager.errorCallback = function () {
        expect(CallbackManager.errorCallback).not.toHaveBeenCalled();
      };

      CallbackManager.firstErrorInterceptor = function () {
        return true;
      };
      CallbackManager.secondErrorInterceptor = function () {
        return false; // prevent promise to be rejected
      };

      spyOn(CallbackManager, 'successCallback').and.callThrough();
      spyOn(CallbackManager, 'errorCallback').and.callThrough();

      Restangular.addErrorInterceptor(CallbackManager.firstErrorInterceptor);
      Restangular.addErrorInterceptor(CallbackManager.secondErrorInterceptor);

      Restangular.all('error').getList()
        .then(CallbackManager.successCallback)
        .catch(CallbackManager.errorCallback);

      $httpBackend.flush();
    });

    it('Should add multiple error interceptors for a single get too', function () {
      $httpBackend.expectGET('/error/404');

      var CallbackManager = function () {};
      CallbackManager.successCallback = function () {
        expect(CallbackManager.successCallback).not.toHaveBeenCalled();
      };
      CallbackManager.errorCallback = function () {
        expect(CallbackManager.firstErrorInterceptor).toHaveBeenCalled();
        expect(CallbackManager.secondErrorInterceptor).toHaveBeenCalled();
      };

      CallbackManager.firstErrorInterceptor = function (response) {
        expect(Number(response.status)).toEqual(404);
      };
      CallbackManager.secondErrorInterceptor = function () {};

      spyOn(CallbackManager, 'successCallback').and.callThrough();
      spyOn(CallbackManager, 'firstErrorInterceptor').and.callThrough();
      spyOn(CallbackManager, 'secondErrorInterceptor').and.callThrough();

      Restangular.addErrorInterceptor(CallbackManager.firstErrorInterceptor);
      Restangular.addErrorInterceptor(CallbackManager.secondErrorInterceptor);

      Restangular.one('error', 404).get()
        .then(CallbackManager.successCallback)
        .catch(CallbackManager.errorCallback);

      $httpBackend.flush();
    });
  });

  describe('Transformers', function () {
    it('Should decorate element both on server and local by default', function () {

      Restangular.extendModel('accounts', function (account) {
        account.extended = function () {
          return true;
        };
        return account;
      });

      Restangular.one('accounts', 1).get().then(function (account) {
        expect(account.extended).toBeDefined();
      });

      var local = {};
      Restangular.restangularizeElement(null, local, 'accounts');
      expect(local.extended).toBeDefined();

      $httpBackend.flush();
    });

  });

  describe('With Suffix', function () {
    it('shouldn\'t add suffix to getRestangularUrl', function () {
      var suffixRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRequestSuffix('.json');
      });
      var collection = suffixRestangular.all('accounts');
      expect(collection.getRestangularUrl()).toBe('/accounts');
      expect(collection.one('1').getRestangularUrl()).toBe('/accounts/1');
    });

    it('should add suffix to getRequestedUrl', function () {
      var suffixRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRequestSuffix('.json');
      });
      var collection = suffixRestangular.all('accounts');
      expect(collection.getRequestedUrl()).toBe('/accounts.json');
      expect(collection.one('1').getRequestedUrl()).toBe('/accounts/1.json');
    });

    it('should add suffix to request', function () {
      var suffixRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRequestSuffix('.json');
      });
      var collection = suffixRestangular.all('accounts');
      $httpBackend.expectGET('/accounts.json').respond(200);
      $httpBackend.expectGET('/accounts/1.json').respond(200);
      collection.getList();
      collection.get('1');
      $httpBackend.flush();
    });

    it('shouldn\'t add suffix to allUrl', function () {
      var suffixRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRequestSuffix('.json');
      });
      $httpBackend.expectGET('http://accounts.com/all');
      suffixRestangular.allUrl('accounts', 'http://accounts.com/all').getList();
      $httpBackend.flush();
    });
  });

  describe('JSONp', function () {
    it('should work for get', function () {
      Restangular.setJsonp(true);
      Restangular.one('accounts', 1).get();

      $httpBackend.expectJSONP('/accounts/1');
      $httpBackend.flush();
    });

    it('should work for getList', function () {
      Restangular.setJsonp(true);
      Restangular.all('accounts').getList();

      $httpBackend.expectJSONP('/accounts');
      $httpBackend.flush();
    });

    it('shouldn\'t override post', function () {
      Restangular.setJsonp(true);
      restangularAccounts.post({
        id: 2,
        user: 'Someone'
      });

      $httpBackend.expectPOST('/accounts').respond(201, '');
      $httpBackend.flush();
    });


  });

  describe('Local data', function () {
    it('Should restangularize a collection OK', function () {
      var collection = angular.copy(testData.accountsModel);

      Restangular.restangularizeCollection(null, collection, 'accounts');

      expect(_.has(collection, 'get')).toBe(true);
      expect(_.has(collection[0], 'get')).toBe(true);

      expect(collection.getRestangularUrl()).toBe('/accounts');
      expect(collection[0].getRestangularUrl()).toBe('/accounts/0');

    });

    it('Should restangularize a function with arguments OK', function () {
      var collection = function (a, b) {};

      Restangular.restangularizeCollection(null, collection, 'accounts');

      expect(_.has(collection, 'get')).toBe(true);

      expect(collection.getRestangularUrl()).toBe('/accounts');
    });

    it('should have fromServer set when restangularizeElement is called with that param', function () {
      var element = Restangular.restangularizeElement(null, {}, 'accounts', true);
      expect(element.fromServer).toEqual(true);

      element = Restangular.restangularizeElement(null, {}, 'accounts', false);
      expect(element.fromServer).toEqual(false);

      element = Restangular.restangularizeElement(null, {}, 'accounts');
      expect(element.fromServer).toEqual(false);
    });

    it('should have fromServer set when restangularizeCollection is called with that param', function () {
      var collection = Restangular.restangularizeCollection(null, [{}], 'accounts', true);
      expect(collection[0].fromServer).toEqual(true);

      collection = Restangular.restangularizeCollection(null, [{}], 'accounts', false);
      expect(collection[0].fromServer).toEqual(false);

      collection = Restangular.restangularizeCollection(null, [{}], 'accounts');
      expect(collection[0].fromServer).toEqual(false);
    });
  });

  describe('restangularizePromiseIntercept', function () {
    it('should be invoked by restangularizePromise', function () {
      var calledWithPromise;

      Restangular.setRestangularizePromiseInterceptor(function (promise) {
        calledWithPromise = promise;

        promise.$object.$custom = true;
      });

      var promise = Restangular.one('accounts', 1).get();

      expect(calledWithPromise).toBeDefined();
      expect(promise.$object.$custom).toBeDefined();

      $httpBackend.flush();
    });
  });

  describe('$object', function () {
    it('Should work for single get', function () {
      var promise = Restangular.one('accounts', 1).get();
      var obj = promise.$object;
      expect(obj).toBeDefined();
      expect(obj.amount).toBeUndefined();

      $httpBackend.flush();

      expect(obj.amount).toEqual(3.1416);
    });

    it('Shouldn\'t be restangularized by default', function () {
      Restangular.extendModel('accounts', function (account) {
        account.extended = function () {
          return true;
        };
        return account;
      });

      var promise = Restangular.one('accounts', 1).get();
      var obj = promise.$object;
      expect(obj).toBeDefined();
      expect(obj.extended).toBeUndefined();

      $httpBackend.flush();
    });

    it('Should work for single get', function () {
      var promise = Restangular.all('accounts').getList();
      var list = promise.$object;
      expect(list).toBeDefined();
      expect(list.length).toEqual(0);

      $httpBackend.flush();

      expect(list.length).toEqual(2);
      expect(list[1].amount).toEqual(3.1416);
    });
  });

  describe('ALL', function () {
    it('getList() should return an array of items', function () {
      restangularAccounts.getList().then(function (accounts) {
        expect(Restangular.stripRestangular(accounts)).toEqual(Restangular.stripRestangular(testData.accountsModel));
      });

      $httpBackend.flush();
    });

    it('several getList() should return an array of items', function () {
      $httpBackend.expectGET('/accounts/0,1');
      Restangular.several('accounts', 0, 1).getList().then(function (accounts) {
        expect(Restangular.stripRestangular(accounts)).toEqual(Restangular.stripRestangular(testData.accountsModel));
      });

      $httpBackend.flush();
    });

    it('several remove() should work', function () {
      $httpBackend.expectDELETE('/accounts/0,1').respond([200, '', '']);
      Restangular.several('accounts', 0, 1).remove();

      $httpBackend.flush();
    });

    it('get(id) should return the item with given id', function () {
      restangularAccounts.get(0).then(function (account) {
        expect(Restangular.stripRestangular(account)).toEqual(Restangular.stripRestangular(testData.accountsModel[0]));
      });

      $httpBackend.flush();
    });

    it('uses all to get the list without parameters', function () {
      Restangular.one('accounts', 1).all('messages').getList();
      $httpBackend.expectGET('/accounts/1/messages');
      $httpBackend.flush();
    });

    it('Custom GET methods should work', function () {
      restangularAccounts.customGETLIST('messages').then(function (msgs) {
        expect(Restangular.stripRestangular(msgs)).toEqual(Restangular.stripRestangular(testData.messages));
      });

      $httpBackend.flush();
    });

    it('post() should add a new item', function () {
      restangularAccounts.post({
        id: 2,
        user: 'Someone'
      }).then(function () {
        expect(testData.accountsModel.length).toEqual(2);
      });

      $httpBackend.expectPOST('/accounts').respond(201, '');
      $httpBackend.flush();
    });

    it('customPOST() should add a new item', function () {
      restangularAccounts.customPOST({
        id: 2,
        user: 'Someone'
      }).then(function () {
        expect(testData.accountsModel.length).toEqual(2);
      });

      $httpBackend.expectPOST('/accounts').respond(201, '');
      $httpBackend.flush();
    });

    it('post() should work with arrays', function () {
      Restangular.all('places').post([{
        name: 'Gonto'
      }, {
        name: 'John'
      }]).then(function (value) {
        expect(value.length).toEqual(2);
      });

      $httpBackend.expectPOST('/places').respond(function (method, url, data, headers) {
        return [201, angular.fromJson(data), ''];
      });

      $httpBackend.flush();
    });

    it('post() should add a new item with data and return the data from the server', function () {
      restangularAccounts.post(testData.newAccount).then(function (added) {
        expect(added.fromServer).toEqual(true);
        expect(added.id).toEqual(testData.nextAccountId);
        expect(added.user).toEqual(testData.newAccount.user);
      });

      $httpBackend.expectPOST('/accounts');
      $httpBackend.flush();
    });

    it('Doing a post and then other operation (delete) should call right URLs', function () {
      restangularAccounts.post(testData.newAccount).then(function (added) {
        added.remove();
        $httpBackend.expectDELETE('/accounts/' + testData.nextAccountId).respond(201, '');
      });

      $httpBackend.flush();
    });

    it('Doing a post to a server that returns no element will return undefined', function () {
      restangularAccounts.getList().then(function (accounts) {
        var newTransaction = {
          id: 1,
          name: 'Gonto'
        };
        accounts[1].post('transactions', newTransaction).then(function (transaction) {
          expect(transaction).toBeUndefined();
        });
      });

      $httpBackend.flush();
    });

    it('head() should safely return', function () {
      restangularAccounts.head().then(function () {
        expect(true).toBe(true);
      });
      $httpBackend.flush();
    });

    it('trace()  should safely return', function () {
      restangularAccounts.trace().then(function () {
        expect(true).toBe(true);
      });

      $httpBackend.flush();
    });

    it('customPUT should work', function () {
      $httpBackend.expectPUT('/accounts/hey').respond(testData.accountsModel);
      restangularAccounts.customPUT({
        key: 'value'
      }, 'hey');

      $httpBackend.flush();
    });

    it('customPATCH should work', function () {
      var data = {
        foo: 'bar'
      };
      $httpBackend.expectPATCH('/accounts/hey', data).respond(testData.accountsModel);
      restangularAccounts.customPATCH(data, 'hey');
      $httpBackend.flush();
    });

    it('options()  should safely return', function () {
      restangularAccounts.options().then(function () {
        expect(true).toBe(true);
      });

      $httpBackend.flush();
    });

    it('getList() should correctly handle params after customDELETE', function () {
      $httpBackend.expectGET('/accounts?foo=1').respond(testData.accountsModel);
      restangularAccounts.getList({
        foo: 1
      }).then(function () {
        $httpBackend.expectDELETE('/accounts?id=1').respond(201, '');
        return restangularAccounts.customDELETE('', {
          id: 1
        });
      }).then(function () {
        $httpBackend.expectGET('/accounts?foo=1').respond(testData.accountsModel);
        return restangularAccounts.getList({
          foo: 1
        });
      }).then(function (accounts) {
        expect(Restangular.stripRestangular(accounts)).toEqual(Restangular.stripRestangular(testData.accountsModel));
      });

      $httpBackend.flush();
    });
  });

  describe('Scoped Service', function () {

    it('should correctly work', function () {
      var Accounts = Restangular.service('accounts');
      Accounts.post(testData.newAccount);
      Accounts.one(0).get();
      Accounts.getList();

      $httpBackend.expectPOST('/accounts');
      $httpBackend.expectGET('/accounts/0');
      $httpBackend.expectGET('/accounts');
      $httpBackend.flush();
    });

    it('should correctly work with children', function () {
      var Transactions = Restangular.service('transactions', restangularAccount1);
      Transactions.post(testData.newAccount);
      Transactions.one(1).get();
      Transactions.getList();
      Transactions.get(1);

      $httpBackend.expectPOST('/accounts/1/transactions');
      $httpBackend.expectGET('/accounts/1/transactions/1');
      $httpBackend.expectGET('/accounts/1/transactions');
      $httpBackend.expectGET('/accounts/1/transactions/1');
      $httpBackend.flush();
    });

    it('should add custom collection method added with withConfig', function () {
      var Accounts = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.addElementTransformer('accounts', true, function (worker) {
          worker.addRestangularMethod('doSomething', 'get', 'do-something');
          return worker;
        });
      }).service('accounts');

      expect(Accounts.doSomething).toBeDefined();
      expect(_.isFunction(Accounts.doSomething)).toBeTruthy();

      Accounts.post(testData.newAccount);
      Accounts.one(0).get();
      Accounts.getList();
      Accounts.doSomething();
      Accounts.get(0);

      $httpBackend.expectPOST('/accounts');
      $httpBackend.expectGET('/accounts/0');
      $httpBackend.expectGET('/accounts');
      $httpBackend.expectGET('/accounts/do-something');
      $httpBackend.expectGET('/accounts/0');
      $httpBackend.flush();
    });

    it('should provide a one-off $http configuration method', function () {
      var Accounts = Restangular.service('accounts');
      Accounts.withHttpConfig({
        transformRequest: angular.identity
      });
      Accounts.post(testData.newAccount);
      $httpBackend.expectPOST('/accounts');
      $httpBackend.flush();
    });

  });

  describe('ONE', function () {
    it('get() should return a JSON item', function () {
      restangularAccount1.get().then(function (account) {
        expect(Restangular.stripRestangular(account))
          .toEqual(Restangular.stripRestangular(testData.accountsModel[1]));
      });

      $httpBackend.flush();
    });

    it('Should save as put correctly', function () {
      restangularAccount1.get().then(function (account) {
        $httpBackend.expectPUT('/accounts/1');
        account.put();
      });

      $httpBackend.flush();
    });

    it('Should save as post correctly', function () {
      var account1 = angular.copy(restangularAccount1);
      $httpBackend.expectPOST('/accounts/1');
      account1.name = 'Hey';
      account1.save();

      $httpBackend.flush();
    });

    it('Should keep route property when element is created', function () {
      var account1 = Restangular.restangularizeElement(null, {}, 'accounts');
      $httpBackend.expectPOST('/accounts');
      $httpBackend.expectPUT('/accounts/1');
      account1.name = 'Hey';
      account1.save().then(function (accountFromServer) {
        accountFromServer.id = 1;
        return accountFromServer.save();
      }).then(function (accountFromServer2) {
        expect(accountFromServer2.route).toBe(account1.route);
      });
      $httpBackend.flush();
    });

    it('Should make RequestLess connections with one', function () {
      restangularAccount1.one('transactions', 1).get().then(function (transaction) {
        expect(Restangular.stripRestangular(transaction))
          .toEqual(Restangular.stripRestangular(testData.accountsModel[1].transactions[1]));
      });

      $httpBackend.flush();
    });

    it('Should make RequestLess connections with all', function () {
      restangularAccount1.all('transactions').getList().then(function (transactions) {
        expect(Restangular.stripRestangular(transactions))
          .toEqual(Restangular.stripRestangular(testData.accountsModel[1].transactions));
      });

      $httpBackend.flush();
    });


    it('Custom GET methods should work', function () {
      restangularAccount1.customGET('message').then(function (msg) {
        expect(Restangular.stripRestangular(msg)).toEqual(Restangular.stripRestangular(testData.messages[0]));
      });

      $httpBackend.flush();
    });

    it('put() should update the value', function () {
      restangularAccount1.get().then(function (account) {
        account.amount = 1.618;
        account.put().then(function (newAc) {
          expect(testData.accountsModel[1].amount).toEqual(1.618);
          newAc.remove();
          $httpBackend.expectDELETE('/accounts/1');
        });
        $httpBackend.expectPUT('/accounts/1');


      });

      $httpBackend.flush();
    });

    it('should return an array when accessing a subvalue', function () {
      restangularAccount1.get().then(function (account) {
        account.getList('transactions').then(function (transactions) {
          expect(Restangular.stripRestangular(transactions))
            .toEqual(Restangular.stripRestangular(testData.accountsModel[1].transactions));
        });
      });

      $httpBackend.flush();
    });
  });

  describe('COPY', function () {
    it('should copy an object and "this" should reference the copied object', function () {
      var copiedAccount = Restangular.copy(testData.accountsModel[0]);
      var that;

      copiedAccount.user = 'Copied string';
      expect(copiedAccount).not.toBe(testData.accountsModel[0]);

      // create a spy for one of the methods to capture the value of 'this'
      spyOn(copiedAccount, 'getRestangularUrl').and.callFake(function () {
        that = this;
      });

      copiedAccount.getRestangularUrl(); // invoke the method we are spying on
      expect(that).toBe(copiedAccount);
    });

    it('should copy an object and "fromServer" param should be the same with the copied object', function () {
      var responseHandler = jasmine.createSpy();

      // with fromServer=true
      restangularAccount1.get().then(responseHandler);
      $httpBackend.flush();
      var account = responseHandler.calls.argsFor(0)[0],
        copiedAccount = Restangular.copy(account);
      expect(account.fromServer).toEqual(true);
      expect(copiedAccount.fromServer).toEqual(true);

      // with fromServer=false
      account = Restangular.one('accounts', 123),
        copiedAccount = Restangular.copy(account);
      expect(account.fromServer).toEqual(false);
      expect(copiedAccount.fromServer).toEqual(false);
    });

    it('should copy a collection and "fromServer" param should stay the same', function () {
      var responseHandler = jasmine.createSpy();

      // with collections, fromServer=false
      var accounts = Restangular.all('accounts'),
        copiedAccounts = Restangular.copy(accounts);
      expect(accounts.fromServer).toEqual(false);
      expect(copiedAccounts.fromServer).toEqual(false);

      // with collections, fromServer = true;
      restangularAccounts.getList().then(responseHandler);
      $httpBackend.flush();
      accounts = responseHandler.calls.argsFor(0)[0],
        copiedAccounts = Restangular.copy(accounts);
      expect(accounts.fromServer).toEqual(true);
      expect(copiedAccounts.fromServer).toEqual(true);
    });

    it('should copy an object and "route" param should be the same in the copied object', function () {
      // for element
      var account = Restangular.one('accounts', 123),
        copiedAccount = Restangular.copy(account);
      expect(account.route).toEqual(copiedAccount.route);

      // for collection
      var accounts = Restangular.all('accounts'),
        copiedAccounts = Restangular.copy(accounts);
      expect(accounts.route).toEqual(copiedAccounts.route);
    });

    it('should copy an object and the parent property should stay the same', function () {
      // element
      var user = Restangular.one('account', 12).one('user', 14),
        userCopy = Restangular.copy(user);
      expect(user.parentResource.route).toEqual('account');
      expect(userCopy.parentResource.route).toEqual('account');

      // collection
      var users = Restangular.one('account', 12).all('users'),
        usersCopy = Restangular.copy(users);
      expect(user.parentResource.route).toEqual('account');
      expect(usersCopy.parentResource.route).toEqual('account');
    });
  });

  describe('getRestangularUrl', function () {
    it('should return the generated URL when you chain Restangular methods together', function () {
      var restangularSpaces = Restangular.one('accounts', 123).one('buildings', 456).all('spaces');
      expect(restangularSpaces.getRestangularUrl()).toEqual('/accounts/123/buildings/456/spaces');
    });
  });

  describe('getRestangularUrl with useCannonicalId set to true', function () {
    it('should return the generated URL when you chain Restangular methods together', function () {
      var R = Restangular.withConfig(function (config) {
        config.setUseCannonicalId(true);
      });
      var restangularSpaces = R.one('accounts', 123).one('buildings', 456).all('spaces');
      expect(restangularSpaces.getRestangularUrl()).toEqual('/accounts/123/buildings/456/spaces');
    });
  });


  describe('addElementTransformer', function () {
    it('should allow for a custom method to be placed at the collection level', function () {
      var accountsPromise;

      Restangular.addElementTransformer('accounts', true, function (collection) {
        collection.totalAmount = function () {};
        return collection;
      });

      accountsPromise = Restangular.all('accounts').getList();

      accountsPromise.then(function (accounts) {
        expect(typeof accounts.totalAmount).toEqual('function');
      });

      $httpBackend.flush();
    });

    it('should allow for a custom method to be placed at the model level when one model is requested', function () {
      var accountPromise;

      Restangular.addElementTransformer('accounts', false, function (model) {
        model.prettifyAmount = function () {};
        return model;
      });

      accountPromise = Restangular.one('accounts', 1).get();

      accountPromise.then(function (account) {
        expect(typeof account.prettifyAmount).toEqual('function');
      });

      $httpBackend.flush();
    });

    it('should allow for a custom method to be placed at the model level when several models are requested', function () {
      var accountsPromise;

      Restangular.addElementTransformer('accounts', false, function (model) {
        model.prettifyAmount = function () {};
        return model;
      });

      accountsPromise = Restangular.all('accounts', 1).getList();

      accountsPromise.then(function (accounts) {
        accounts.forEach(function (account) {
          expect(typeof account.prettifyAmount).toEqual('function');
        });
      });

      $httpBackend.flush();
    });

    it('should allow for a custom method to be placed at the collection level using a regexp matching the route', function () {
      var accountsPromise;

      Restangular.addElementTransformer(/^accounts/, false, function (model) {
        model.prettifyAmount = function () {};
        return model;
      });

      accountsPromise = Restangular.all('accounts/search/byOwner', 1).getList();

      accountsPromise.then(function (accounts) {
        accounts.forEach(function (account) {
          expect(typeof account.prettifyAmount).toEqual('function');
        });
      });

      $httpBackend.flush();
    });

    it('should work with cloned collections', function () {
      var responseHandler = jasmine.createSpy();

      Restangular.addElementTransformer(/^accounts/, true, function (collection) {
        collection.customThing = 'customValue';
        return collection;
      });

      Restangular.all('accounts').getList().then(responseHandler);
      $httpBackend.flush();

      var accounts = responseHandler.calls.argsFor(0)[0];
      var accountsCopy = accounts.clone();

      expect(accounts.customThing).toEqual('customValue');
      expect(accountsCopy.customThing).toEqual('customValue');
    });

    it('should allow for a custom method to be placed at the model level using regexp route when one model is requested', function () {
      var accountPromise;

      Restangular.addElementTransformer(/^accounts/, false, function (model) {
        model.prettifyAmount = function () {};
        return model;
      });

      accountPromise = Restangular.one('accounts', 1).get();

      accountPromise.then(function (account) {
        expect(typeof account.prettifyAmount).toEqual('function');
      });

      $httpBackend.flush();
    });

    it('should allow for a custom method to be placed at the model level using regexp when several models are requested', function () {
      var accountsPromise;

      Restangular.addElementTransformer(/^accounts/, false, function (model) {
        model.prettifyAmount = function () {};
        return model;
      });

      accountsPromise = Restangular.all('accounts', 1).getList();

      accountsPromise.then(function (accounts) {
        accounts.forEach(function (account) {
          expect(typeof account.prettifyAmount).toEqual('function');
        });
      });

      $httpBackend.flush();
    });

  });

  describe('extendCollection', function () {
    it('should be an alias for a specific invocation of addElementTransformer', function () {
      var spy = spyOn(Restangular, 'addElementTransformer');

      var fn = function (collection) {
        collection.totalAmount = function () {};
        return collection;
      };

      Restangular.extendCollection('accounts', fn);

      expect(spy).toHaveBeenCalledWith('accounts', true, fn);
    });
  });

  describe('extendModel', function () {
    it('should be an alias for a specific invocation of addElementTransformer', function () {
      var spy = spyOn(Restangular, 'addElementTransformer');

      var fn = function (model) {
        model.prettifyAmount = function () {};
        return model;
      };

      Restangular.extendModel('accounts', fn);

      expect(spy).toHaveBeenCalledWith('accounts', false, fn);
    });
  });

  describe('headers', function () {
    it('should return defaultHeaders', function () {
      var defaultHeaders = {
        testheader: 'header value'
      };
      Restangular.setDefaultHeaders(defaultHeaders);
      expect(Restangular.defaultHeaders).toEqual(defaultHeaders);
    });

    it('should pass uppercase methods in X-HTTP-Method-Override', function () {
      Restangular.setMethodOverriders(['put']);
      $httpBackend.expectPOST('/overriders/1').respond(function (method, url, data, headers) {
        expect(headers['X-HTTP-Method-Override']).toBe('PUT');
        return {};
      });
      Restangular.one('overriders', 1).put();
      $httpBackend.flush();
    });
  });

  describe('defaultRequestParams', function () {
    it('should return defaultRequestParams', function () {
      var defaultRequestParams = {
        param: 'value'
      };

      Restangular.setDefaultRequestParams(defaultRequestParams);

      expect(Restangular.requestParams.common).toEqual(defaultRequestParams);
    });

    it('should be able to set default params for get, post, put.. methods separately', function () {
      var postParams = {
          post: 'value'
        },
        putParams = {
          put: 'value'
        };

      Restangular.setDefaultRequestParams('post', postParams);
      expect(Restangular.requestParams.post).toEqual(postParams);

      Restangular.setDefaultRequestParams('put', putParams);
      expect(Restangular.requestParams.put).toEqual(putParams);

      expect(Restangular.requestParams.common).not.toEqual(putParams);
    });

    it('should be able to set default params for multiple methods with array', function () {
      var defaultParams = {
        param: 'value'
      };

      Restangular.setDefaultRequestParams(['post', 'put'], defaultParams);

      expect(Restangular.requestParams.post).toEqual(defaultParams);
      expect(Restangular.requestParams.put).toEqual(defaultParams);

      expect(Restangular.requestParams.common).not.toEqual(defaultParams);
    });
  });

  describe('withConfig', function () {
    it('should create new service with scoped configuration', function () {
      var childRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/api/v1');
      });

      expect(Restangular.configuration.baseUrl).toEqual('');
      expect(childRestangular.configuration.baseUrl).toEqual('/api/v1');

    });

    it('should allow nested configurations', function () {
      var childRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/api/v1');
      });

      var grandchildRestangular = childRestangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRequestSuffix('.json');
      });

      expect(Restangular.configuration.baseUrl).toEqual('');
      expect(Restangular.configuration.suffix).toEqual(null);

      expect(childRestangular.configuration.baseUrl).toEqual('/api/v1');
      expect(childRestangular.configuration.suffix).toEqual(null);

      expect(grandchildRestangular.configuration.baseUrl).toEqual('/api/v1');
      expect(grandchildRestangular.configuration.suffix).toEqual('.json');
    });
  });

  describe('Self linking', function () {
    it('Should request the link in HAL format', function () {
      var linkRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setRestangularFields({
          selfLink: '_links.self'
        });
      });

      var arr = linkRestangular.all('accountsHAL').getList().$object;
      $httpBackend.flush();

      var account = arr[0];
      $httpBackend.expectPUT('/accountsHAL/martin');
      account.name = 'Updated';
      account.put();

      $httpBackend.flush();
    });
  });

  describe('Singe one (endpoint not expecting an id)', function () {
    it('does not use the id for single resource GET', function () {
      Restangular.one('info', 0, true).get();
      $httpBackend.expectGET('/info');
      $httpBackend.flush();
    });

    it('getRestangularUrl() returns still the url without id after GET', function () {
      var record = Restangular.one('info', 0, true);
      record.get().then(function (data) {
        expect(data.getRestangularUrl()).toEqual('/info');
      });
      $httpBackend.expectGET('/info');
      $httpBackend.flush();
    });

    it('does not use the id for single nested resource GET', function () {
      Restangular.one('accounts', 1).one('info', 0, true).get();
      $httpBackend.expectGET('/accounts/1/info');
      $httpBackend.flush();
    });

    it('does not use the id for single resource PUT', function () {
      Restangular.one('info', 0, true).put();
      $httpBackend.expectPUT('/info');
      $httpBackend.flush();
    });
  });

  describe('setSelfLinkAbsoluteUrl', function () {
    it('works', function () {
      var childRestangular = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setSelfLinkAbsoluteUrl(false);
      });

      expect(Restangular.configuration.absoluteUrl).toEqual(true);
      expect(childRestangular.configuration.absoluteUrl).toEqual(false);
    });
  });

  describe('Misc', function () {
    it('should not strip [one] or [all] key from plain object', function () {
      Restangular.all('customs').customPOST({
        one: 'I am here',
        two: 'I am also here'
      }).then(function () {
        expect(1).toBe(1);
      }, function () {
        expect('Promise').toBe('correctly fulfilled');
      });
      $httpBackend.flush();
    });

    it('should not stip non-restangularized elements', function () {
      expect(Restangular.stripRestangular(['test', 'test2'])).toEqual(['test', 'test2']);
    });

    it('should accept 0 as response', function () {
      Restangular.one('misc', 'zero').get().then(function (res) {
        expect(res).toEqual(0);
      });
      $httpBackend.flush();
    });

    it('Should accept 0 as a proper id in custom requests', function () {
      $httpBackend.expectDELETE('/accounts/0').respond(202);
      Restangular.all('accounts').customDELETE(0);
      $httpBackend.flush();
    });

    it('should accept reserved properties as keys in POST data when POSTing raw data', function () {
      // https://github.com/mgonto/restangular/issues/374
      $httpBackend.expectPOST('/accounts/1/merge', {ids: 'test', options: 'foo', clone: 'bar'}).respond(200);
      var parent = Restangular.restangularizeElement(null, {id: 1}, 'accounts', true);
      parent.post('merge', {ids: 'test', options: 'foo', clone: 'bar'});
      $httpBackend.flush();
    });

    it('should accept reserved properties as a key in POST data when using a restangularized element by configuring restangularFields', function () {
      // https://github.com/mgonto/restangular/issues/374
      $httpBackend.expectPOST('/accounts', {ids: 'test', options: 'foo', clone: 'bar'}).respond(200);
      Restangular.setRestangularFields({
        ids: '_ids',
        clone: '_clone',
        options: '_options'
      });
      var parent = Restangular.restangularizeElement(null, {ids: 'test', options: 'foo', clone: 'bar'}, 'accounts', false);
      parent.save();
      $httpBackend.flush();
    });


  });

  describe('testing normalize url', function () {

    it('should get a list of objects', function () {
      Restangular.all('customers/').getList().then(function (res) {
        res.getList({
          active: true
        });
        $httpBackend.expectGET('/customers/?active=true');
        //res.getList('publications/', {tags: 'chemistry'});
        //$httpBackend.expectGET('/customers/publications/?tags=chemistry');
      });
      $httpBackend.expectGET('/customers/');
      $httpBackend.flush();
    });

    it('should get a list of objects even if the path has extra slashes', function () {
      Restangular.all('customers///').getList().then(function (res) {
        res.getList({
          active: true
        });
        $httpBackend.expectGET('/customers/?active=true');
      });
      $httpBackend.expectGET('/customers/');
      $httpBackend.flush();
    });

    it('should post with slash at the end', function () {
      Restangular.all('customers/').getList().then(function (res) {
        res.post(testData.newCustomer);
        $httpBackend.expectPOST('/customers/');
      });
      $httpBackend.expectGET('/customers/');
      $httpBackend.flush();
    });

    it('should put with slash at the end', function () {
      Restangular.all('customers/').getList().then(function (customers) {
        customers[0].put();
        $httpBackend.expectPUT('/customers/0');
      });
      $httpBackend.flush();
    });

    it('should return a normalized URL even it has extra slashes', function () {
      var restangularSpaces = Restangular.one('accounts//', 123).one('buildings//', 456).all('spaces///');
      expect(restangularSpaces.getRestangularUrl()).toEqual('/accounts/123/buildings/456/spaces/');
    });

    it('should create a new service and still working normalized URL', function () {
      var newRes = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('http://localhost:8080');
      });
      expect(newRes.configuration.baseUrl).toEqual('http://localhost:8080');
      newRes.all('customers////').getList();
      $httpBackend.expectGET('http://localhost:8080/customers/');

      var newApi = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('api.new.domain');
      });

      expect(newApi.configuration.baseUrl).toEqual('api.new.domain');
      newApi.all('customers////').getList();
      $httpBackend.expectGET('api.new.domain/customers/');

      $httpBackend.flush();
    });

    it('Should work with absolute URL with //authority', function () {
      var newRes = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('//localhost:8080');
      });
      expect(newRes.configuration.baseUrl).toEqual('//localhost:8080');
      newRes.all('customers////').getList();
      $httpBackend.expectGET('//localhost:8080/customers/').respond([]);

      $httpBackend.flush();
    });
  });

  describe('setPlainByDefault', function () {

    it('should not add restangularized methods to response object', function () {
      var newRes = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setPlainByDefault(true);
      });

      expect(newRes.configuration.plainByDefault).toEqual(true);

      newRes.one('accounts', 0).get().then(function (account) {
        expect(account).toEqual(testData.accountsModel[0]);
      });

      $httpBackend.flush();
    });

    it('shoud not add restangularized methods to response collection', function () {
      var newRes = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setPlainByDefault(true);
      });

      newRes.all('accounts').getList().then(function (accounts) {
        expect(accounts).toEqual(testData.accountsModel);
      });
      $httpBackend.flush();
    });
  });
});
