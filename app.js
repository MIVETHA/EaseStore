const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();

// Configure Passport.js for Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
    // Save user info to the session
    // Example User model usage (adjust as needed)
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return done(err, user);
    });
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

// Middleware setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Sample products data
const products = [
    { id: 1, name: 'Basic T-Shirt', image: 'Basic_t shirt.jpg', price: 19.99 },
    { id: 2, name: 'Cool Hat', image: 'cool_hat.jpg', price: 9.99 },
    { id: 3, name: 'Stylish Jacket', image: 'stylish_jacket.jpg', price: 49.99 },
    { id: 4, name: 'Guitar', image: 'Guitar.jpg', price: 39.99 },
    { id: 5, name: 'Sunglasses', image: 'sunglasses.jpg', price: 14.99 },
    { id: 6, name: 'Wrist Watch', image: 'wrist_watch.jpg', price: 99.99 },
    { id: 7, name: 'Backpack', image: 'backpack.jpg', price: 29.99 },
    { id: 8, name: 'Beanie', image: 'beanie.jpg', price: 12.99 }
];

// Route for Home Page
app.get('/', (req, res) => {
    res.render('index', { user: req.user, products: products });
});

// Route for Products Page
app.get('/products', (req, res) => {
    res.render('products', { user: req.user, products: products });
});

// Route for Product Detail Page
app.get('/product/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    res.render('product-detail', { user: req.user, product: product });
});

// Route for Contact Page
app.get('/contact', (req, res) => {
    res.render('contact', { user: req.user });
});

// Route for Login Page
app.get('/login', (req, res) => {
    res.render('login', { user: req.user });
});

// Google Authentication Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

// Cart Routes
app.post('/cart/add/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    if (!req.session.cart) {
        req.session.cart = [];
    }
    const product = products.find(p => p.id === productId);
    if (product) {
        req.session.cart.push(product);
    }
    res.redirect('/cart');
});

app.get('/cart', (req, res) => {
    res.render('cart', { user: req.user, cart: req.session.cart || [] });
});

// Checkout Route
app.get('/checkout', (req, res) => {
    res.render('checkout', { user: req.user });
});

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
