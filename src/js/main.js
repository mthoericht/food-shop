
//Namespaces
var App =
{
	Collection : {},
	Model : {},
	View : {}
};


App.Model.Item = Backbone.Model.extend(
{
	defaults :
	{
		'price' : 0.99,
		'quantity': 0,
		'total': 0
	},

	total : function()
    {
		var total = this.get('price') * this.get('quantity');
		this.set('total', total);
		return total;

	},

	quantity : function( type )
	{
		var qty = this.get('quantity');
		this.set('quantity', (type === 'increase' ? ++qty : --qty) );
	}
});



// Define our Collection
App.Collection.Items = Backbone.Collection.extend(
{
	models: App.Model.Item,

	//Path to external json (request on call fetch)
	url: 'data/products.json',

	//External jsons must be parse
	parse: function(response)
	{
		return response.results;
	},

	// Sync method is overwritable for Same Origin Policy
	/*sync: function(method, model, options) {
		var that = this;
		var params = _.extend({
			type: 'GET',
			dataType: 'json',
			url: that.url,
			processData: false
		}, options);

		return $.ajax(params);
	},*/

	subtotal : function()
	{
		var total = 0;

		this.each(function( model )
		{
			total += model.total();
		});

		return total.toFixed(2);
	}
});


//The item in the shop
App.View.Item = Backbone.View.extend(
{
	// this view is a div element
	tagName: 'div',
	// add bootstrap-classes for responsive Grid (Max 3/row)
	className:'col-sm-4 col-lg-4 col-md-4',
	template : $('#template-shoppingListItem').html(),

	events:
	{
		'click .btnAddToCart' : 'addToCart'
	},

	initialize: function()
	{
		this.render();
	},

	render: function()
	{
		this.$el.html(_.template(this.template, this.model.toJSON()));
		return this;
	},

	//onClick
	addToCart : function()
	{
		App.cart.add(this.model);
	}
});


//Container for items
App.View.ItemsContainer = Backbone.View.extend(
{
	el: '#shop-items-container',

	initialize: function()
	{
		_.bindAll(this, 'render');

		var that = this;

		App.items.fetch(
		{
			success: function ()
			{
				for(var i in arguments[1])
				{
					App.items.add(new App.Model.Item(arguments[1][i]));
					//console.log("TITLE: " + arguments[1][i].title);
				}

				that.render();
			}
		});
	},

	render: function()
	{
		this.collection.each(function(item)
		{
			var itemView = new App.View.Item({model: item});
			this.$el.append(itemView.render().el);
		},this);
	}
});


App.View.ItemsFilter = Backbone.View.extend(
{
	el: '#shop-items-filter',

	initialize: function()
	{
		console.log("??");
	},

	render: function()
	{

	}
});


App.View.ShoppingCartItemView = Backbone.View.extend(
{
	tagName: 'div',
	className:'list-group-item',
	template : $('#template-shoppingCartItem').html(),

	events :
	{
		'click .btnRemoveCartItem' : 'remove',
		'click .btnIncrementCartItem' : 'incrementQuantity',
		'click .btnDecrementCartItem' : 'decrementQuantity'
	},

	initialize : function()
	{
		this.render();

		//Re-Render on change
		this.model.on('change', function()
		{
			this.render();
		}, this);

	},

	render : function()
	{
		this.$el.html( _.template(this.template, this.model.toJSON()));
		return this;
	},

	incrementQuantity : function(event)
	{
		//var type = $(event.target).data('type');
		this.model.quantity('increase');
	},

	decrementQuantity : function(event)
	{
		if(this.model.get('quantity') === 1)
		{
			this.remove();
		} else
		{
			this.model.quantity('decrease');
		}
	},

	remove : function()
	{
		//Fade out-animation on remove
		this.$el.fadeOut(500, function()
		{
			$(this).remove();
		});

		App.cartItems.remove(this.model);
	}
});


App.View.ShoppingCart = Backbone.View.extend(
{
	el: '#shopping-list',
	total : $('#total'),
	basketTotal : $('#basket'),

	initialize : function()
	{
		this.collection = App.cartItems;
		this.defaultEmptyCartMessage();

		this.collection.on('add remove change:quantity', function( item )
		{
			this.updateTotal();

			if( this.collection.length === 0 )
			{
				this.defaultEmptyCartMessage();
			}
		}, this);
	},

	defaultEmptyCartMessage : function()
	{
		this.$el.addClass('empty').html('Cart is empty');
	},

	add : function( item )
	{
		this.$el.removeClass('empty');
		item.quantity('increase');
		this.collection.add(item);

		this.render();
	},

	updateTotal : function()
	{
		var basketTotal = 0;
		this.collection.each(function( item )
		{
			basketTotal += item.get('quantity');
		});

		this.basketTotal.html(basketTotal);
		this.total.html("Total: " + this.collection.subtotal() + " €");

	},

	render : function()
	{
		this.$el.html('');
		this.collection.each(function(item)
		{
			var newShoppingCardItem = new App.View.ShoppingCartItemView({model:item});
			this.$el.append(newShoppingCardItem.render().el);
		}, this);
	}
});


// create the collections
App.items = new App.Collection.Items();
App.cartItems = new App.Collection.Items();

// external listener
App.cartItems.on('add', function( item )
{
	item.set('quantity', 1);
});

//Create the cart
App.cart = new App.View.ShoppingCart();
App.filter = new App.View.ItemsFilter();

//on Start
$(function()
{
	App.itemList = new App.View.ItemsContainer({collection:App.items});
});