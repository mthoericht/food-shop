
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
		'click':'addToCart'
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
		App.cart.add( this.model );
	}
});


//Container for items
App.View.ItemsContainer = Backbone.View.extend(
{
	el: '#shop-items-container',

	initialize: function()
	{
		this.render();
	},

	render: function()
	{
		this.collection.each(function( item )
		{
			var itemView = new App.View.Item({model: item});
			this.$el.append(itemView.render().el);
		},this);
	}
});


App.View.ShoppingCartItemView = Backbone.View.extend(
{
	tagName: 'tr',
	template : $('#template-shoppingCartItem').html(),

	events :
	{
		'click.name' : 'remove',
		'click.quantity' : 'manageQuantity'
	},

	initialize : function() {
		
		this.render();

		this.model.on('change', function()
		{
			this.render();
		}, this);

	},

	render : function()
	{
		this.$el.html( _.template( this.template, this.model.toJSON() ));
		return this;
	},

	manageQuantity : function( event )
	{
		var type = $(event.target).data('type');

		if( this.model.get('quantity') === 1 && type === 'decrease' )
		{
			this.remove();
		
		} else
		{
			this.model.quantity(type);
		}
	},

	remove : function()
	{
		//Fade out-animation on remove
		this.$el.fadeOut(500, function()
		{
			$(this).remove();
		});

		App.cartItems.remove( this.model );
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
		this.$el.addClass('empty').html('<tr><td colspan="4">Cart is empty</td></tr>');
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
		this.total.html(this.collection.subtotal());

	},

	render : function()
	{
		this.$el.html('');
		this.collection.each(function( item )
		{
			var newShoppingCardItem = new App.View.ShoppingCartItemView({ model : item });
			this.$el.append(newShoppingCardItem.render().el);
		}, this);
	}
});


var itemList = [
	{ title: 'Bacon', description: "Beschreibung", price: 2.99 },
	{ title: 'Cabbage', description: "Beschreibung" },
	{ title: 'Spinnach', description: "Beschreibung", price: 1.40 },
	{ title: 'Salt', description: "Beschreibung", price: 0.88 },
	{ title: 'Bread', description: "Beschreibung" },
	{ title: 'Butter', description: "Beschreibung", price : 1.99 }
];


App.items = new App.Collection.Items();
App.cartItems = new App.Collection.Items();

// external listener
App.cartItems.on('add', function( item )
{
	item.set('quantity',1);
	
});

for(var i in itemList)
{
	App.items.add( new App.Model.Item(itemList[i]));
}

App.cart = new App.View.ShoppingCart();

//on Start
$(function()
{
	App.itemList = new App.View.ItemsContainer({collection:App.items});
});

