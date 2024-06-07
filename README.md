# Overview:
Secrets website provides a safe space for you to share your deepest thoughts and experiences without any fear of judgment. 
You can submit your secrets anonymously, ensuring your identity remains completely private. Whether it's a hidden dream, a past mistake, or a personal confession, feel free to express yourself freely.

# Technology Stack:
- HTML5.
- CSS.
- Bootstrap.
- JavaScript.
- EJS.
- Node.js.
- Express.js.
- PostgreSQL.
- User Authentication.
- OAuth.

# Visit The Website:
- Click on the link: https://secrets-bq0c.onrender.com/

# To Run The Project:
- Create your Database you can name it any name, then take the Schema Definition from "queries.sql" file.
- Clone the repository, inside the terminal (git clone https://github.com/shahedsaadi/Secrets.git).
- Run npm install

*-* After finishing the previous steps you need to follow the next instructions to complete the steps of running the project locally:

- Delete this part of the code that is the DB connection inside index.js file:

```javascript
  const { Pool } = pg;
  const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  });
```

- Replace it with this inside index.js:
```javascript
const db = new pg.Client({
  user: 'your_database_user',
  host: 'your_database_host',
  database: 'your_database_name', // For example secrets
  password: 'your_database_password',
  port: your_database_port,
});
```

- Create a .env file for your local environment:
```javascript
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/secrets
```

- Run node index.js
- Visit the link http://localhost:3000/

# Website Screenshot:
 Home Page, you can either:
- Register: Create a new account using your email and password, or sign up with your Google account.
- Login: Access your existing account using your email and password, or log in with your Google account.

![1](https://github.com/shahedsaadi/Secrets/assets/108287237/566b7f0e-b96d-4bfa-96ec-2a704f986d78)

![2](https://github.com/shahedsaadi/Secrets/assets/108287237/ab7a97a1-b1d4-4f93-8961-b7c9892d9e39)

![5](https://github.com/shahedsaadi/Secrets/assets/108287237/5b5842d9-6bb7-475f-b22f-4c4883de963c)

Once registered or logged in, you will be authenticated and granted access to the Secrets page, where you can:

- Share Secrets: Post your own secrets anonymously.
- Explore Secrets: Read the anonymous secrets shared by others.
- Delete Secrets: Remove any secrets you have posted.

![se](https://github.com/shahedsaadi/Secrets/assets/108287237/49cf1b16-9162-4f2f-bae8-0120099abc28)

![end](https://github.com/shahedsaadi/Secrets/assets/108287237/a20cb592-91b0-4a9b-8db8-827c9940b07d)
