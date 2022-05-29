// initialize mongodb
const TokenHistory = require('../server/models/token_history');
var configDB = require('../server/config/database');
const mongoose = require('mongoose');
const EnumChainId = require('../enum/chain.id');
console.log( configDB.url )
mongoose.connect(configDB.url, {
  autoIndex: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => { console.log('8MongoDB is connected') })
.catch(err => {
  console.log('MongoDB connection unsuccessful');
  console.log(err)
});


async function removeDuplicatesHistories(){
    var duplicates = [];

    let tokens = await TokenHistory.aggregate([
    { $group: { 
        _id: { $toLower: "$pair" }, // can be grouped on multiple properties 
        dups: { "$addToSet": "$_id" }, 
        docs: { $push: "$$ROOT" },
        count: { "$sum": 1 } 
    }},
    { $match: { 
        count: { "$gt": 1 }    // Duplicates considered as count greater than one
    }}
    ],
    {allowDiskUse: true}       // For faster processing if set is larger
    ).exec()           // You can display result until this and check duplicates 

    console.log('Found duplciates: ', tokens.length )

    tokens.forEach(function( token ) {
        let tokenDocs = token.docs;
        let maxPairs = 0;
        let index = 0;

        let doc1 = tokenDocs[0];
        let doc2 = tokenDocs[1];

        if( doc1.records_price == doc2.records_price ){
            if( doc1.pair != doc1.pair ) {
                duplicates.push(doc1._id);
            } else {
                duplicates.push(doc2._id);
            }
        } else {
            if( doc1.records_price > doc2.records_price ){
                duplicates.push(doc2._id);
            } else {
                duplicates.push(doc1._id);
            }
        }
        // console.log('MAX PAIRS: ', maxPairs, ' SPLICED: ', record )
    })

    // If you want to Check all "_id" which you are deleting else print statement not needed
    //console.log('All tokens: ', tokensCount);
    console.log( 'All duplicates: ', duplicates.length );
    let res = await TokenHistory.deleteMany({_id:{$in:duplicates}})  
    console.log('Deleted Histories: ', res)
}

module.exports = {
    removeDuplicatesHistories
}

