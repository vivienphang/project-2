// import all tools
import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';
const { Pool } = pg;
import moment from 'moment';

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

// Homepage: Shortcut to "login and signup"
const homePage = (req, res) => {
  res.render('home');
}

// Dashboard: Shortcut to "all entry and view all" 
const dashPage = (req, res) => {
  res.render('dashboard');
}

// Sign up form
const newForm = (req, res) => {
  console.log('rendering sign up form')
  res.render('sign-up');
};

// Signup: Hash User's password and store only the hashed password in DB.
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

// Login: Hash User's input password again and compare with above hashed password in DB.
const loginPage = (req, res) => {
  console.log('rendering login page')
  res.render('login')
}

// After user logged in and cookie sent
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
    const userName = result.rows[0].name
    console.log(result.rows)
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
    res.cookie("users_name", userName)
    // // redirect to home page to show a list
    res.redirect('/dashboard');
    console.log('redirect works')
  });
}
// New entry form
const newEntry = (req, res) => {
  console.log('rendering new entry form')
  const { users_name } = req.cookies
  console.log(users_name)
  const ejsObj = { users_name }
  console.log(ejsObj)
  res.render('entry-form', ejsObj)
}

// Add new entry and acknowledge entry 
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
  const { users_name } = req.cookies
  console.log(req.cookies)

  // make query to insert data into DB
  pool.query(`INSERT INTO food (name, category_id, location_id, purchase_date, open_date, expiry_date, users_id) VALUES ('${foodName}', ${category_id}, ${location_id}, '${purchaseDate}', '${openDate}', '${expiryDate}', ${users_id})`)
  .then((result) => {
    res.render('entry-accepted')
  })
  .catch((error) => {
    console.log('error', error)
  })
};


// Display all entries with countdown timer

// const allEntries = (req, res) => {
//   console.log('rendering GET request:/all-entries')
//   pool.query(`SELECT food.id AS food_id, food.users_id, food.name AS food_name, food.location_id, food.expiry_date, location.id, location.name AS location_name, users.id, users.name AS user_name
//   FROM food
//   INNER JOIN location
//   ON location.id = food.location_id
//   INNER JOIN users ON users.id = food.users_id`)
//   .then((result) => {
//     const ejsObj = result.rows
//     console.log(ejsObj)
//     // modify date for expiry_date
//     for ( let i = 0; i < ejsObj.length; i += 1 ) {
//       const newExpiryDate = ejsObj[i].expiry_date
//       console.log(newExpiryDate)
//       ejsObj[i].expiry_date = newExpiryDate;
//       const { expiry_date } = result.rows[0]
//       result.rows[0].expiry_date = moment(expiry_date)
//       var current_date =  moment(new Date())
//       console.log('expiry date:', expiry_date);
//       console.log('current date:', current_date);
//       // const timeDiff = expiry_date.timeDiff(current_date);
//       const timeDiff = moment(expiry_date).subtract(current_date, 'days').calendar();
//       console.log(timeDiff)
//       let a = Math.round((timeDiff)/(1000*60*60*24)) // math.round convert milliseconds to days
//       // const timeDiffStr = a.toString(); // convert timeDiff to string value
//       console.log(typeof a)
//       console.log(a, 'days left to consume!')
//       let currentStatus = '';
//       ejsObj[i].status = currentStatus;
//       const { status } = result.rows[0]
//       result.rows[0].status = status
//       console.log(status)
//       // if timeDiffStr === '0', show 'Expired 
//       if (!timeDiff > 0) {
//       console.log('Food has expired!')
//     }
//     else console.log(`You still have ${a} days left to consume!`)
//     }
//     res.render('all-entries', {ejsArray: ejsObj} )
//     }).catch((error) => {
//       console.log('error:', error)
//   })
// }

// Display all entries with countdown timer
const allEntries = (req, res) => {
    console.log('rendering GET request:/all-entries')
    pool.query(`SELECT food.id AS food_id, food.users_id, food.name AS food_name, food.location_id, food.expiry_date, location.id, location.name AS location_name, users.id, users.name AS user_name
    FROM food
    INNER JOIN location
    ON location.id = food.location_id
    INNER JOIN users ON users.id = food.users_id`)
    .then((result) => {
        const ejsObj = result.rows
        console.log(ejsObj)
        // modify date for expiry_date
        for (let i = 0; i < ejsObj.length; i += 1) {
            const newExpiryDate = ejsObj[i].expiry_date
            console.log(newExpiryDate)
            ejsObj[i].expiry_date = newExpiryDate;
            const { expiry_date } = result.rows[0]
            result.rows[0].expiry_date = expiry_date
            var current_date = new Date()
            let timeDiff = (expiry_date.getTime() - current_date.getTime())
            let daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))
            console.log(daysLeft, 'days left to consume')

            // const a = Math.round((timeDiff) / (1000 * 60 * 60 * 24)) 
            // console.log('Time diff:', a)
            // insert key "status" into ejsObj
            let currentStatus
            if (!daysLeft < 0) {
                currentStatus = 'Food has expired!'
            } else {
                // const a = Math.round((timeDiff) / (1000 * 60 * 60 * 24)) // math.round convert milliseconds to days
                currentStatus = `${daysLeft} days left to consume!`
            }
            ejsObj[i].status = currentStatus;
            const { status } = result.rows[0]
            result.rows[0].status = status
        }
        console.log(ejsObj)
        res.render('all-entries', { ejsArray: ejsObj })
    }).catch((error) => {
        console.log('error:', error)
    })
}





