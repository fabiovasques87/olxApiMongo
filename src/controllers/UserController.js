const mongoose = require ('mongoose');
const bcrypt = require('bcrypt');
const {validationResult,matchedData } = require('express-validator');

const State = require('../models/State');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');



module.exports = {
    getStates: async (req, res) => {
        //pega a lista de estados
        let states = await  State.find();
        res.json({states});
    },
    info: async (req, res) => {

        let token = req.body.token;

        const user = await User.findOne({token});
        // const user = await User.findOne({});

        const state = await State.findById(user.state);
        const ads = await Ad.find({idUser: user._id.toString()}); //vai buscar os anuncios realacionados ao usuário em questão...

        //Montando o array dos anuncios
        let adList = [];
        for(let i in ads){

            const cat = await Category.findById(ads[i].category);

            // adList.push({
            //     id:ads[i]._id,
            //     status: ads[i].status,
            //     images:ads[i].images,
            //     dateCreated: ads[i].dateCreated,
            //     title: ads[i].title,
            //     price:ads[i].price,
            //     price: ads[i].price,
            //     priceNegotiable: ads[i].priceNegotiable,
            //     description: ads[i].description,
            //     views: ads[i].views,
            //     category: cat.slug
            // });

            adList.push({...ads[i], category: cat.slug }); //vai clonar o objeto acima...
        }



        res.json({
            name:  user.name,
            email: user.email,
            state: state.name,
            ads: adList
        });   
    },
    editAction: async (req, res) => {

        const errors = validationResult(req);

        if(!errors.isEmpty()){
            //se não está vazio, quer dizer que deu erro...
            res.json({error: errors.mapped()});
            return;
        }

        const data = matchedData(req);

        // const user = await User.findOne({token: data.token});

        let updates = {};

        if(data.name) { // se data.name estiver preenchido...
            updates.name = data.name;
        }

        //procurar alguém com o e-mail
        if(data.email){
            const emailCheck = await User.findOne({email: data.email});
            if(emailCheck){
                res.json({error: 'Email Já existe'});
                return;
            }
            updates.email = data.email; //faz a atualização do e-mail
        }

        if(data.state){
            if(mongoose.Types.ObjectId.isValid(data.state)){ //se for state válido
                //verifica se existe o id do state enviado....
                const stateCheck = await State.findById(data.state);
                if(!stateCheck){
                    //se não existir...
                    res.json({error:'Estado não existe'});
                    return;
                }
                updates.state = data.state; //faz a troca...
            }else {
                res.json({error:'Cod de estado inválido'});
                return;
            }
        }
        //trocar a senha
        if(data.password){
            //Criptografa a senha nova e manda pra frente...
            updates.passwordHash = await bcrypt.hash(data.password, 10);
        }
        
        await User.findOneAndUpdate({token: data.token}, {$set: updates});
        //ache um e atualize

        res.json({});
    }
};