const HTTP = require('http');
const CORS = require('cors');
const JWT = require('jsonwebtoken');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

const DB = require('./controllers/dbConnect');
const createUser = require('./controllers/user/createUser');
const getUser = require('./controllers/user/getUser');
const doLogin = require('./controllers/user/doLogin');
const listUsers = require('./controllers/user/listUsers');

const validateEmail = (email) => {
    const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/i;
    return emailRegex.test(email);
}

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/;
    return passwordRegex.test(password);
}

app.use(bodyParser.json());
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    app.use(CORS());
    next();
});

app.get('/', (req, res) => {
    DB().then(() => {
        console.info("API - Initialization: Conectado ao banco de dados");
        res.json({
            message: 'Server is running'
        })
    });
})

app.post('/createUser', (req, res) => {
    DB().then(() => {
        console.info("API - Create User: Conectado ao banco de dados");

        console.info("API - Create User: Iniciando processo de criação de usuário");

        let name = req.body.name;
        let email = req.body.email;
        let password = req.body.password;
        let confirmPassword = req.body.confirmPassword;
        let subscriptionType = req.body.subscriptionType;

        console.log({
            name,
            email,
            password,
            confirmPassword,
            subscriptionType
        })

        if (password !== confirmPassword) {
            console.error("API - Create User: Senhas não conferem");
            res.json({
                errorId: 1,
                success: false,
                message: 'Passwords do not match'
            })
        } else if (!validateEmail(email)) {
            console.error("API - Create User: Email inválido");
            res.json({
                errorId: 2,
                success: false,
                message: 'Email is invalid'
            })
        } else if (!validatePassword(password)) {
            console.error("API - Create User: Senha inválida");
            res.json({
                errorId: 3,
                success: false,
                message: 'Password is invalid'
            })
        } else {
            createUser(name, email, password, subscriptionType).then(response => {
                if(response.errors) {
                    console.error("API - Create User: Erro ao criar usuário");
                    
                    if(response.errors[0].message === "email must be unique") {
                        res.json({
                            errorId: 4,
                            success: false,
                            message: 'Email must be unique'
                        })
                    }

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

    
})

app.get('/listUsers', (req, res) => {
    DB().then(() => {
        console.info("API - List Users: Conectado ao banco de dados");
    }).catch(error => {
        console.error("API - List Users: Erro ao conectar ao banco de dados");
        res.status(500).json({
            success: false,
            message: 'Error while connecting to database'
        })
    }).then(() => {
        listUsers().then(response => {
            if(response.errors) {
                console.error("API - List Users: Erro ao listar usuários");
                res.json({
                    success: false,
                    message: 'Error while listing users',
                    errors: response.errors
                })
            } else {
                console.info("API - List Users: Usuários listados com sucesso");
                res.json({
                    success: true,
                    message: 'Users listed successfully on server log'
                })
            }
        })
    }).catch(error => {
        console.error("API - List Users: Erro ao listar usuários");
        res.status(500).json({
            success: false,
            message: 'Error while listing users'
        })
    })
})

app.post('/getUserData', (req, res) => {
    DB().then(() => {
        console.info("API - Get User Data: Conectado ao banco de dados");
    })

    console.info("API - Get User Data: Iniciando processo de busca de usuário");

    let id = req.body.userId;
    getUser(id).then(response => {
        if(!response) {
            console.error("API - Get User Data: Usiário não encontrado");
            res.json({
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
            res.json({
                success: false,
                message: 'User not found or password is incorrect'
            })
        } else {
            console.info("API - Authenticate: Usuário autenticado com sucesso");

            const userId = response.dataValues.userId;
            const token = JWT.sign({userId}, process.env.SECRET, {expiresIn: '1d'});

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

    DB().then(() => {
        console.info("API - Check Session: Conectado ao banco de dados");
    })

    if(!token) {
        console.error("API - Check Session - Erro ao verificar sessão: token não informado");
        res.json({
            success: false,
            message: 'Token not provided'
        })
    } else {
        JWT.verify(token, process.env.SECRET, (err, decoded) => {
            if(err) {
                console.error("API - Check Session - Erro ao verificar sessão: sessão expirada");
                res.json({
                    success: false,
                    message: 'Invalid token'
                })
            } else {
                if(decoded.userId == userId) {
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
                    res.json({
                        success: false,
                        message: 'Invalid UID'
                    })
                }
            }
        })
    }
})

const server = HTTP.createServer(app);
server.listen(process.env.PORT || 4000, () => {
    console.log(`Server is running on port ${process.env.PORT || 4000}`);
});