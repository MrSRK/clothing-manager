const express=require('express')
const compression=require('compression')
const session=require('express-session')
const bodyParser=require('body-parser')
const logger=require('morgan')
const chalk=require('chalk')
const errorHandler=require('errorhandler')
const lusca=require('lusca')
const dotenv=require('dotenv')
const MongoStore=require('connect-mongo')(session)
const mongoose=require('mongoose')
const multer=require('multer')
const path=require('path')
const pug=require('pug')
//init
const upload=multer({dest:path.join(__dirname,'upload')})
dotenv.config({path:'.env'})
//Controllers

//Express
const app=express()
/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify',false)
mongoose.set('useCreateIndex',true)
mongoose.set('useNewUrlParser',true)
mongoose.connect(process.env.MONGODB_URI)
mongoose.connection.on('error',err=>
{
  console.error(err)
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'))
  process.exit()
});
/**
 * Express configuration.
 */
app.set('port',process.env.PORT||80)
app.set('views',path.join(__dirname,'views'))
app.set('view engine','pug')
app.use(compression())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie:{maxAge:1209600000},
    store: new MongoStore(
    {
        url:process.env.MONGODB_URI,
        autoReconnect: true,
    })
}))
app.use((req,res,next)=>
{
  if(req.path==='/api/upload')
    next()
  else
    lusca.csrf()(req, res, next)
})
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.disable('x-powered-by')
app.use('/',express.static(path.join(__dirname,'public')))
/**
 * Error Handler.
 */
if(process.env.NODE_ENV==='development')
    app.use(errorHandler());
else
    app.use((err,req,res,next)=>
    {
      console.error(err)
      res.status(500).send('Server Error')
    })
/**
 * Start Express server.
 */
app.listen(app.get('port'),()=>
{
    console.log('%s App is running at http://localhost:%d in %s mode',chalk.green('✓'),app.get('port'),app.get('env'))
    console.log('  Press CTRL-C to stop\n')
})