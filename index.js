const express = require('express');
const path = require('path');
let email ;

const bodyParser = require('body-parser');
const PORT = process.env.PORT ;

const { Pool } = require('pg'); //pg module
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
 
express()
  .use(bodyParser.urlencoded({extended:true}))
  .use(express.static(path.join(__dirname, 'public'))) //public as default folder
  .get('/res',async (req, res) => { 
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT username FROM accounts WHERE email='${email}'`);
        
        res.send({
            email:email,
            name:result.rows

        })
        client.release();
        
        
    } catch (error) {
        res.send(error)
    }     
   
   })       //request for getting email only
  .get('/getdata',async (req, res) => {        //request for getting reservations from db
    const client = await pool.connect();
    const result = await client.query(`SELECT username,email,number,date,des FROM reservations`);
    
        res.send(result)
        client.release();

  })
   
  .post('/edit', async (req, res) => {         //edit reservation in db
    try {

      const client = await pool.connect();
      const result2 = await client.query(`UPDATE reservations
      SET date = '${req.body.newdate}',
      des = '${req.body.newdes}',
      number = '${req.body.newnumber}'
      WHERE date = '${req.body.olddate}';`);
      
      res.send(req.body.newdate)
      client.release();

    } catch (error) {
        res.send({line:req.body.newdate})
    }
      
  })
  .post('/delete', async (req, res) => {        //delete reservation from db
      try {

        const client = await pool.connect();
        const result2 = await client.query(`DELETE FROM reservations WHERE date = '${req.body.datetodelete}' RETURNING *;`);
        res.send(req.body.datetodelete)
        client.release();


      } catch (error) {
          res.send(error)
      }
        
    })

    .post('/db', async (req, res) => {      //sign up new user 
        try {
        
        const client = await pool.connect();
        const result = await client.query(`CREATE TABLE IF NOT EXISTS accounts (
            username VARCHAR ( 50 ) PRIMARY KEY NOT NULL,
            email VARCHAR ( 255 ) UNIQUE NOT NULL,
            password VARCHAR ( 255 ) NOT NULL
        );`);
        const result2 = await client.query(`SELECT username,email FROM accounts`);

         result2.rows.forEach((e,i) => {   //checks if email or name already registered
            ( e.username == req.body.name) ? res.send({lines:'name already exist'}) : '';
            ( e.email == req.body.email) ? res.send({lines:'email already exist'}): ''       
             })

        const result1 = await client.query(`INSERT INTO accounts (username, email, password) VALUES('${req.body.name}','${req.body.email}','${req.body.password}')`);
        res.send({lines:'sign up successful'}) //sign up success
        client.release();
                
    } catch (err) {
         res.send(err)
        }
    })
    .post('/create', async (req, res) => {          // making reservations here
        try {
        
        const client = await pool.connect();
        const result = await client.query(`CREATE TABLE IF NOT EXISTS reservations (
            email VARCHAR ( 255 )  NOT NULL,
            username VARCHAR ( 50 )  NOT NULL,
            number VARCHAR ( 255 ) NOT NULL,
            date DATE UNIQUE NOT NULL,
            des VARCHAR ( 355 )  NOT NULL
        );`);

        const result1 = await client.query(`INSERT INTO reservations (email, username, number, date, des ) VALUES('${req.body.email}','${req.body.name}','${req.body.number}','${req.body.date}','${req.body.des}')`);
        res.send({lines:'reservation created'})
        client.release();
                
    } catch (err) {
         res.send(err)
        }
    })

    .post('/login', async (req, res) => {   //login  request
        try {
        
        email = req.body.email
        console.log(req.body.email)
        const client = await pool.connect();  
        const result2 = await client.query(`SELECT password,email FROM accounts`);

        result2.rows.forEach((e,i) => {
           if ( e.email == req.body.email) {    //checks password
               ( e.password == req.body.password )?res.send({lines:'login success',success:true}) :res.send({lines:'wrong password'});

            } 
        })
        res.send({lines:'no record found'}) // if no email is found in db
        client.release();
                
    } catch (err) {
         res.send('err'+err)
        }
    })

  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
