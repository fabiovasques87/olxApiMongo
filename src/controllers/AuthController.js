const mongoose =  require('mongoose');
const bcrypt = require('bcrypt');

const {validationResult,matchedData } = require('express-validator');

const User = require('../models/User');
const State = require('../models/State');


module.exports = {
    signin: async (req, res) => {
        //processo de login:
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            //se não está vazio, quer dizer que deu erro...
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        //verificar se o usuário quer irá faze o login existe de fato no banco...
        //válida o e-mail
        const user = await User.findOne({email: data.email});

        if(!user){
            res.json({error: 'E-mail ou senha errados!'});
            return;
        }

        //válida a senha, se a senha que está sendo digitada é mesma que foi criptografada no banco
        const match = await bcrypt.compare(data.password, user.passwordHash);
        //Se foi inserida uma senha que não confere...
        if(!match){
            res.json({error: 'E-mail ou senha errados!'});
            return;
        }

        //gerar um token novo e salvar para esse usuário...
        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        user.token = token;
        await user.save();

        res.json({token, email: data.email});

    },
    signup: async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            //se não está vazio, quer dizer que deu erro...
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        //validar o e-mail...se já existe no banco 
        const user = await User.findOne({
            email: data.email
        });
        //se encontrou e-mail...
        if(user){
            res.json({
                error: {email:{msg: 'E-mail já existe!'}}
            });
            return;
        }


        //Verificar se estado já existe...
        if(mongoose.Types.ObjectId.isValid(data.state)){
            const stateItem = await State.findById(data.state);

            //se não encontrar nemhum registro....
            if(!stateItem){
                res.json({
                    error: {state:{msg: 'Estado não existe'}}
                });
                return;
            }

        }else {
            res.json({
                error: {state:{msg: 'Codigo de estado inválido'}}
            });
            return;
        }

        //criar o hasch da senha...
        const passwordHash = await bcrypt.hash(data.password, 10);
        //gerar o token de login...
        const payload = (Date.now() + Math.random()).toString();
        const token = await bcrypt.hash(payload, 10);

        //criar o usuário
        const newUser = new User({
            name: data.name,
            email: data.email,
            passwordHash,
            token,
            state: data.state
        });
        await newUser.save();

        res.json({token});

        res.json({tudocerto: true, data});
    }
};