This is the application for the [Shopify Backend Developer Intern Challenge - Fall 2021](https://docs.google.com/document/d/1ZKRywXQLZWOqVOHC4JkF3LqdpO3Llpfk_CkZPR8bjak/edit).

You can see it running [here](https://leo.rezoleo.fr).

This application was made using [AdonisJS](https://adonisjs.com)

After beeing registered, you can add image to your account with a price and chose to sell it, you can also edit/delete images. Images to sell are displayed on the front page and you can buy them if you have enough in your balance. You start with $100 in your balance.

[SQLite](https://www.sqlite.org/index.html) was used for the database. It eases the local setup of the application and was good enough for this.

If you wish to run it locally, you need to

- Clone the repository
- Install the dependencies: `npm install`
- Run the migrations: `node ace migration:run`
- Run the development server: `npm run dev`

There is also tests and tests coverage that you can run with `npm run test` and `npm run coverage`.

A quick overview of the project structure. This project follow the MVC principle so you will find Models, Controllers, Views and a Router.

- `app/controllers`: the controllers of the application
- `app/models`: the models of the application
- `resources/views`: the views of the application
- `start/routes.ts`: this is where we register our routes
- `database/migrations`: the migrations for the database schema
- `test`: test folder
