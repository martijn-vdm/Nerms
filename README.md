# Nerms
Nerms; Nodejs Entities, Relationships Models. This module can be used to maintain and easly find entities and their relations. The library uses models to store single entities for easy finding and accessing your data. 

## Usage
##### Installation
```bash
$ npm install nerms
```
##### Require
To use Nerms you can simply require the module as follows:
```javascript
var Nerms = require('nerms');
```

## Model and entity relation
Each entity has it own properties. For example, a User entity can have an id, first name and last name property:
```javascript
var properties = {id : 1, firstname : 'Kris', lastname : 'Kuiper'};
```

To store this entity, you first need to create the model. You may create a new Model by simply adding them to Nerms. We will create a User model to store user data:
```javascript
//Create model properties
var properties = {id : null, firstname : null, lastname : null };

//Create Model and add the properties
var model = {name : 'User', properties : properties};

//Add the model to Nerms
Nerms.type.add(model);
```

Now you can add your entity to the model you just created:
```javascript
//Defining the properties
var properties = {id : 1, firstname : 'Kris', lastname : 'Kuiper'};

//Creating new User entity and adding it automatic to the User model
var entity = new Nerms.entities.User(properties);
```

You can view your model by executing the following code:
```javascript
console.log(Nerms.models.User)
```

The model will have three properties:
* list
* push
* find


## The model
##### Model list function
To show all entities within a model you may use the list function:
```javascript
var entities = Nerms.models.User.list();

console.log(entities); //Will output: [Entity]
```
As you can see, the output is an Array so you can loop through your entities if necessary:
```javascript
var entities = Nerms.models.User.list();

for(entity in entities) {
	console.log(entities[entitiy]);
}
```

##### Model find function
The find function contains every entity attribute, so you may find an entitie by its property. The User entity we created above contains an id, firstname and lastname property. So the find property also contains these three properties:
```javascript
console.log(Nerms.models.User.find);
/*
Output:

Object {}
- firstname: (value, strict)
- id: (value, strict)
- lastname: (value, strict)
* /
```
If you want to find a user by its first name you can simply use:
```javascript
var entity = Nerms.models.User.find.firstname('Kris');
console.log(entity);
```

##### Model push function
You can add entities to an existing model by using the push function: 
```javascript
//Create entity
var entity = new Nerms.entities.User({id : 1, firstname : 'Kris', lastname : 'Kuiper'});

//Add entity to the User model
Nerms.models.User.push(entity)
```
###### \**Important note*\*
If you create an entity it will automatically be pushed to the model. So if you use the above code, you will have two equal User entities.

##### Model destroy function
If you want to delete a Model with all its Entities, you may use the "destroy" function for Models. Here, too, applies that all Entities are destroyed within the Model you want to destroy. 
```
Nerms.type.destroy('User');
```

## The entity
##### Creating entities
If you creating an entity, it will be automatically be added to the model.
```javascript
//Define user
var properties = {id : 1, firstname : 'Kris', lastname : 'Kuiper'};

//Create entity
var entity = new Nerms.entities.User(properties);
```

##### Map entities
If you have a record set of, for example, multiple users that you want to add as new Entities, you can add them simply by calling the "map" function. The map function expects a single object or an Array of objects:
```javascript
//Define users
var users = [
	
	{id : 1, firstname : 'Kris', lastname : 'Kuiper'},
	{id : 2, firstname : 'John', lastname : 'Smith'},
	{id : 3, firstname : 'Mary', lastname : 'Collins'}
];

//Create entities
Nerms.map(users, 'User');
```
##### Get property value from entity
Of cource you can get the value from an entity property:
```javascript
//Find entity
var entity = Nerms.models.User.find.id(1);

//Get firstname value
var value = entity.firstname.get();

console.log(value) //Will output: Kris
```

##### Set property value of an entity
If you want to update the value of an entity:
```javascript
//Find entity
var entity = Nerms.models.User.find.firstname('Kris');

console.log(entity.firstname.get()) //Will output: Kris

//Update firstname value
entity.firstname.set('John');

console.log(entity.firstname.get()) //Will output: John
```


##### Destroy entities
The "destroy" function will make sure that entities will be deleted in Nerms, so you won't be able to find an Entity in a Model or as a relationship in another Entity.
You may destroy an Entity by doing so:
```javascript
//Find the entity you want to destroy
var entity = Nerms.models.User.find.id(1);

//Destroy entity
Nerms.destroy(entity);
```

