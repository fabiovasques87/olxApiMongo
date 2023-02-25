const State = require('../models/State');


module.exports = {
    getStates: async (req, res) => {
        //pega a lista de estados
        let states = await  State.find();
        res.json({states});
    },
    info: async (req, res) => {

    },
    editAction: async (req, res) => {

    }
};