//biblioteca uuid para gerar um codigo aleatório...
const {v4: uuid} = require('uuid');
//jimp: biblioteca de manipulação de imagens
const jimp = require('jimp');

const Category = require('../models/Category');
const User = require('../models/Category');
const Ad = require ('../models/Ad');

//função para manipular a imagem...
const addImage = async (Buffer) =>{
    let newName = `${uuid()}.jpg`;   //nome da imagem...
    let tmpImg =    await jimp.read(Buffer);//ler o buffer da imagem com o jimp, tmpImg: imagem temporaria

    //de posse da imagem...
    tmpImg.cover(500, 500).quality(80).write(`./public/media/${newName}`);  //redimenciona a imagem,ajusta qualidade e salva ela no public
    return newName;
}


module.exports = {
    getCategories: async (req, res) => {
        //pega todas as categorias
        const cats = await Category.find();
        //cria a variavel para retornar ela...
        let categories = [];
        //faz o preenchimento
        for(let i in cats){
            categories.push({
                //clonar cats
                ...cats[i]._doc,
                //monta a url que será retornada com o havatar da categoria
                img: `${process.env.BASE}/assets/images/${cats[i].slug}.png`
            });
        }
        res.json({categories});//retorna as categorias montadas

    },
    addAction: async (req, res) => {
        let {title, price, priceneg, desc, cat, token} = req.body;
        const user = await User.findOne({token}).exec();

        //fazer as verificações, se não temos o titulo e a categoria
        if(!title || !cat){ //titulo e categoria são obrigatórios
            res.json({error: 'Titulo e/ou ou categoria não foram preenchidos'});
            return; //para parar a execução
        }
        //se mandou algum price...
        if(price){
            //vai ser formatado para inserir no banco
            //irá receber ex. assim: R$ 8.000,35 e transformar para: 8000.35 para salvar no banco
            price = price.replace('.','').replace(',','.').replace('R$ ',''); //substitui o ponto por nada
            price = parseFloat(price); //converte o price para float...

        }else {
            //se não tiver price...
            price = 0;
        }
        //fazer a adição do anuncio no banco
        const newAd = new Ad();
        newAd.status = true;
        newAd.idUser = User._id;
        newAd.state = User.state;
        newAd.dateCreated = new Date();
        newAd.title = title;
        newAd.Category = cat;
        newAd.price = price;
        newAd.priceNegotiable = (priceneg == 'true') ? true : false;
        newAd.description = desc;
        newAd.viwes = 0;

        //lidando com as imgens...
        //se mandou alguma imagem...
        if(req.files && req.files.img){
            //quer dizer que enviou imagens...
                if(req.files.img.length == undefined){ 
                    if(['image/jpeg', 'image/jpg','image/png'].includes(req.files.img.mimetype)){
                        let url = await addImage(req.files.img.data);
                        newAd.images.push({                
                            url,
                            default: false
                        });
                    }
                }else {
                    //quer dizer que tem várias imagens...
                    for(let i = 0; i < req.files.img.length; i++ ){
                        if(['image/jpeg', 'image/jpg','image/png'].includes(req.files.img[i].mimetype)){
                            let url = await addImage(req.files.img[i].data);
                            newAd.images.push({                
                                url,
                                default: false
                            });
                        }
                    }
                }
            } 

        if(newAd.images.length > 0){
            //se tiver uma ou mais images adicionadas, pega a primeir
            newAd.images[0].default= true;
        }


        const info = await newAd.save(); //salva o anuncio e terá o ID dele para retornar...
        res.json({id: info._id});
    },
    getList: async (req, res) => {
        
    },
    getItem: async (req, res) => {
        
    },
    editAction: async (req, res) => {
        
    }
};