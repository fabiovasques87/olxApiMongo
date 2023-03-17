//biblioteca uuid para gerar um codigo aleatório...
const {v4: uuid} = require('uuid');
//jimp: biblioteca de manipulação de imagens
const jimp = require('jimp');

const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require ('../models/Ad');
const StateModel = require ('../models/State');

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
        newAd.idUser = user._id;
        newAd.state = user.state;
        newAd.dateCreated = new Date();
        newAd.title = title;
        newAd.category = cat;
        newAd.price = price;
        newAd.priceNegotiable = (priceneg == 'true') ? true : false;
        newAd.description = desc;
        newAd.views = 0;

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
        //definir se a ordenação vai ser crescente ou ascendente
        let {sort = 'asc', offset = 0, limit = 8, q, cat, state } = req.query;
        let filters = {status: true};
        let total = 0;

        //trabalhando com filtros
        if(q){
            filters.title = {'$regex': q,'$options': 'i'}; //primeiro filtro
        }
        if(cat){
            const c = await Category.findOne({slug: cat}).exec(); //segundo filtro, procurar a categoria que o slug for cat
            if(c){
                filters.category = c._id.toString();    
            }
        }

        if(state){
            const s = await StateModel.findOne({name: state.toUpperCase()}).exec(); //terceiro filtro
            //se encontrou estados...
            if(s){
                filters.state = s._id.toString();
            }
        }

        //sabendo a quantidade total de anuncios
        const adsTotal = await Ad.find(filters).exec();
        total = adsTotal.length;


        //pegar os anuncios
        const adsData = await Ad.find(filters)
            .sort({dateCreated: (sort == 'desc'? -1 : 1 )})
            .skip(parseInt(offset))     //paginacao...e transforma em inteiro
            .limit(parseInt(limit))
        
        .exec(); //pegar do banco os anuncios com sstatus, true
        let ads = [];
        for(let i in adsData){

            //montar a imagem padrão
            let image;

            let defaultImg = adsData[i].images.find(e => e.default);
            //verificar se existe a imagem padrão
            if(defaultImg){
                image = `${process.env.BASE}/media/${defaultImg.url}`;
            }else{
                //se não tiver um arquivo padrão...
                image = `${process.env.BASE}/media/defaul.jpg`;
            }

            ads.push({
                //vai adicionar cada um dos itens...
                id: adsData[i]._id,
                title:adsData[i].title,
                price:adsData[i].price,
                priceNegotiable: adsData[i].priceNegotiable,
                image
            });
        }
        res.json({ads, total});

    },
    getItem: async (req, res) => {
        //pode ser que o produto venha so ele, então a opcao other pode nao vir...
        let {id, other = null} = req.query;
        if(!id){
            res.json({erro:'Sem produto'});
            return; //return para finalizar a execucao
        }
        if(id.length < 12){
        
            res.json({error: 'ID Inválido'});
            return;
        }
        const ad = await Ad.findById(id);
        //se não encontrou nada...
        if(!ad){
            res.json({error: 'Produto inexistente'});
            return;
        }
        //contador de visitas no determinado produto
        ad.views++;
        await ad.save;

        //pegar as imagens do determinado produto...
        let images = [];
        //montar a url completa...
        for(let i in ad.images){
            images.push(`${process.env.BASE}/media/${ad.images[i].url}`);
        }

        let category = await Category.findById(ad.category).exec();
        let userInfo = await User.findById(ad.idUser).exec();
        let stateInfo = await StateModel.findById(ad.state).exec();

        //Montar o json de retorno
        res.json({
            id: ad._id,
            title: ad.title,
            price: ad.price,
            priceNegotiable: ad.priceNegotiable,
            description: ad.description,
            dateCreated: ad.dateCreated,
            views: ad.views,
            images,
            category,
            userInfo,
            // : {
            //     // name: userInfo.name,
            //     // email: userInfo.email
            // },
            StateModel

        });
    },  
    editAction: async (req, res) => {
        
    }
};