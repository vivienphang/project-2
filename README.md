# Frisk! 

Frisk! *(Frisk: means Fresh in Danish)* is a full-stack food tracker application for the modern homeowners. This enables them to track existing perishable in their kitchen and consume them before they go bad.

It features an expiration timer which tells the user when their perishables have expired.

# App Demo

Coming soon.

# Features List

**1. Add Your Food**

  Start tracking your food by adding perishable items into the app with its storage location and expiration date.

**2. Edit or Delete Your Food**

  Option to edit or delete the entry as and when it is necessary.

**3. Expiry Timer**

  Timer enables user to consume perishables before they go bad or throw away the expired perishable to avoid bad odour in the storage location. 

# Technologies Used

**Frontend**

<ul>
<li>Embedded JavaScript (EJS)</li>
<li>Bootstrap</li>
<li>CSS</li>

</ul>


**Backend**

<ul>
<li>Node.js</li>
<li>Express</li>
<li>PostgreSQL</li>
</ul>


# Learning Outcomes

This was my first time building a full-stack app using EJS and PostgreSQL. By the end of the project, I felt comfortable with EJS templates and its syntaxes, and querying the backend using PostgreSQL (Note: During this time, we hadn't learnt about Sequelize yet).

It was my first time styling the app with Bootstrap for Frontend pages. The biggest technical challenge faced was passing the manipulated data from  `index.js` into `ejs` template due to its new syntaxes.

**_Project Schedule_**

| Week 1   | Week 2  | Week 3       |
| -------- | ------- | ----------   |
| Ideation | MVP     | Presentation |

# Getting Started

**1. Clone the repo**

  `git clone https://github.com/vivienphang/project-2.git`

**2. Install NPM packages**

  `npm install`

**3. Setup PostgreSQL DB connection**

  ```
  const pgConnectionConfigs = {
   user: 'DB_NAME',
   host: 'LOCALHOST',
   database: 'DATABASE',
   port: 'PORT',
  }
  ```


