const mongoose=require("mongoose")
const postschema=mongoose.Schema({
    user:
    
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    caption:{
        type:String
    }
    ,
   
    date:{
        type:Date,
        default:Date.now
    },
    image:
        {
            type:String,
           
        }
    ,
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        }
    ],
    Comments:[{
        type:Array,
        default:[]
    }]
})

module.exports=mongoose.model("post",postschema);