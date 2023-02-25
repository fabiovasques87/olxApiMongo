const User = require('../models/User');


module.exports ={
    private: async (req, res, next) => {

        //se não enviou o token nem na query nem no bady...
        if(!req.query.token && !req.body.token){
            res.json({notallowed: true});
            return;
        }
        //Verificar se o token é válido
        let token = '';
        //se recebeu da query...
        if(req.query.token) {
            token = req.query.token;
        }
        //se recebeu do body...
        if(req.body.token){
            token = req.body.token;
        }
        //se mandou alguma coisa...
        if(token = ''){
            res.json({notallowed: true});
            return;
        }
        //verificar se é token válido...

        const user = await User.findOne({token});
        //verifica se não achou o user...
        if(!user){
            res.json({notallowed: true});
            return;
        }
        next();
    }
}