// Display single entry
const singleEntry = (req, res) => {
  console.log('rendering GET request: /single-entry/:id')
  const { id } = req.params
  const { users_name } = req.cookies
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
      // modify dates
      const newPurchaseDate = entryObj.purchase_date.toISOString().slice(0, 10);
      console.log(newPurchaseDate)
      entryObj.purchase_date = newPurchaseDate;
      const newOpenDate = entryObj.open_date.toISOString().slice(0, 10);
      console.log(newOpenDate)
      entryObj.open_date = newOpenDate;
      const newExpiryDate = entryObj.expiry_date.toISOString().slice(0, 10);
      console.log(newExpiryDate)
      entryObj.expiry_date = newExpiryDate;
      entryObj.users_name = users_name;
      res.render('single-entry', entryObj)
    }).catch((error) => {
      console.log('error:', error)
    }
)}

const editEntry = (req,res) => {
  console.log('request GET: /single-entry/:id/edit')
  const { id } = req.params
  const { users_name } = req.cookies
  console.log(id)
  pool.query(`SELECT food.name AS food_name, category_id, location_id, purchase_date, open_date, expiry_date, category.name AS category_name, location.name AS location_name 
  FROM food 
  INNER JOIN category
  ON category.id = food.category_id 
  INNER JOIN location ON location.id = food.location_id
  WHERE food.id  = ${id}`)
  .then((result) => {
      const entryObj = result.rows[0]
      console.log(result.rows)
      console.log(result.rows[0])
      // modify dates
      const newPurchaseDate = entryObj.purchase_date.toISOString().slice(0, 10);
      console.log(newPurchaseDate)
      entryObj.purchase_date = newPurchaseDate;
      const newOpenDate = entryObj.open_date.toISOString().slice(0, 10);
      console.log(newOpenDate)
      entryObj.open_date = newOpenDate;
      const newExpiryDate = entryObj.expiry_date.toISOString().slice(0, 10);
      console.log(newExpiryDate)
      entryObj.expiry_date = newExpiryDate;
      entryObj.users_name = users_name;
      console.log(entryObj)
      entryObj.food_id = id
      console.log(entryObj)
  res.render('edit-entry', entryObj)
})
}

const editFormEntry = (req, res) => {
  console.log('request PUT: /single-entry/:id/edit')
  const { id } = req.params;
  pool.query(`UPDATE food 
  SET name = '${req.body.foodName}', category_id = ${req.body.category_id}, location_id = ${req.body.location_id}, purchase_date = '${req.body.purchaseDate}', open_date = '${req.body.openDate}', expiry_date = '${req.body.expiryDate}'
  WHERE id = ${id}`)
  .then(() => {
    res.redirect('/all-entries')
  })
}

const deleteEntry = (req, res) => {
  console.log('request GET: /delete-entry/:id')
  const { id } = req.params;
  pool.query(`
  DELETE FROM food where id = ${id}`)
  .then(() => {
    res.redirect('/all-entries')
  })
}

// // Setting expiry date calculator
// const getCountdownTracker = (req, res) => {
//   console.log('getting countdown tracker')
//   // get expiry_date input from SQL
//   pool.query('SELECT expiry_date FROM food')
//   .then((result) => {
//     // use results -> expiry_date and calculate the countdown
//     const { expiry_date } = result.rows[0]
//     result.rows[0].expiry_date = expiry_date
//     var current_date =  new Date();
//     const ejbObj = result.rows
//     console.log('expiry date:', expiry_date);
//     console.log('current date:', current_date);
//     const timeDiff = Math.abs(current_date - expiry_date);
//     let a = Math.round((timeDiff)/(1000*60*60*24))
//     const timeDiffStr = a.toString();
//     console.log(typeof timeDiffStr)
//     console.log(timeDiffStr, 'days left to consume!')
//     // if timeDiffStr === '0', show 'Expired in red font (create const)'
//     if (timeDiffStr === '0') {
//       return 
//     }
 

//     res.send('this works')
//   })
// }



// Logout and remove cookies
const isLoggedOut = (req, res) => {
  console.log('logging out')
  res.clearCookie("loggedIn");
  res.clearCookie("users_id");
  res.clearCookie("users_name");
  res.render('logout')
}


/* ####################################################
                   ROUTE NAVIGATION
#################################################### */

// Signup & Login
app.get('/signup', newForm);
app.post('/signup', userSignup);
app.get('/login', loginPage);
app.post('/login', isLoggedIn);

// Add new entry
app.get('/new-entry', newEntry);
app.post('/new-entry', addEntry);

// Show single entry & all entries
app.get('/all-entries', allEntries);
app.get('/single-entry/:id', singleEntry);

// Edit entry
app.get('/single-entry/:id/edit', editEntry);
app.put('/single-entry/:id/edit', editFormEntry);

// Delete entry
app.get('/delete-entry/:id', deleteEntry);
// app.delete('/single-entry/:id/delete', deleteEntry);

// Countdown tracker
// app.get('/timer', getCountdownTracker)

// Home & Dashboard
app.get('/home', homePage)
app.get('/dashboard', dashPage)

// Logout
app.get('/logout', isLoggedOut)
app.delete('/logout', isLoggedOut)

// Setup port
const PORT = 8000;
app.listen('8000', (console.log('Listening to port 8000'))
);