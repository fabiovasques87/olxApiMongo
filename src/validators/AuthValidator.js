const {checkSchema} = require('express-validator');


module.exports = {
    signup: checkSchema({
        name:{
            trim: true, //remove os espaços do começo e fim da string
            isLength:{
                options:{min:2}
            },
            errorMessage: 'O nome precisa ter pelomenos 2 caracteres'
        },
        email: {
            isEmail: true,
            normalizeEmail: true,
            errorMessage: 'E-mail inválido'
        },
        password:{
            isLength: {
                options: {min:2}
            },
            errorMessage: 'Senha precisa ter pelo menos 2 caracteres'
        },
        state: {
            notEmpty: true,
            errorMessage: 'Estado não preenchido'
        }
    })
};