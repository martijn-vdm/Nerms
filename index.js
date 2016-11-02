'use strict';

var Nerms = new function() {

	var _data = {

		instance : this,

		expire : {

			entities : [],
			timer 	 : null,
			interval : 1000
		},

		events : {

			types : {

				expire : [],
				destroy : [],
				create : []
			},

			fire : function(type, entity) {

				for(var i in _data.events.types[type]) {
					_data.events.types[type][i](entity);
				}
			}
		},

		type : {
 
            event : function(type) {
 
                if(undefined === _data.events.types[type]) {
                    throw 'Type "' + type + '" is not a known event type';
                }
            },
 
            entity : function(type) {
 
                if(undefined === _data.instance.entities[type]) {
                    throw 'Entity "' + type + '" does not exists';
                }
            }
        },

		relations : {}
	};

	//Entities
	_data.instance.entities = {};

	//Models
	_data.instance.models = {};

	//Type
	_data.instance.type = {

		add : function(type) {

			//Create model
			_data.instance.models[type.name] = new function() {

				var _entities = [];
				var _instance = this;

				_instance.push = function(entity) {
					
					if(entity instanceof _data.instance.entities[type.name]) {
						return _entities.push(entity);
					}

					throw 'Entity needs to be an instance of "' + type.name + '"';
				}

				_instance.list = function() {
					return _entities;
				}

				_instance.find = {};

				for(var i in type.properties) {

					(function(property) {
						
						_instance.find[property] = function(value, strict) { 

							var found = [];

							for(var a in _entities) {

								if((strict && _entities[a][property].get() === value) || (!strict && _entities[a][property].get() == value)) {
									found.push(_entities[a]);
								}
							}

							if(1 === found.length) {
								return found[0];
							}

							if(0 < found.length) {
								return found;
							}

							return null;
						};
					})(i);
				}

				return _instance;
			};
			
			//Create entity
			_data.instance.entities[type.name] = function Entity(data) {

				var _instance = this;

				//Properties
				var _properties = JSON.parse(JSON.stringify(type.properties));

				//Functions
				for(var i in type.properties) {
					
					(function(property) {

						_instance[property] = {};

						//Push
						if(true === Array.isArray(_properties[property])) {

							//List
							_instance[property].list = function() {
								return _properties[property];
							}

							_instance[property].push = function(entity) {
								
								_properties[property].push(entity);
								return _instance;
							}

							return;
						}

						//Get
						_instance[property].get = function() {
							return _properties[property];
						}

						//Set
						_instance[property].set = function(value) {

							_properties[property] = value;
							return _instance;
						}
					})(i);
				}

				_instance.constructor.prototype.toString = function() { 
					return type.name; 
				}

				if(data) {

					for(var a in _instance) {

						if(_instance[a] && _instance[a].set) {
							_instance[a].set(data[a]);
						}
					}
				}

				_data.instance.models[type.name].push(_instance);

				return _instance;
			};

			return {

				link : function(relation) {
					
					//Model validation
					if(undefined === relation.model) {
						throw 'Link: Model property is required';
					}

					if(undefined === _data.instance.models[relation.model]) {
						throw 'Link: Model "' + relation.model + '" does not exists';
					}

					//On property validation
					if(undefined === relation.on) {
						throw 'Link: Property "on" is required';
					}

					if(false === Array.isArray(relation.on) || relation.on.length < 2) {
						throw 'Link: Property "on" must be an Array with two String elements';
					}

					if(undefined === _data.instance.models[type.name].find[relation.on[1]]) {
						throw 'Link: Model "'+ type.name +'" does not contain the property "'+ relation.on[1] +'" in "on" property';
					}

					//Property property validation
					if(undefined === relation.property) {
						throw 'Link: Property "property" is required';
					}

					if(false === Array.isArray(relation.property) || relation.property.length < 2) {
						throw 'Link: Property "property" must be an Array with two String elements';
					}

					if(undefined === _data.instance.models[type.name].find[relation.property[0]]) {
						throw 'Link: Model "'+ type.name +'" does not contain the property "'+ relation.property[0] +'" in "propery" property';
					}

					//Create relation if not exists
					if(undefined === _data.relations[type.name]) {
						_data.relations[type.name] = {now : [], later : []};
					}

					//Add relation
					_data.relations[type.name].now.push(relation);
				}
			};
		},

		destroy : function(type) {

			//Delete entities
			var entities = _data.instance.models[type].list();

			while(entities.length > 0) {
				_data.instance.destroy(entities[0]);
			}

			//Delete model object
			delete _data.instance.models[type];

			//Delete entity object
			delete _data.instance.entities[type];
		}
	}

	//Mapper
	_data.instance.map = function(objects, type) {
 
        _data.type.entity(type);

		//If objects are not an array (singel entity)
		if(false === Array.isArray(objects)) {
			objects = [objects];
		}

		for(var i in objects) {

			var entity = new _data.instance.entities[type]();

			//Set entity attributes
			for(var a in entity) {

				if(entity[a] && entity[a].set) {
					entity[a].set(objects[i][a]);
				}
			}

			//Relations
			if(_data.relations[type]) {

				for(var a in _data.relations[type].now) {

					var relation = _data.relations[type].now[a];
					var ent 	 = _data.instance.models[relation.model].find[relation.on[1]](objects[i][relation.on[0]]);

					if(null !== ent) {

						entity[relation.property[0]].push(ent);
						ent[relation.property[1]].push(entity);
					}
					else {

						if(undefined === _data.relations[relation.model]) {
							_data.relations[relation.model] = {now : [], later : []};
						}

						var relation = JSON.parse(JSON.stringify(relation));

						//console.log(objects[i], relation.on[1])

						relation.value = [objects[i][relation.on[1]], entity];
						_data.relations[relation.model].later.push(relation);
					}
				}

				var remove 	 = [];

				for(var a in _data.relations[type].later) {

					var relation = _data.relations[type].later[a];
					var ent 	 = _data.instance.models[type].find[relation.on[1]](relation.value[0]);

					if(null !== ent) {

						if(entity[relation.on[1]].get() === ent[relation.on[1]].get()) {

							entity[relation.property[1]].push(relation.value[1]);
							relation.value[1][relation.property[0]].push(entity);
							remove.push(a);
						}
					}
				}

				for(var a in remove) {
					_data.relations[type].later.splice(remove[a], 1);
				}
			}

			//Execute create callbacks
			_data.events.fire('create', entity);
		}

		return _data.instance;
	}

	//Expire
	_data.instance.expire = function(entity, seconds) {

		var date = new Date();
			date.setSeconds(date.getSeconds() + seconds);

		//Push new entry
		_data.expire.entities.push({entity : entity, date : date});

		if(null === _data.expire.timer) {

			_data.expire.timer = setInterval(function() {

				var timestamp = new Date().getTime();

				for(var i in _data.expire.entities) {

					if(_data.expire.entities[i].date.getTime() <= timestamp) {
						
						//Execute expire callbacks
						_data.events.fire('expire', _data.expire.entities[i].entity);

						//Destroy entity
						_data.instance.destroy(_data.expire.entities[i].entity);
					}
				}

			}, _data.expire.interval)
		}

		return _data.instance;
	}

	//Destroy
	_data.instance.destroy = function(entity) {

		if(!Array.isArray(entity)) {
			entity = [entity];
		}

		for(var a in entity) {

			for(var b in _data.instance.models) {

				//Delete entity from models
				var entities = _data.instance.models[b].list();
				var index 	 = entities.indexOf(entity[a]);

				if(index >= 0) {
					
					//Execute destroy callbacks
					_data.events.fire('destroy', entity[a]);
					
					entities.splice(index, 1);
				}

				//Delete entity from within other entities
				for(var c in entities) {

					for(var d in entities[c]) {

						//Check if its an array
						if(entities[c][d].push) {
							
							var list  = entities[c][d].list();
							var index = list.indexOf(entity[a]);

							if(index >= 0) {
								list.splice(index, 1);
							}
						}
					}
				}
			}

			//Delete entity from expire
			for(var e in _data.expire.entities) {

				if(_data.expire.entities[e].entity === entity[a]) {
					_data.expire.entities.splice(i, 1);
				}
			}
		}

		//Clear expire timer if there are no entities left
		if(_data.expire.entities.length === 0) {
			clearInterval(_data.expire.timer);
		}
	}

	//Event on
	_data.instance.on = function(type, callback) {

		_data.type.event(type);
		_data.events.types[type].push(callback);
	}

	//Event off
	_data.instance.off = function(type) {

		_data.type.event(type);
		_data.events.types[type] = [];
	}

	_data.instance.dump = function(entities) {

		var dump = [];

		if(entities) {
			
			if(false === Array.isArray(entities)) {
				entities = [entities];
			}

			for(var a in entities) {

				var plain = {};

				_data.type.entity(entities[a].toString());

				for(var b in entities[a]) {

					if(entities[a][b] && entities[a][b].get && typeof(entities[a][b].get) === 'function') {
						plain[b] = entities[a][b].get();
					}
				}

				dump.push(plain);
			}
		}

		if(1 === dump.length) {
			return dump[0];
		}

		return dump;
	}
};




//Add the model to Nerms
Nerms.type.add({name : 'Phonenumber', properties : {id : null, number : null}});
Nerms.type.add({name : 'User', properties : {id : null, firstname : null, lastname : null, phonenumber : []}});


//Define user
var properties = {id : 1, firstname : 'Kris', lastname : 'Kuiper', phonenumber : []};

//Create entity
var user = new Nerms.entities.User(properties);


//Define phonenumber
var properties = {id : 1, number : '0123456789'};

//Create entity
var phonenumber = new Nerms.entities.Phonenumber(properties);


user.phonenumber.push(phonenumber);

console.log(Nerms.models.User.find.id(1).phonenumber.list()[0].number.get());