##### Expire entities automatically
Nerms gives you the power to destroy an entity automatically after a predefined time in seconds. If your entity needs to be removed from this planet in 60 seconds, you can do this:
```
//Create entity
var entity = new Nerms.entities.User({id : 1, firstname : 'Kris', lastname : 'Kuiper'});

Nerms.expire(entity, 60);
```
After 60 seconds the entity will be removed and a "expire" event is raised. You can read more about events in the "Event" section.



## Relationships between entities
#### Automatic relationships
Imagine you have a user with multiple phone numbers and you want to get the user by a specific phone number. You have to create a relationship between the user and its phone number(s). Well, I have good news, because you can let Nerms do the work for you for maintaining those relationships. You don't even have to bother linking new users or phone numbers to each other when adding them.

You may create automatic relationships between entities. So you can look up, for example, a phonenumber from a user and vice versa. Let’s see how our entity properties should look like:
```javascript
//User properties
{id : 1, firstname : 'Kris', lastname : 'Kuiper', 'phone_id' : 1}

//Phonenumber properties
{id : 1, number : '0123456789', user_id : 1}
```
The "phone_id" is the "id" property in our Phone entity as the "user_id" is the "id" property our User entity.

##### Creating the models
We still have to tell Nerms how our relationship works. So lets create the two models:
```javascript
var userModel  		 = Nerms.type.add({name : 'User', properties : {id : null, firstname : null, lastname : null, phonenumbers : []}});
var phonenumberModel = Nerms.type.add({name : 'Phonenumber', properties : {id : null, number : null, users : [] }});
```
As you can see, we define custom properties for our two models. Be aware that the "phone" and "user" property of the two models are type of Arrays. These arrays may contain entities as you want to store a Phone entity into a User entity and visa versa.

##### Link the models
Let’s link the two models together:
```
userModel.link({model : 'Phonenumber', on : ['user_id', 'id'], property : ['phonenumbers', 'users']});
phonenumberModel.link({model : 'User', on : ['phonenumber_id', 'id'], property : ['users', 'phonenumbers']});
```
The "on" property are the properties of our new entities that will define the link. The "property" properties are equal to the Arrays in our earlier created models.

##### Add new entities
Now we are going to add a user and phonenumber:
```
//Creating new User entity and adding it automatic to the User model
var user = new Nerms.entities.User({id : 1, firstname : 'Kris', lastname : 'Kuiper', 'phonenumber_id' : 1});

//Creating new Phonenumber entity and adding it automatic to the Phonenumber model
var phonenumber = new Nerms.entities.Phonenumber({id : 1, number : '0123456789', user_id : 1});
```
##### Result
Trying to find a phonenumber by number will get you all the users that are linked:
```
var users = Nerms.models.Phonenumber.find.number('0123456789').users.list();
console.log(users); 

/* 
Output:
[ Entity {
    id: { get: [Function], set: [Function] },
    firstname: { get: [Function], set: [Function] },
    lastname: { get: [Function], set: [Function] },
    phonenumbers: { list: [Function], push: [Function] } 
} ]
*/
```

#### Manual relationships
You can manually push an entity in an existing entity. In this example we will create a User entity and push a Phonenumber entity into the User entity. Be aware that the "phonenumber" property must be an Array to push entities into it.
```javascript
//Define user
var properties = {id : 1, firstname : 'Kris', lastname : 'Kuiper', phonenumber : []};

//Create User entity
var user = new Nerms.entities.User(properties);

//Define phone number
var properties = {id : 1, number : '0123456789'};

//Create Phonenumber entity
var phonenumber = new Nerms.entities.Phonenumber(properties);

//Add Phonenumber entity to phonenumber property of User entity
user.phonenumber.push(phonenumber)

```

## Events
##### On event
Nerms will trigger events based on adding, expiring and destroying entities:

```javascript
Nerms.on('add', function(entity) {
	console.log(entitiy);
});

Nerms.on('expire', function(entity) {
	console.log(entitiy);
});

Nerms.on('destroy', function(entity) {
	console.log(entitiy);
});
```

###### \**Important note*\*
If an entity is expired it will raise the "expire" event, but also the "destroy" event because of the fact that when an Entity is expired, it will also be destroyed. 

##### Off event
When you no longer want to listen to an specific event, you can use the "off" function:
```javascript
Nerms.off('expire');
Nerms.off('add');
Nerms.off('destroy');
```


## Dump
If you want to debug or just want to use all the data as an Object from an entity. You may use the "Dump" function so you can achieve this:
```javascript
//Find the entity
var entity = Nerms.models.User.find.id(1);

//Dump entity
var object = Nerms.dump(entity);

console.log(object); //Will ouput: { id: 1, firstname: 'Kris', lastname: 'Kuiper' }
```

###### \**Important note*\*
If you pass multiple Entities to the "dump" function, it will return an Array with objects
