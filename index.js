const HTTP = require('http');
const CORS = require('cors');
const JWT = require('jsonwebtoken');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const DB = require('./controllers/dbConnect');
const createUser = require('./controllers/user/createUser');
const getUser = require('./controllers/user/getUser');
const listUsers = require('./controllers/user/listUsers');
const doLogin = require('./controllers/user/doLogin');
const { userInfo } = require("os");

app.use(bodyParser.json());
app.use(CORS());

app.get('/', (req, res) => {
    DB().then(response => {
        console.info("API - Initialization: Conectado ao banco de dados");
        res.json({
            message: 'Server is running'
        })
    });
})

app.post('/createUser', (req, res) => {

    console.info("API - Create User: Iniciando processo de criação de usuário");

    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let subscriptionType = req.body.subscriptionType;

    if (password !== confirmPassword) {
        console.error("API - Create User: Senhas não conferem");
        res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        })
    } else {
        createUser(name, email, password, subscriptionType).then(response => {
            if(response.errors) {
                console.error("API - Create User: Erro ao criar usuário");
                res.status(400).json({
                    success: false,
                    message: 'Error while creating user',
                    errors: response.errors
                })
            } else {
                console.info("API - Create User: Usuário criado com sucesso");
                res.json({
                    success: true,
                    message: 'User created successfully'
                })
            }
        })
    }
})

app.post('/getUserData', (req, res) => {

    console.info("API - Get User Data: Iniciando processo de busca de usuário");

    let id = req.body.userId;
    getUser(id).then(response => {
        if(!response) {
            console.error("API - Get User Data: Usiário não encontrado");
            res.status(400).json({
                success: false,
                message: 'User not found'
            })
        } else {
            console.info("API - Get User Data: Usuário encontrado");
            res.json({
                success: true,
                userId: response.dataValues.userId,
                name: response.dataValues.name,
                email: response.dataValues.email,
                subscriptionType: response.dataValues.subscriptionType
            })
        }
    })
})

app.post('/authenticate', (req, res) => {

    console.info("API - Authenticate: Iniciando processo de autenticação");

    let email = req.body.email;
    let password = req.body.password;

    doLogin(email, password).then(response => {
        if(!response) {
            console.error("API - Authenticate: Erro ao autenticar usuário");
            res.status(400).json({
                success: false,
                message: 'User not found or password is incorrect'
            })
        } else {
            console.info("API - Authenticate: Usuário autenticado com sucesso");

            const userId = response.dataValues.userId;
            const token = JWT.sign({userId}, process.env.SECRET, {expiresIn: '1m'});

            res.json({
                success: true,
                userId: response.dataValues.userId,
                token: token
            })
        }
    })

})

app.post('/checkSession', (req, res) => {
    const token = req.body.token;
    const userId = req.body.userId;

    if(!token) {
        console.error("API - Check Session - Erro ao verificar sessão: token não informado");
        res.status(400).json({
            success: false,
            message: 'Token not provided'
        })
    } else {
        JWT.verify(token, process.env.SECRET, (err, decoded) => {
            if(err) {
                console.error("API - Check Session - Erro ao verificar sessão: sessão expirada");
                res.status(400).json({
                    success: false,
                    message: 'Invalid token'
                })
            } else {
                if(decoded.userId === userId) {
                    console.info("API - Check Session: Sessão verificada com sucesso");

                    getUser(userId).then(response => {
                        res.json({
                            success: true,
                            message: 'Session verified',
                            userInfo: {
                                userId: response.dataValues.userId,
                                name: response.dataValues.name,
                                email: response.dataValues.email,
                                subscriptionType: response.dataValues.subscriptionType
                            }
                        })
                    })
                } else {
                    console.error("API - Check Session - Erro ao verificar sessão: UID inválido");
                    res.status(400).json({
                        success: false,
                        message: 'Invalid UID'
                    })
                }
            }
        })
    }
})

const server = HTTP.createServer(app);
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});