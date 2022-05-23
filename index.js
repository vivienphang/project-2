// import all tools
import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';
const { Pool } = pg;

// the SALT is a constant value
const SALT = "Fresh food always"

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(methodOverride('_method'))
app.use(cookieParser())
app.use(express.urlencoded( { extended: false } ))

// setup postgres DB connection
const pgConnectionConfigs = {
  user: 'vivienphang',
  host: 'localhost',
  database: 'postgres',
  port: 5432,
}
// create new client with configuration information
const pool = new Pool(pgConnectionConfigs);
pool.connect(); // this connects to the DB

/* ####################################################
                    ROUTE FUNCTIONS
#################################################### */

// Function for home page
const homePage = (req, res) => {
  res.render('home');
}

// Sign up form and function
const newForm = (req, res) => {
  console.log('rendering sign up form')
  res.render('sign-up');
};

// signup-form.ejs - hash their password and store only the hashed password in the DB.
const userSignup = (req, res) => {
  console.log('sending user information into DB')
  const { name, email, password, groups_id } = req.body
  console.log('This is req.body:', req.body);
  const shaObj = new jsSHA('SHA-512', 'TEXT', {encoding: 'UTF8'} );
  // input password from request to the SHA object
  shaObj.update(req.body.password);
  // get the hashed password as output from SHA object
  const hashedPassword = shaObj.getHash('HEX');
  console.log('hashed text');
  console.log(hashedPassword);
  // send users information into DB
  pool.query(`INSERT INTO users (name, email_address, password, groups_id) VALUES ('${name}', '${email}', '${hashedPassword}', ${groups_id});`)
  .then((result) => {
    // redirect new user to login page
    res.render('user-signed-up')
  })
  .catch((error) => {
    console.log('error', error)
  })
}

// When the user logs in, hash their password and compare with hashed password in the DB.
const loginPage = (req, res) => {
  console.log('rendering login page')
  res.render('login')
}

const isLoggedIn = (req, res) => {
  // make query to DB to retrieve data
  pool.query(`SELECT * from users where email_address = '${req.body.email}'`,(error, result) => {
    // return error if there is an error
    if (error) {
      console.log('Error retrieving email:', error.stack)
      return;
    }
    // if we didn't find a user with that email
    if (result.rows.length === 0) {
      res.status(403).send('You do not have an account. Please sign up.')
      return;
    }
    // get user records from results
    const user = result.rows[0]
    const userID = result.rows[0].id
    console.log(result.rows.id)
    //initialise shaObj
    const shaObj = new jsSHA('SHA-512', 'TEXT', {encoding: 'UTF8'});
    // input the password from the request to shaObj
    shaObj.update(req.body.password);
    // hash the password we have gotten
    const userPassword = shaObj.getHash('HEX');

    // check input password against DB password
    if (user.password !== userPassword) {
      // there is an error in the login password
      res.status(403).send('Oh snap! Password is incorrect. Please try again.');
      return;
    }
    res.cookie('loggedIn', true);
    res.cookie("users_id", userID)
    // // redirect to home page to show a list
    res.send('User logged in.');
  });
}
// new entry form
const newEntry = (req, res) => {
  console.log('rendering new entry form')
  res.render('entry-form')
}

// Function to add new food item
const addEntry = (req, res) => {
  console.log('adding new entry')
  // deconstrucing request.body
  const { 
    foodName, // TEXT
    category_id, // INT
    location_id, // INT
    purchaseDate, // DATE
    openDate, // DATE
    expiryDate, // DATE
    } = req.body;
  console.log(req.body)
  const { users_id } = req.cookies
  console.log(req.cookies)

  // make query to insert data into DB
  pool.query(`INSERT INTO food (name, category_id, location_id, purchase_date, open_date, expiry_date, users_id) VALUES ('${foodName}', ${category_id}, ${location_id}, '${purchaseDate}', '${openDate}', '${expiryDate}', ${users_id})`)
  .then((result) => {
    // redirect new user to list page
    res.render('entry-accepted')
  })
  .catch((error) => {
    console.log('error', error)
  })
};

// Function to handle all entries
// const allEntries = (req, res) => {
//   console.log('rendering single entry')
//   const entryDataObj = data[req.params.index]; 
//   console.log(entryDataObj)
//   console.log(req.params.index)
//   res.render('all-entries')
// }

// Function to handle single entry
const singleEntry = (req, res) => {
  console.log('rendering GET request: /single-entry/:id')
  const { id } = req.params
  console.log('Single entry:', id)
  // make query to select data from "food" table
  pool.query(`SELECT food.name AS food_name, category_id, location_id, purchase_date, open_date, expiry_date, category.name AS category_name, location.name AS location_name 
  FROM food 
  INNER JOIN category
  ON category.id = food.category_id 
  INNER JOIN location ON location.id = food.category_id
  WHERE food.id  = ${id}`)
    .then((result) => {
      const entryObj = result.rows[0]
      console.log(result.rows[0])
      res.render('single-entries', entryObj)
    }).catch((error) => {
      console.log('error:', error)
    }
)}



/* ####################################################
                   ROUTE NAVIGATION
#################################################### */
app.get('/signup', newForm);
app.post('/signup', userSignup);
app.get('/login', loginPage);
app.post('/login', isLoggedIn);
app.get('/new-entry', newEntry);
app.post('/new-entry', addEntry);
// In progress
// app.get('/all-entries', allEntries);
app.get('/single-entry/:id', singleEntry);
// app.get('/single-entry/:id/edit', editEntry);


// Last
app.get('/home', homePage)

// Setup port
const PORT = 8000;
app.listen('8000', (console.log('Listening to port 8000'))
);