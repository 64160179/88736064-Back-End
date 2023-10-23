var express = require('express'); //npm i express --save
var ejs = require('ejs'); //npm i ejs --save
var bodyParser = require('body-parser'); //npm i body-parser
var mysql = require('mysql'); //npm i mysql
var session = require('express-session'); //npm i express-session 
var app = express(); //create express app
var port = 3000;  //port number 3000

//caonnect to the database
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project"
});

//function for telling status
connection.connect((error) => {
    if (error) {
        console.error('Error connecting to the database:', error);
    } else {
        console.log('Connnected to the database');
    }
});

app.use(express.static('public')); //static files use style css
app.set('view engine', 'ejs'); //set view engine to ejs
app.use(bodyParser.urlencoded({ extended: true })); //use body parser
app.use(session({secret:"secret"})); //use session

//function for checking product in cart
function isProductIncart(cart, id) {
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            return true;
        }
    }
    return false;
};

//function for calculating total
function calculateTotal(cart, req) {
    total = 0;
    for (let i = 0; i < cart.length; i++) {
        //if we're offering a discounted price
        if (cart[i].sale_price) {
            total = total + (cart[i].sale_price * cart[i].quantity);
        } else {
            total = total + (cart[i].price * cart[i].quantity);
        }
    }
    req.session.total = total;
    return total;
};

app.get('/', (req, res) => {
    // Fetch products from the database
    connection.query('SELECT * FROM products', (error, results) => {
        if (error) {
            console.error('Error fetching products: ', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('pages/index', { products: results });
        }
    });
});

app.get('/shop', (req, res) => {
    // Fetch products from the database
    connection.query('SELECT * FROM products', (error, results) => {
        if (error) {
            console.error('Error fetching products: ', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('pages/shop', { products: results });
        }
    });
});

app.get('/team', (req, res) => { 

    res.render('pages/team');

});

app.get('/contact', (req, res) => { 

    res.render('pages/contact');

});

app.get('/cart', function (req, res) { 

    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart', {cart:cart, total:total});

});


app.post('/add_to_cart', function  (req, res) {

    var id = req.body.id;
    var name = req.body.name;  
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var product = {id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image};

    if (req, session.cart) {
        var cart = res.session.cart;
        if (!isProductIncart(cart, id)) {
            cart.push(product);
        }
    } else {
        req.session.cart = [product];
        var cart = req.session.cart;
    }

    //calculate total
    calculateTotal(cart, req);

    //return to cart page
    res.redirect('/cart')
});

app.post('/remove_product', function(req, res) {
    var id = req.body.id;
    var cart = req.session.cart;

    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart.splice(cart.indexOf(i), 1);
        }
    }
    //recalculate
    calculateTotal(cart,req);
    res.redirect('/cart');

});

app.post('/edit_product_qauntity', function (req,res) {

    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity_btn;
    var decrease_btn = req.body.decrease_product_quantity_btn;


    var cart = req.session.cart;

    if (increase_btn) {
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id === id) {

                if (cart[i].quantity > 0) {
                    cart[i].quantity = parseInt(cart[i].quantity) + 1;
                }
            }
        }
    }

    if (decrease_btn) {
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id === id) {

                if (cart[i].quantity > 1) {
                    cart[i].quantity = parseInt(cart[i].quantity) - 1;
                }
            }
        }
    }
    calculateTotal(cart, req);
    res.redirect('/cart');
});

app.get('/checkout', function (req, res) {
    var total = req.session.total;
    res.render('pages/checkout', { total:total })
});

app.post('/place_order', function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var phonr = req.body.phone;
    var city = req.body.city;
    var address = req.body.address;
    var cost = req.session.cost;
    var status = "not paid";
    var date = new Date();
    var product_ids;


    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "node_project"
    });

    var cart = req.session,cart
    for(let i=0; i<cart.length;i++){
        product_ids = product_ids +","+ cart[i].id;
    }

    connection.connect((err) => {
        if (err) {
            console.log(err)
        } else {
            var query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,product_ids) VALUES ?";
            var values = [
                [cost, name, email, status, city, address, phone, date,product_ids]
            ];
            connection.query(query, [values],(err, results)=> {
                res.redirect('/payment');
            });
        }
    });

});

app.get('/payment', function (req, res) {
    res.render('pages/payment')
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
